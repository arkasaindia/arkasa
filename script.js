// ── ARKASA shared script ──

// 0. STARTUP SPLASH (index)
(function(){
  const splash = document.getElementById('startupSplash');
  if(!splash) return;

  const splashSeenKey = 'arkasaSplashSeen';
  let hasSeenSplash = false;

  try{
    hasSeenSplash = sessionStorage.getItem(splashSeenKey) === '1';
  }catch(_err){
    hasSeenSplash = false;
  }

  if(hasSeenSplash){
    document.body.classList.remove('splash-active');
    splash.remove();
    return;
  }

  try{
    sessionStorage.setItem(splashSeenKey, '1');
  }catch(_err){
    // If storage is unavailable, fallback behavior is to show splash normally.
  }

  document.body.classList.add('splash-active');

  const lines = splash.querySelectorAll('[data-splash-line]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  if(reduceMotion){
    lines.forEach(line => line.classList.add('is-visible'));
    setTimeout(() => {
      splash.classList.add('is-ending');
      document.body.classList.remove('splash-active');
    }, 250);
    setTimeout(() => splash.remove(), 1200);
    return;
  }

  (async () => {
    const introDelay = 240;
    const holdTime = 1150;
    const exitTime = 480;

    await wait(introDelay);

    for(let i=0;i<lines.length;i++){
      const line = lines[i];

      // If we hit the brand line, show it and the following subline together
      if(line.classList && line.classList.contains && line.classList.contains('startup-brand')){
        const next = lines[i+1];
        line.classList.add('is-visible');
        if(next) next.classList.add('is-visible');
        await wait(holdTime);
        line.classList.remove('is-visible');
        line.classList.add('is-hiding');
        if(next){ next.classList.remove('is-visible'); next.classList.add('is-hiding'); }
        await wait(exitTime);
        line.classList.remove('is-hiding');
        if(next) next.classList.remove('is-hiding');
        i++; // skip the next since we handled it
        continue;
      }

      line.classList.add('is-visible');
      await wait(holdTime);
      line.classList.remove('is-visible');
      line.classList.add('is-hiding');
      await wait(exitTime);
      line.classList.remove('is-hiding');
    }

    splash.classList.add('is-ending');
    document.body.classList.remove('splash-active');
    setTimeout(() => splash.remove(), 900);
  })();
})();

// 1. NAVBAR
(function(){
  const nav = document.getElementById('navbar');
  if(!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  // Mark active page link
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if(href === page || (page === 'index.html' && href === 'index.html')) a.classList.add('active');
  });
})();

// 2. HAMBURGER
(function(){
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if(!btn||!links) return;
  btn.addEventListener('click', () => { btn.classList.toggle('open'); links.classList.toggle('open'); document.body.classList.toggle('nav-open'); });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { btn.classList.remove('open'); links.classList.remove('open'); document.body.classList.remove('nav-open'); }));
})();

// 3. SCROLL REVEAL
(function(){
  const items = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        const d = parseInt(e.target.dataset.delay||0,10);
        setTimeout(() => e.target.classList.add('visible'), d);
        obs.unobserve(e.target);
      }
    });
  }, {threshold:0.12});
  items.forEach(i => obs.observe(i));
})();

// 4. COUNTER ANIMATION
(function(){
  document.querySelectorAll('.stat-number[data-count]').forEach(el => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(e.isIntersecting){
          const target = parseInt(el.dataset.count,10);
          let cur = 0;
          const step = Math.ceil(1500/target);
          const t = setInterval(() => { cur++; el.textContent = cur; if(cur>=target) clearInterval(t); }, step);
          obs.unobserve(el);
        }
      });
    }, {threshold:0.5});
    obs.observe(el);
  });
})();

