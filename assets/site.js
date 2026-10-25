/* Accessible, dependency-free interactions. Visuals are decorative and never gate content. */
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  // Theme: default dark to preserve the original portfolio's visual language.
  const themeButton = $('#themeToggle');
  const savedTheme = (() => { try { return localStorage.getItem('rkp-theme'); } catch { return null; } })();
  if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;
  function syncTheme() {
    if (!themeButton) return;
    const isDark = root.dataset.theme !== 'light';
    themeButton.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    themeButton.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  syncTheme();
  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    syncTheme();
    window.dispatchEvent(new Event('rkp-theme-change'));
    try { localStorage.setItem('rkp-theme', next); } catch {}
  });

  // Mobile navigation.
  const menuButton = $('#mobileMenu');
  const menu = $('#navLinks');
  function closeMenu() {
    menu?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation menu');
  }
  menuButton?.addEventListener('click', () => {
    const open = menu?.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(!!open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });
  $$('a', menu || document.createElement('div')).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => {
    if (menu?.classList.contains('open') && !event.target.closest('.nav')) closeMenu();
  });

  // Project category filters; original HTML remains visible without JavaScript.
  const filters = $$('.filter[data-filter]');
  const projectCards = $$('.project-card[data-category]');
  const filterStatus = $('#filterStatus');
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let visible = 0;
    projectCards.forEach(card => {
      const show = category === 'all' || (card.dataset.category || '').split(' ').includes(category);
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (filterStatus) filterStatus.textContent = `Showing ${visible} work ${visible === 1 ? 'area' : 'areas'}.`;
  }));

  // Public, conceptual example. No employer architecture or configuration described.
  const stages = [
    { name: 'Question', type: '01 / INPUT', copy: 'A person asks a question or provides information. The first task is to understand what is being requested.' },
    { name: 'Context', type: '02 / PREPARATION', copy: 'Relevant information may help clarify the question, while its sources and limitations remain important.' },
    { name: 'Model', type: '03 / GENERATION', copy: 'A language model produces a response. This is a generic illustration, independent of any specific implementation.' },
    { name: 'Review', type: '04 / CHECKS', copy: 'A user or application can consider clarity, correctness, and safety before relying on an answer.' },
    { name: 'Reply', type: '05 / OUTPUT', copy: 'The result reaches the person, who can ask a follow-up or correct missing context.' }
  ];  const stepButtons = $$('.flow-step[role="tab"]');
  const stageType = $('#stageType');
  const stageTitle = $('#stageTitle');
  const stageCopy = $('#stageCopy');
  const stageCounter = $('#stageCounter');
  const traceBtn = $('#traceButton');
  let selectedStage = 0;
  let traceTimer = null;
  function setStage(index, focus = false) {
    if (!stepButtons.length) return;
    selectedStage = ((index % stages.length) + stages.length) % stages.length;
    stepButtons.forEach((button, i) => {
      const active = selectedStage === i;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    if (stageType) stageType.textContent = stages[selectedStage].type;
    if (stageTitle) stageTitle.textContent = stages[selectedStage].name;
    if (stageCopy) stageCopy.textContent = stages[selectedStage].copy;
    if (stageCounter) stageCounter.textContent = String(selectedStage + 1).padStart(2, '0') + ' / 05';
    $('#stagePanel')?.setAttribute('aria-labelledby', `step-${selectedStage}`);
    if (focus) stepButtons[selectedStage].focus();
  }
  stepButtons.forEach((button, index) => {
    button.addEventListener('click', () => { clearTrace(); setStage(index); });
    button.addEventListener('keydown', event => {
      if (['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault(); clearTrace();
        let next = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index + 1;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index - 1;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = stages.length - 1;
        setStage(next, true);
      }
    });
  });
  function clearTrace() {
    if (traceTimer !== null) { clearInterval(traceTimer); traceTimer = null; }
    traceBtn?.removeAttribute('data-playing');
    if (traceBtn) traceBtn.textContent = 'Play walkthrough  →';
  }
  traceBtn?.addEventListener('click', () => {
    if (traceTimer !== null) { clearTrace(); return; }
    if (reducedMotion.matches) { setStage(selectedStage + 1); return; }
    setStage(0);
    traceBtn.dataset.playing = 'true';
    traceBtn.textContent = 'Stop walkthrough  ×';
    let idx = 0;
    traceTimer = window.setInterval(() => {
      idx += 1;
      if (idx >= stages.length) { clearTrace(); return; }
      setStage(idx);
    }, 1000);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTrace(); });

  // Nonessential scroll polish.
  const progress = $('#readingProgress');
  let scrollQueued = false;
  function updateProgress() {
    scrollQueued = false;
    if (!progress) return;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = `${Math.min(100, Math.max(0, window.scrollY / max * 100))}%`;
  }
  if (progress) {
    window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateProgress); } }, {passive:true});
    window.addEventListener('resize', updateProgress, {passive:true});
    updateProgress();
  }
  const revealables = []; // Editorial pages do not hide content until scrolling.
  if (revealables.length && 'IntersectionObserver' in window && !reducedMotion.matches) {
    root.classList.add('js-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } });
    }, {rootMargin:'0px 0px -35px 0px', threshold:.07});
    revealables.forEach(el => observer.observe(el));
  }

  // Animated neural sphere. Pure Canvas 2D, no WebGL or third-party dependency.
  const canvas = $('#orbCanvas');
  const motionButton = $('#motionButton');
  if (!canvas) return;
  const stage = canvas.parentElement;
  const context = canvas.getContext('2d', {alpha:true});
  if (!context) return;
  const media = window.matchMedia('(max-width:690px)');
  let w = 0, h = 0, dpr = 1, onScreen = true, raf = 0;
  let motionPaused = reducedMotion.matches;
  let yaw = 0.4, pitch = -0.19, targetYaw = 0.4, targetPitch = -0.19, baseYaw = 0;
  let previousFrame = 0, seconds = 0;
  const stars = [];
  // Spherical points, connected by latitudes, longitudes, and a few subtle diagonals.
  const N_LAT = 14, N_LON = 36;
  for (let a = 0; a <= N_LAT; a++) {
    const lat = -Math.PI/2 + a * Math.PI/N_LAT;
    for (let b = 0; b < N_LON; b++) {
      const lon = b * Math.PI*2/N_LON;
      stars.push({x:Math.cos(lat)*Math.cos(lon), y:Math.sin(lat), z:Math.cos(lat)*Math.sin(lon), a,b});
    }
  }
  function resize() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    w = rect.width; h = rect.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }
  function project(p, r) {
    const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
    const x1=p.x*cy+p.z*sy, z1=-p.x*sy+p.z*cy;
    const y2=p.y*cp-z1*sp, z2=p.y*sp+z1*cp;
    const perspective = 1 + z2*.085;
    return {x:w*.5+x1*r*perspective, y:h*.50+y2*r*perspective, z:z2};
  }
  function draw() {
    if (!w || !h) return;
    const light = root.dataset.theme === 'light';
    const rgb = light ? '38,92,58' : '198,242,140';
    const lineRgb = light ? '38,92,58' : '145,210,147';
    context.clearRect(0,0,w,h);
    const r = Math.min(w*.34,h*.385);
    const cx=w*.5, cy=h*.5;
    // Orbital arcs remain very subtle so labels and main content stay legible.
    context.save(); context.translate(cx,cy); context.rotate(-.36);
    context.strokeStyle=`rgba(${lineRgb},${light?.15:.13})`;
    context.lineWidth=.85;
    for (const [scale,shape] of [[1.42,.48],[1.18,.87]]) {
      context.beginPath();context.ellipse(0,0,r*scale,r*shape,0,.05,Math.PI*1.92);context.stroke();
    }
    context.restore();
    const p = stars.map(s=>project(s,r));
    // Back-face points remain visible as faint wireframe; front-facing points glow gently.
    context.lineWidth=.78;
    for (let a=0; a<=N_LAT; a++) {
      context.beginPath();
      for (let b=0; b<=N_LON; b++) {
        const v=p[a*N_LON+(b%N_LON)];
        if (b===0)context.moveTo(v.x,v.y); else context.lineTo(v.x,v.y);
      }
      context.strokeStyle=`rgba(${lineRgb},${light?.10:.115})`;context.stroke();
    }
    for (let b=0;b<N_LON;b+=2) {
      context.beginPath();
      for(let a=0;a<=N_LAT;a++) {
        const v=p[a*N_LON+b]; if(a===0)context.moveTo(v.x,v.y);else context.lineTo(v.x,v.y);
      }
      context.strokeStyle=`rgba(${lineRgb},${light?.13:.14})`;context.stroke();
    }
    // Light front-facing edges add structure without a dense luminous ball.
    for(let a=1;a<N_LAT;a++) for(let b=0;b<N_LON;b++) {
      const i=a*N_LON+b, v=p[i];
      if(v.z < .1 || (a+b)%3!==0)continue;
      const v2=p[a*N_LON+(b+1)%N_LON];
      context.beginPath();context.moveTo(v.x,v.y);context.lineTo(v2.x,v2.y);
      context.strokeStyle=`rgba(${rgb},${(.12+v.z*.13).toFixed(3)})`;context.lineWidth=.7;context.stroke();
    }
    for(let i=0;i<p.length;i++){
      const v=p[i]; if(i%3!==0)continue;
      const front = Math.max(0,(v.z+1)/2);
      const major = i%39===0;
      context.beginPath();context.arc(v.x,v.y,major?2.0:front>.47?1.0:.6,0,Math.PI*2);
      context.fillStyle=`rgba(${rgb},${(major?.32+front*.38:.10+front*.29).toFixed(3)})`;context.fill();
    }
    // Five roaming signal points, each phase-offset along latitude bands.
    for(let k=0;k<5;k++) {
      const angle = seconds*(.20+k*.023)+k*1.31;
      const lat = Math.sin(seconds*.14+k*1.37)*.63;
      const v=project({x:Math.cos(lat)*Math.cos(angle),y:Math.sin(lat),z:Math.cos(lat)*Math.sin(angle)},r);
      const alpha=Math.max(.16,.35+v.z*.24);
      const grd=context.createRadialGradient(v.x,v.y,0,v.x,v.y,12);
      grd.addColorStop(0,`rgba(${rgb},${light?.25:.65*alpha})`);
      grd.addColorStop(1,`rgba(${rgb},0)`);
      context.fillStyle=grd;context.beginPath();context.arc(v.x,v.y,12,0,Math.PI*2);context.fill();
      context.fillStyle=`rgba(${rgb},${light?.66:.85})`;context.beginPath();context.arc(v.x,v.y,1.9,0,Math.PI*2);context.fill();
    }
    context.beginPath();context.arc(cx,cy,Math.min(3.2,r*.025),0,Math.PI*2);context.fillStyle=`rgba(${rgb},.65)`;context.fill();
  }
  function frame(t) {
    raf = 0;
    if (motionPaused || document.hidden || !onScreen) return;
    if (!previousFrame) { previousFrame = t; raf = requestAnimationFrame(frame); return; }
    const delta = Math.min(50, t - previousFrame);
    if (delta < (media.matches ? 32 : 25)) { raf = requestAnimationFrame(frame); return; }
    previousFrame = t;
    seconds += delta/1000;
    baseYaw += delta * .00015;
    yaw += (baseYaw+targetYaw-yaw)*.07;
    pitch += (targetPitch-pitch)*.035;
    draw();
    raf=requestAnimationFrame(frame);
  }
  function queueFrame() {
    if (!raf && !motionPaused && onScreen && !document.hidden) {previousFrame=0;raf=requestAnimationFrame(frame);}
    if(motionPaused)draw();
  }
  function setPause(value) {
    motionPaused = value || reducedMotion.matches;
    motionButton?.setAttribute('aria-pressed',String(motionPaused));
    if(motionButton) { motionButton.textContent = reducedMotion.matches ? 'Motion reduced' : motionPaused?'▶  Resume motion':'Ⅱ  Pause motion'; motionButton.disabled = reducedMotion.matches; }
    if(raf){cancelAnimationFrame(raf);raf=0;}
    queueFrame();
  }
  motionButton?.addEventListener('click',()=>setPause(!motionPaused));
  stage.addEventListener('pointermove',event=>{
    if(reducedMotion.matches)return;
    const rect=stage.getBoundingClientRect();
    const nx=(event.clientX-rect.left)/rect.width-.5;
    const ny=(event.clientY-rect.top)/rect.height-.5;
    targetYaw=.4+nx*.85;targetPitch=-.19-ny*.30;
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{targetYaw=.4;targetPitch=-.19;});
  reducedMotion.addEventListener?.('change',event=>setPause(event.matches));
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{onScreen=entries[0]?.isIntersecting ?? true;if(!onScreen&&raf){cancelAnimationFrame(raf);raf=0;}else queueFrame();},{threshold:.05});
    observer.observe(stage);
  }
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',queueFrame);
  window.addEventListener('rkp-theme-change',draw);
  resize();setPause(reducedMotion.matches);
})();
