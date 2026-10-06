(() => {
  'use strict';
  const canvas = document.querySelector('#universe'), ctx = canvas.getContext('2d');
  const $ = s => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)');
  const mobile = matchMedia('(max-width: 800px), (max-height: 500px) and (pointer: coarse)');
  const stage = $('#particle-space');
  let activePointer = null, home = { x: 0, y: 0, radius: 0 };
  let w, h, dpr, time = 0, last = 0, paused = reduced, energy = .4, nurture = 0, held = false;
  let pointer = { x: 0, y: 0, active: false }, center = { x: 0, y: 0 }, rgb = [157,235,220], targetRGB = [...rgb], rings = [];
  const motes = Array.from({length: touch.matches ? 900 : 1500}, (_, i) => ({u: Math.random()*Math.PI*2, v: Math.acos(2*Math.random()-1), shell: .78+Math.random()*.23, size: .35+Math.random()*1.2, phase: Math.random()*Math.PI*2}));
  const stars = Array.from({length: 100}, () => ({x:Math.random(),y:Math.random(),a:Math.random()*.2,r:Math.random()*.65+.2}));
  function measureStage() {
    if (mobile.matches) {
      const rect = stage.getBoundingClientRect();
      home = {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, radius: Math.min(rect.width * .23, rect.height * .26)};
    } else home = {x: w * .64, y: h * .44, radius: Math.min(w * .13, h * .235)};
    center.x = home.x; center.y = home.y;
    if (paused && w && h) draw(0);
  }
  function resize() { w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,touch.matches?1.5:2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);measureStage(); }
  function color(a) {return `rgba(${rgb.map(Math.round).join(',')},${a})`;}
  function glow(x,y,r,a) {const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color(a));g.addColorStop(.22,color(a*.5));g.addColorStop(.55,color(a*.12));g.addColorStop(1,color(0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function draw(dt) {
    time += dt;rgb=rgb.map((c,i)=>c+(targetRGB[i]-c)*Math.min(1,dt*4));
    nurture += ((held?1:0)-nurture)*Math.min(1,dt*(held?1.2:2));
    const homeX=home.x,homeY=home.y;
    const attraction = mobile.matches ? .1 : .18;
    const tx=homeX+(pointer.active?(pointer.x-homeX)*attraction:0),ty=homeY+(pointer.active?(pointer.y-homeY)*attraction:0);
    center.x+=(tx-center.x)*Math.min(1,dt*1.8);center.y+=(ty-center.y)*Math.min(1,dt*1.8);
    ctx.globalCompositeOperation='source-over';ctx.fillStyle='#07090b';ctx.fillRect(0,0,w,h);
    for(const s of stars){ctx.fillStyle=`rgba(180,209,201,${s.a*(.65+.35*Math.sin(time*.5+s.x*20))})`;ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fill();}
    const base=home.radius,r=base*(.82+energy*.35+nurture*.6)*(1+.025*Math.sin(time*1.4));
    ctx.globalCompositeOperation='lighter';glow(center.x,center.y,r*2.7,.045+energy*.05+nurture*.06);glow(center.x,center.y,r*1.05,.16+energy*.16+nurture*.18);
    const projected=[];
    for(const p of motes){const az=p.u+time*(.08+energy*.04);const wave=1+.07*Math.sin(p.v*6+az*4+time)+.035*Math.cos(p.v*11-time*1.2);let x=Math.sin(p.v)*Math.cos(az),z=Math.sin(p.v)*Math.sin(az),y=Math.cos(p.v);const tilt=.28;const yy=y*Math.cos(tilt)-z*Math.sin(tilt);z=y*Math.sin(tilt)+z*Math.cos(tilt);y=yy;const perspective=1/(1-z*.18),rr=r*p.shell*wave;projected.push({x:center.x+x*rr*perspective,y:center.y+y*rr*perspective,z,size:p.size,p});}
    projected.sort((a,b)=>a.z-b.z);
    for(const q of projected){const a=(.11+(q.z+1)*.25)*(1+energy*.3);ctx.fillStyle=color(a);ctx.beginPath();ctx.arc(q.x,q.y,q.size*(.5+(q.z+1)*.35),0,Math.PI*2);ctx.fill();if(q.z>.6&&q.p.size>1.35){glow(q.x,q.y,5,a*.13);}}
    // Flowing filaments trace the surface of the living particle.
    for(let band=0;band<15;band++){ctx.beginPath();for(let j=0;j<=180;j++){const a=j/180*Math.PI*2;const spin=time*.09+band*.19;const lat=(band/14-.5)*2.5;const rr=r*Math.cos(lat)*(1+.065*Math.sin(a*4+lat*6+time));const x=Math.cos(a+spin)*rr,y=Math.sin(lat)*r*.91+Math.sin(a+spin)*rr*.22;const px=center.x+x,py=center.y+y;if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.strokeStyle=color(.035+energy*.025);ctx.lineWidth=.65;ctx.stroke();}
    glow(center.x-r*.18,center.y-r*.1,r*.48,.12+energy*.13);
    for(const ring of rings){ring.age+=dt;const k=ring.age/2.1;ctx.beginPath();ctx.ellipse(center.x,center.y,r*(1+k*3),r*(1+k*3)*.85,-.2,0,Math.PI*2);ctx.strokeStyle=color(Math.max(0,(1-k)*.35));ctx.lineWidth=1;ctx.stroke();}rings=rings.filter(q=>q.age<2.1);
    if(pointer.active){const distance=Math.hypot(pointer.x-center.x,pointer.y-center.y);if(distance<r*2.8){glow(pointer.x,pointer.y,held?35:16,held?.12:.07);ctx.beginPath();ctx.arc(pointer.x,pointer.y,held?7:3,0,Math.PI*2);ctx.strokeStyle=color(.5);ctx.lineWidth=.7;ctx.stroke();}}
    ctx.globalCompositeOperation='source-over';
  }
  function frame(ts){const dt=Math.min((ts-last)/1000||0,.035);last=ts;if(!paused)draw(dt);requestAnimationFrame(frame);}
  function setColor(hex,name){targetRGB=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));document.documentElement.style.setProperty('--accent',hex);$('#color-name').textContent=name;$('#custom-color').value=hex;document.querySelectorAll('.swatch').forEach(b=>{const yes=b.dataset.color===hex;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',yes)});try{localStorage.setItem('aether-color',JSON.stringify({hex,name}));}catch{}if(paused){rgb=[...targetRGB];draw(0);}}
  function pulse(){rings.push({age:0});if(paused)draw(0);}
  const onSurface = (type, handler) => [canvas, stage].forEach(surface => surface.addEventListener(type, handler));
  onSurface('pointermove',e=>{
    if (activePointer !== null && activePointer !== e.pointerId) return;
    if (e.pointerType === 'touch' && activePointer === null) return;
    pointer={x:e.clientX,y:e.clientY,active:true};
  });
  onSurface('pointerdown',e=>{
    if (activePointer !== null || e.isPrimary === false || e.button !== 0) return;
    activePointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);
    pointer={x:e.clientX,y:e.clientY,active:true};held=true;$('#state').textContent='GROWING WITH YOU';
  });
  function release(e, bloom=true) {
    if (e && e.pointerId !== activePointer) return;
    activePointer=null;
    if(held){held=false;if(bloom)pulse();$('#state').textContent='QUIETLY ALIVE';}
    if (!e || e.pointerType !== 'mouse') pointer.active=false;
  }
  onSurface('pointerup',e=>release(e));
  onSurface('pointercancel',e=>release(e,false));
  onSurface('lostpointercapture',e=>release(e,false));
  onSurface('pointerleave',()=>{if(activePointer===null)pointer.active=false;});
  onSurface('contextmenu',e=>e.preventDefault());
  window.addEventListener('blur',()=>release(null,false));
  document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>setColor(b.dataset.color,b.dataset.name)));
  $('#custom-color').addEventListener('input',e=>setColor(e.target.value,'Your frequency'));
  $('#energy').addEventListener('input',e=>{energy=+e.target.value/100;$('#energy-value').textContent=e.target.value+'%';if(paused)draw(0);});
  $('#bloom').addEventListener('click',pulse);
  function pauseLabel(){$('#pause').textContent=paused?'▶':'Ⅱ';$('#pause').setAttribute('aria-label',paused?'Resume animation':'Pause animation');$('#pause').title=paused?'Resume animation':'Pause animation';$('#presence').textContent=paused?'A moment of stillness':'Your presence changes everything';}
  $('#pause').addEventListener('click',()=>{paused=!paused;pauseLabel();});
  $('#reset').addEventListener('click',()=>{release(null,false);energy=.4;nurture=0;rings=[];pointer.active=false;$('#energy').value=40;$('#energy-value').textContent='40%';$('#state').textContent='QUIETLY ALIVE';setColor('#9debdc','Glacier');resize();});
  try{const saved=JSON.parse(localStorage.getItem('aether-color'));if(saved&&/^#[0-9a-f]{6}$/i.test(saved.hex))setColor(saved.hex,saved.name||'Your frequency');}catch{}
  function updateHint() { $('#attract-hint').textContent=touch.matches?'Drag to attract':'Move to attract'; }
  touch.addEventListener('change',updateHint);updateHint();
  addEventListener('resize',resize);
  addEventListener('scroll',()=>{if(mobile.matches)measureStage();},{passive:true});
  window.visualViewport?.addEventListener('resize',resize);
  new ResizeObserver(measureStage).observe(stage);
  resize();pauseLabel();draw(0);requestAnimationFrame(frame);
})();