// 5. STAR CANVAS (only on index)
if(document.getElementById('starCanvas')){
  (function(){
    const canvas = document.getElementById('starCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, stars = [], shoots = [];
    const COLORS = ['#ffffff','#c7e8ff','#22d3ee','#a855f7','#e2e8f0'];
    function resize(){ W=canvas.width=innerWidth; H=canvas.height=innerHeight; }
    class Star{
      constructor(init=false){ this.reset(init); }
      reset(init=false){
        this.x=Math.random()*W; this.y=init?Math.random()*H:-2;
        this.r=Math.random()*1.4+0.2; this.a=Math.random()*.7+.3;
        this.ts=Math.random()*.012+.003; this.td=Math.random()>.5?1:-1;
        this.col=COLORS[Math.floor(Math.random()*COLORS.length)];
      }
      update(){ this.a+=this.ts*this.td; if(this.a>1){this.a=1;this.td=-1;} if(this.a<.2){this.a=.2;this.td=1;} }
      draw(){
        ctx.save(); ctx.globalAlpha=this.a; ctx.fillStyle=this.col;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
        if(this.r>1){ ctx.globalAlpha=this.a*.2; ctx.beginPath(); ctx.arc(this.x,this.y,this.r*3,0,Math.PI*2); ctx.fill(); }
        ctx.restore();
      }
    }
    class Shoot{
      constructor(){
        this.x=Math.random()*W*.8; this.y=Math.random()*H*.35;
        this.len=Math.random()*160+80; this.speed=Math.random()*9+6;
        this.ang=Math.PI/5+Math.random()*.2; this.a=0;
        this.dx=Math.cos(this.ang)*this.speed; this.dy=Math.sin(this.ang)*this.speed;
        this.life=0; this.max=(this.len/this.speed)+20; this.done=false;
      }
      update(){
        this.x+=this.dx; this.y+=this.dy; this.life++;
        if(this.life<8) this.a=this.life/8;
        else if(this.life>this.max-12) this.a=Math.max(0,(this.max-this.life)/12);
        else this.a=1;
        if(this.life>=this.max) this.done=true;
      }
      draw(){
        const tx=this.x-Math.cos(this.ang)*this.len, ty=this.y-Math.sin(this.ang)*this.len;
        const g=ctx.createLinearGradient(tx,ty,this.x,this.y);
        g.addColorStop(0,'rgba(255,255,255,0)');
        g.addColorStop(.8,`rgba(34,211,238,${this.a*.6})`);
        g.addColorStop(1,`rgba(255,255,255,${this.a})`);
        ctx.save(); ctx.strokeStyle=g; ctx.lineWidth=1.5; ctx.globalAlpha=this.a;
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(this.x,this.y); ctx.stroke(); ctx.restore();
      }
    }
    function build(){ stars=Array.from({length:260},()=>new Star(true)); }
    function loop(){
      ctx.clearRect(0,0,W,H);
      stars.forEach(s=>{s.update();s.draw();});
      shoots=shoots.filter(s=>!s.done); shoots.forEach(s=>{s.update();s.draw();});
      requestAnimationFrame(loop);
    }
    setInterval(()=>{ if(Math.random()>.3) shoots.push(new Shoot()); },3200);
    window.addEventListener('resize',()=>{resize();build();});
    resize(); build(); loop();
  })();
}

// 5b. BACKGROUND TWINKLE STARS (full viewport subtle layer)
if(document.getElementById('bgStarCanvas')){
  (function(){
    const canvas = document.getElementById('bgStarCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, DPR = window.devicePixelRatio || 1;
    const STARS = [];

    function resize(){
      DPR = window.devicePixelRatio || 1;
      W = canvas.width = Math.round(window.innerWidth * DPR);
      H = canvas.height = Math.round(window.innerHeight * DPR);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }

    class BStar{
      constructor(){
        this.reset(true);
      }
      reset(init=false){
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.r = Math.random() * 1.2 + 0.3;
        this.baseA = Math.random() * 0.6 + 0.25;
        this.a = this.baseA;
        this.speed = Math.random() * 0.008 + 0.001;
        this.phase = Math.random() * Math.PI * 2;
        this.color = Math.random() > 0.88 ? 'rgba(168,85,247,' : 'rgba(34,211,238,';
      }
      update(t){
        this.phase += this.speed;
        this.a = this.baseA + Math.sin(this.phase) * (this.baseA * 0.6);
      }
      draw(){
        ctx.beginPath();
        ctx.fillStyle = this.color + (this.a * 0.9) + ')';
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fill();
      }
    }

    function build(){
      STARS.length = 0;
      const count = Math.round((window.innerWidth * window.innerHeight) / 6000); // density
      for(let i=0;i<count;i++) STARS.push(new BStar());
    }

    let rafId;
    function loop(t){
      ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
      for(const s of STARS){ s.update(t); s.draw(); }
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', ()=>{ resize(); build(); });
    resize(); build(); loop();
  })();
}

// 6. PARALLAX HERO (index)
(function(){
  const hc = document.querySelector('.hero-content');
  if(!hc) return;
  let tick=false;
  window.addEventListener('scroll',()=>{
    if(!tick){ requestAnimationFrame(()=>{
      const sy=window.scrollY;
      hc.style.transform=`translateY(${sy*.38}px)`;
      hc.style.opacity=Math.max(0,1-sy/(innerHeight*.85));
      tick=false;
    }); tick=true; }
  });
})();

// 7. MODALS
function openModal(id){ const m=document.getElementById(id); if(m){m.classList.add('open');document.body.style.overflow='hidden';} }
function closeModalDirect(id){ const m=document.getElementById(id); if(m){m.classList.remove('open');document.body.style.overflow='';} }
function closeModal(e,id){ if(e.target===document.getElementById(id)) closeModalDirect(id); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.modal-back.open').forEach(m=>{m.classList.remove('open');document.body.style.overflow='';}); });

// 8. NEWSLETTER
function handleNewsletter(e){
  e.preventDefault();
  e.target.style.display='none';
  document.getElementById('nlSuccess').classList.add('show');
}

// 9. CONTACT FORM
function handleContact(e){
  e.preventDefault();
  const btn=e.target.querySelector('button[type="submit"]');
  btn.textContent='Sending…'; btn.disabled=true;
  setTimeout(()=>{ btn.textContent='Sent ✓'; document.getElementById('fSuccess').classList.add('show'); e.target.reset(); },1200);
}

// 10. SMOOTH SCROLL (for same-page anchor links)
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const t=document.querySelector(a.getAttribute('href'));
    if(t){ e.preventDefault(); const nh=document.getElementById('navbar').offsetHeight; window.scrollTo({top:t.getBoundingClientRect().top+scrollY-nh,behavior:'smooth'}); }
  });
});

// 11. 3D CARD TILT — stars glow + perspective tilt on mousemove (mouse/pointer devices only)
(function(){
  if(window.matchMedia('(hover:none),(pointer:coarse)').matches) return;
  const cards = document.querySelectorAll('.card-tilt');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      const rx = (y - 0.5) * -16;
      const ry = (x - 0.5) *  16;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.03,1.03,1.03)`;
      card.style.setProperty('--mx', `${x*100}%`);
      card.style.setProperty('--my', `${y*100}%`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    });
  });
})();

// 13. RESEARCH CARDS — open details in a larger panel
(function(){
  const toggles = document.querySelectorAll('.r-card .r-toggle');
  const panel = document.getElementById('researchPanel');
  const panelClose = document.getElementById('researchPanelClose');
  const panelIcon = document.getElementById('researchPanelIcon');
  const panelNum = document.getElementById('researchPanelNum');
  const panelTitle = document.getElementById('researchPanelTitle');
  const panelBody = document.getElementById('researchPanelBody');
  const panelTags = document.getElementById('researchPanelTags');

  if(!toggles.length || !panel || !panelClose || !panelIcon || !panelNum || !panelTitle || !panelBody || !panelTags) return;

  let activeToggle = null;

  function closePanel(){
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(activeToggle){
      activeToggle.setAttribute('aria-expanded', 'false');
      activeToggle = null;
    }
  }

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const card = toggle.closest('.r-card');
      if(!card) return;

      const icon = card.querySelector('.r-icon');
      const num = card.querySelector('.r-num');
      const title = card.querySelector('.r-title');
      const body = card.querySelector('.r-details .r-body');
      const tags = card.querySelector('.r-details .r-tags');
      if(!icon || !num || !title || !body || !tags) return;

      panelIcon.innerHTML = icon.innerHTML;
      panelNum.textContent = num.textContent;
      panelTitle.textContent = title.textContent;
      panelBody.textContent = body.textContent;
      panelTags.innerHTML = tags.innerHTML;

      toggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
      toggle.setAttribute('aria-expanded', 'true');
      activeToggle = toggle;

      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  panelClose.addEventListener('click', closePanel);
  panel.addEventListener('click', e => {
    if(e.target === panel) closePanel();
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });
})();

// 14. TEAM BIO POPUP — open the team bio modal from the photo trigger
(function(){
  const triggers = document.querySelectorAll('.tm-photo-trigger');
  const advisorTriggers = document.querySelectorAll('.adv-photo-trigger');
  const advisorCards = document.querySelectorAll('.adv-card');
  const modal = document.getElementById('teamBioModal');
  const modalImage = document.getElementById('teamBioImage');
  const modalLabel = document.getElementById('teamBioLabel');
  const modalTitle = document.getElementById('teamBioTitle');
  const modalRole = document.getElementById('teamBioRole');
  const modalText = document.getElementById('teamBioText');
  const modalBadge = document.getElementById('teamBioBadge');

  if((!triggers.length && !advisorTriggers.length) || !modal || !modalImage || !modalLabel || !modalTitle || !modalRole || !modalText || !modalBadge) return;

  const openProfileCard = (card, labelText) => {
    const photo = card.querySelector('.tm-photo, .adv-photo, .adv-avatar');
    const name = card.querySelector('.tm-name, .adv-name');
    const role = card.querySelector('.tm-role, .adv-title');
    const intro = card.querySelector('.tm-intro, .adv-bio');
    const position = card.querySelector('.adv-pos');
    if(!photo || !name || !intro) return;

    modalImage.src = photo.getAttribute('src') || '';
    modalImage.alt = photo.getAttribute('alt') || name.textContent.trim();
    modalLabel.textContent = labelText;
    modalTitle.textContent = name.textContent.trim();
    modalRole.textContent = [role?.textContent?.trim(), position?.textContent?.trim()].filter(Boolean).join(' | ');
    modalText.textContent = intro.textContent.trim();
    modalBadge.textContent = role?.textContent?.trim() || labelText;

    openModal('teamBioModal');
  };

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const card = trigger.closest('.tm-card');
      if(!card) return;
      openProfileCard(card, 'Team Profile');
    });
  });

  advisorCards.forEach(card => {
    const name = card.querySelector('.adv-name');
    if(name) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Open ${name.textContent.trim()} bio`);
    }
  });

  advisorTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const card = trigger.closest('.adv-card');
      if(!card) return;
      openProfileCard(card, 'Advisor Profile');
    });
  });

  advisorCards.forEach(card => {
    card.addEventListener('keydown', e => {
      if(e.target !== card) return;
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openProfileCard(card, 'Advisor Profile');
      }
    });
  });

  modal.addEventListener('click', e => {
    if(e.target === modal) closeModalDirect('teamBioModal');
  });
})();

// 12. 3D MODAL TILT — gentle tilt on the open modal box
(function(){
  document.addEventListener('mousemove', e => {
    const modal = document.querySelector('.modal-back.open .modal-tilt');
    if(!modal) return;
    const rect = modal.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top)  / rect.height;
    // clamp so tilt only fires when cursor is over the modal
    if(x < 0 || x > 1 || y < 0 || y > 1){
      modal.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
      return;
    }
    const rx = (y - 0.5) * -6;
    const ry = (x - 0.5) *  8;
    modal.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    modal.style.setProperty('--mx', `${x*100}%`);
    modal.style.setProperty('--my', `${y*100}%`);
  });
  // reset tilt when modal closes
  const origClose = window.closeModalDirect;
  window.closeModalDirect = function(id){
    const m = document.getElementById(id);
    if(m){
      const box = m.querySelector('.modal-tilt');
      if(box) box.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    }
    origClose(id);
  };
})();

// 14. MODAL GALLERY CONTROLS — arrows + dots for horizontal image tracks
(function(){
  const galleries = document.querySelectorAll('.modal-gallery');
  if(!galleries.length) return;

  galleries.forEach(gallery => {
    const track = gallery.querySelector('.modal-gallery-track');
    const slides = gallery.querySelectorAll('.modal-slide');
    const prev = gallery.querySelector('.modal-gallery-prev');
    const next = gallery.querySelector('.modal-gallery-next');
    const dots = gallery.querySelectorAll('.modal-gallery-dot');
    if(!track || !slides.length) return;

    const slideCount = slides.length;

    const getIndex = () => {
      const width = track.clientWidth || 1;
      return Math.max(0, Math.min(slideCount - 1, Math.round(track.scrollLeft / width)));
    };

    const setActiveDot = index => {
      dots.forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
    };

    const goTo = index => {
      const width = track.clientWidth || 1;
      const target = Math.max(0, Math.min(slideCount - 1, index));
      track.scrollTo({left: target * width, behavior: 'smooth'});
      setActiveDot(target);
    };

    if(prev){
      prev.addEventListener('click', () => {
        goTo(getIndex() - 1);
      });
    }

    if(next){
      next.addEventListener('click', () => {
        goTo(getIndex() + 1);
      });
    }

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => goTo(index));
    });

    track.addEventListener('scroll', () => {
      setActiveDot(getIndex());
    }, {passive:true});

    window.addEventListener('resize', () => {
      goTo(getIndex());
    });

    setActiveDot(0);
  });
})();

console.log('%c✦ ARKASA Space Architecture Design Research Labs','font-family:monospace;font-size:13px;color:#22d3ee;font-weight:bold;');
