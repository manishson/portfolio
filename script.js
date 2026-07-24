/* =========================================
   MANISH SONAWANE — Portfolio JavaScript
   ========================================= */

// ========== LOADING SCREEN (percentage wipe, ~5.5-6s, once per session) ==========
(function() {
  const overlay = document.getElementById('loaderOverlay');
  if (!overlay) { window.dispatchEvent(new Event('loaderDone')); return; }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alreadyShown = sessionStorage.getItem('portfolioLoaderShown');

  if (reduceMotion || alreadyShown) {
    overlay.style.display = 'none';
    window.dispatchEvent(new Event('loaderDone'));
    return;
  }

  const fill = document.getElementById('loaderNameFill');
  const pctEl = document.getElementById('loaderPct');
  const barFill = document.getElementById('loaderBarFill');
  document.body.style.overflow = 'hidden';

  const DURATION = 5700; // ~5.5-6s
  const start = performance.now();

  function tick(now) {
    let progress = Math.min((now - start) / DURATION, 1);
    // ease-out so it feels like it settles rather than ticking linearly
    const eased = 1 - Math.pow(1 - progress, 2);
    const pct = Math.round(eased * 100);

    if (fill) fill.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    if (pctEl) pctEl.textContent = pct + '%';
    if (barFill) barFill.style.width = pct + '%';

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      setTimeout(() => {
        overlay.classList.add('loader-hidden');
        document.body.style.overflow = '';
        sessionStorage.setItem('portfolioLoaderShown', '1');
        window.dispatchEvent(new Event('loaderDone'));
        setTimeout(() => { overlay.style.display = 'none'; }, 650);
      }, 250);
    }
  }
  requestAnimationFrame(tick);
})();

// ========== CURSOR ==========
(function() {
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (!cursor || !follower) return;
  
  let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });
  
  function animateFollower() {
    followerX += (mouseX - followerX) * 0.08;
    followerY += (mouseY - followerY) * 0.08;
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';
    requestAnimationFrame(animateFollower);
  }
  animateFollower();
  
  document.querySelectorAll('a, button, .magnetic, .about-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('active');
      follower.classList.add('active');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('active');
      follower.classList.remove('active');
    });
  });

  // Project cards get a distinct "View Project" pill cursor instead of the
  // generic dot-scale, so hovering a card reads as an explicit affordance.
  const cursorLabel = document.getElementById('cursorLabel');
  document.querySelectorAll('.project-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('active');
      if (cursorLabel) cursorLabel.textContent = 'View Project';
      follower.classList.add('label-active');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('active');
      follower.classList.remove('label-active');
    });
  });
})();

// ========== NEURAL NETWORK + PARTICLES + MOUSE PARALLAX (Option E) ==========
(function() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = window.innerWidth, H = window.innerHeight;
  let mouse = { x: W / 2, y: H / 2 };
  let targetMouse = { x: W / 2, y: H / 2 };
  let animFrame;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initAll();
  }

  // Mouse tracking for parallax
  window.addEventListener('mousemove', (e) => {
    targetMouse.x = e.clientX;
    targetMouse.y = e.clientY;
  });

  function getAccentRGB() {
    const accent = document.documentElement.getAttribute('data-accent') || 'mono';
    const map = {
      mono:    [229, 231, 235],
      blue:    [59, 130, 246],
      purple:  [139, 92, 246],
      emerald: [16, 185, 129],
      neon:    [34, 211, 238]
    };
    return map[accent] || map.mono;
  }

  // ── LAYER 1: Floating micro-particles (deep background) ──
  class MicroParticle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -(Math.random() * 0.5 + 0.1);
      this.r  = Math.random() * 1.2 + 0.3;
      this.alpha = Math.random() * 0.35 + 0.05;
      this.layer = Math.random() * 0.5 + 0.1; // parallax depth
    }
    update(dx, dy) {
      this.x += this.vx + dx * this.layer * 0.008;
      this.y += this.vy + dy * this.layer * 0.008;
      if (this.y < -10 || this.x < -20 || this.x > W + 20) this.reset(false);
    }
    draw(rgb) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${this.alpha})`;
      ctx.fill();
    }
  }

  // ── LAYER 2: Neural Network Nodes ──
  class Node {
    constructor() { this.reset(true); }
    reset(init) {
      this.x     = Math.random() * W;
      this.y     = init ? Math.random() * H : Math.random() * H;
      this.vx    = (Math.random() - 0.5) * 0.35;
      this.vy    = (Math.random() - 0.5) * 0.35;
      this.r     = Math.random() * 2.5 + 1.5;
      this.alpha = Math.random() * 0.6 + 0.2;
      this.pulseOffset = Math.random() * Math.PI * 2;
      this.layer = Math.random() * 0.4 + 0.15;
    }
    update(t, dx, dy) {
      this.x += this.vx + dx * this.layer * 0.012;
      this.y += this.vy + dy * this.layer * 0.012;
      if (this.x < -50) this.x = W + 50;
      if (this.x > W + 50) this.x = -50;
      if (this.y < -50) this.y = H + 50;
      if (this.y > H + 50) this.y = -50;
    }
    draw(t, rgb) {
      const pulse = Math.sin(t * 0.002 + this.pulseOffset) * 0.4 + 0.6;
      const r = this.r * pulse;
      // Glow
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 4);
      grd.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${this.alpha * 0.8})`);
      grd.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      // Core dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${this.alpha})`;
      ctx.fill();
    }
  }

  // ── LAYER 3: Data pulse signals travelling along edges ──
  class Pulse {
    constructor(nodeA, nodeB) {
      this.a = nodeA;
      this.b = nodeB;
      this.t = 0;       // 0 → 1 progress
      this.speed = Math.random() * 0.006 + 0.003;
      this.size  = Math.random() * 2 + 1;
      this.alive = true;
    }
    update() {
      this.t += this.speed;
      if (this.t >= 1) this.alive = false;
    }
    draw(rgb) {
      const x = this.a.x + (this.b.x - this.a.x) * this.t;
      const y = this.a.y + (this.b.y - this.a.y) * this.t;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, this.size * 3);
      grd.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`);
      grd.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      ctx.beginPath();
      ctx.arc(x, y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  // ── LAYER 4: Large slow bokeh orbs ──
  class Orb {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H * 1.2;
      this.r  = Math.random() * 120 + 60;
      this.vx = (Math.random() - 0.5) * 0.1;
      this.vy = -(Math.random() * 0.08 + 0.02);
      this.alpha = Math.random() * 0.035 + 0.01;
      this.layer = Math.random() * 0.2 + 0.05;
    }
    update(dx, dy) {
      this.x += this.vx + dx * this.layer * 0.005;
      this.y += this.vy + dy * this.layer * 0.005;
      if (this.y + this.r < 0) this.reset(false);
    }
    draw(rgb) {
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      grd.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${this.alpha})`);
      grd.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  // ── Collections ──
  let microParticles = [];
  let nodes = [];
  let pulses = [];
  let orbs = [];
  let pulseTimer = 0;

  function initAll() {
    const nodeCount  = Math.min(Math.floor(W * H / 18000), 55);
    const microCount = Math.min(Math.floor(W * H / 5000), 160);
    const orbCount   = 6;

    microParticles = Array.from({ length: microCount }, () => new MicroParticle());
    nodes          = Array.from({ length: nodeCount },  () => new Node());
    orbs           = Array.from({ length: orbCount },   () => new Orb());
    pulses         = [];
  }

  // ── Main render loop ──
  let t = 0;
  let dx = 0, dy = 0; // smooth parallax delta

  function animate() {
    animFrame = requestAnimationFrame(animate);
    t++;

    // Smooth mouse parallax
    mouse.x += (targetMouse.x - mouse.x) * 0.04;
    mouse.y += (targetMouse.y - mouse.y) * 0.04;
    dx = (mouse.x - W / 2);
    dy = (mouse.y - H / 2);

    ctx.clearRect(0, 0, W, H);

    const rgb = getAccentRGB();

    // Draw bokeh orbs (deepest layer)
    orbs.forEach(o => { o.update(dx, dy); o.draw(rgb); });

    // Draw micro particles
    microParticles.forEach(p => { p.update(dx, dy); p.draw(rgb); });

    // Draw neural network edges
    const CONNECT_DIST = Math.min(W, H) * 0.18;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ex = nodes[i].x - nodes[j].x;
        const ey = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(ex * ex + ey * ey);
        if (dist < CONNECT_DIST) {
          const opacity = (1 - dist / CONNECT_DIST) * 0.22;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})`;
          ctx.lineWidth = (1 - dist / CONNECT_DIST) * 1.2;
          ctx.stroke();
        }
      }
    }

    // Spawn pulses
    pulseTimer++;
    if (pulseTimer > 28) {
      pulseTimer = 0;
      // Pick two close random nodes and send a signal
      const candidates = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const ex = nodes[i].x - nodes[j].x;
          const ey = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(ex * ex + ey * ey);
          if (dist < CONNECT_DIST * 0.7) candidates.push([i, j]);
        }
      }
      if (candidates.length > 0) {
        const [a, b] = candidates[Math.floor(Math.random() * candidates.length)];
        pulses.push(new Pulse(nodes[a], nodes[b]));
        // 30% chance of reverse pulse
        if (Math.random() < 0.3) pulses.push(new Pulse(nodes[b], nodes[a]));
      }
    }

    // Update + draw pulses
    pulses = pulses.filter(p => p.alive);
    pulses.forEach(p => { p.update(); p.draw(rgb); });

    // Draw nodes (top layer)
    nodes.forEach(n => { n.update(t, dx, dy); n.draw(t, rgb); });
  }

  // Classes and initAll are defined above by this point, so it's now safe
  // to size the canvas, populate the particle arrays, and start the loop.
  resize();
  window.addEventListener('resize', resize);
  animate();
})();


// ========== SCROLL PROGRESS ==========
(function() {
  const bar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', () => {
    const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    if (bar) bar.style.width = Math.min(scrolled, 100) + '%';
  });
})();

// ========== NAV ==========
(function() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  const scrollLabel = document.getElementById('scrollSectionLabel');
  const sectionNames = { hero: 'Home', about: 'About', experience: 'Experience', projects: 'Projects', skills: 'Skills', education: 'Education', contact: 'Contact' };

  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    if (scrollLabel) scrollLabel.classList.toggle('visible', window.scrollY > window.innerHeight * 0.6);
  });

  function closeMobileMenu() {
    if (navLinks) navLinks.classList.remove('open');
    if (toggle) toggle.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  // Active section highlighting
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
        if (scrollLabel) scrollLabel.textContent = sectionNames[id] || id;
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });

  sections.forEach(s => observer.observe(s));

  // Smooth click close mobile
  links.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
})();

// ========== TYPING ANIMATION ==========
(function() {
  const el = document.getElementById('typingText');
  if (!el) return;
  
  const texts = [
    'Senior AI/ML Engineer',
    'LLM Architect',
    'GenAI Developer',
    'Computer Vision Engineer',
    'MLOps Specialist',
    'Agentic AI Builder'
  ];
  
  let textIndex = 0, charIndex = 0, deleting = false;
  
  function type() {
    const current = texts[textIndex];
    if (!deleting) {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === current.length) {
        setTimeout(() => { deleting = true; type(); }, 2200);
        return;
      }
    } else {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        deleting = false;
        textIndex = (textIndex + 1) % texts.length;
      }
    }
    setTimeout(type, deleting ? 40 : 70);
  }
  
  setTimeout(type, 800);
})();

// ========== HERO TERMINAL (simulated) ==========
(function() {
  const body = document.getElementById('terminalBody');
  if (!body) return;

  const PROMPT = '&gt;&gt;&gt;';
  const sequence = [
    { type: 'cmd', text: 'import manish' },
    { type: 'cmd', text: 'manish.whoami()' },
    { type: 'out', text: "'Manish Sonawane'" },
    { type: 'cmd', text: 'manish.role()' },
    { type: 'out', text: "'Senior AI/ML Engineer — LLMs, Computer Vision, NLP'", highlight: true },
    { type: 'cmd', text: 'manish.status()' },
    { type: 'out', text: "'Available for opportunities ✓'", highlight: true }
  ];
  let i = 0;

  function typeInto(text, el, speed, done) {
    let j = 0;
    (function step() {
      el.textContent = text.slice(0, j);
      j++;
      if (j <= text.length) {
        setTimeout(step, speed);
      } else if (done) {
        done();
      }
    })();
  }

  function next() {
    if (i >= sequence.length) {
      const idle = document.createElement('div');
      idle.className = 'term-line';
      idle.innerHTML = `<span class="term-prompt">${PROMPT}</span><span class="term-cursor-blk"></span>`;
      body.appendChild(idle);
      return;
    }
    const step = sequence[i];
    if (step.type === 'cmd') {
      const line = document.createElement('div');
      line.className = 'term-line';
      line.innerHTML = `<span class="term-prompt">${PROMPT}</span> <span class="term-cmd"></span>`;
      body.appendChild(line);
      const cmdEl = line.querySelector('.term-cmd');
      typeInto(step.text, cmdEl, 38, () => { i++; setTimeout(next, 400); });
    } else {
      const out = document.createElement('div');
      out.className = 'term-output' + (step.highlight ? ' term-highlight' : '');
      body.appendChild(out);
      typeInto(step.text, out, 16, () => { i++; setTimeout(next, 550); });
    }
  }

  // Start once the loading screen has finished (or immediately if no loader ran)
  window.addEventListener('loaderDone', () => setTimeout(next, 400), { once: true });
})();

// ========== REVEAL ANIMATIONS ==========
(function() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  if (!('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });
  reveals.forEach(el => observer.observe(el));

  // Safety net: if the observer never fires for a section (e.g. it's already
  // in the viewport on load, or the browser is slow to set it up), force
  // everything visible after a short delay so content is never stuck hidden.
  setTimeout(() => {
    reveals.forEach(el => el.classList.add('visible'));
  }, 1200);
})();

// ========== COUNTER ANIMATION ==========
(function() {
  const counters = document.querySelectorAll('.stat-num[data-count]');
  if (!counters.length) return;

  function runCounter(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const target = parseInt(el.getAttribute('data-count'));
    const duration = 1500;
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  if (!('IntersectionObserver' in window)) {
    counters.forEach(runCounter);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));

  // Safety net: guarantee the numbers animate in even if the observer
  // never fires (e.g. the stat block is already on screen at load).
  setTimeout(() => counters.forEach(runCounter), 1200);
})();

// ========== SKILL BARS ==========
(function() {
  const fills = document.querySelectorAll('.skill-bar-fill[data-width]');
  if (!fills.length) return;

  function fillBar(el) {
    if (el.dataset.filled) return;
    el.dataset.filled = '1';
    const w = el.getAttribute('data-width');
    setTimeout(() => { el.style.width = w + '%'; }, 200);
  }

  if (!('IntersectionObserver' in window)) {
    fills.forEach(fillBar);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        fillBar(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  fills.forEach(f => observer.observe(f));

  // Safety net: fill in the bars even if the observer never fires.
  setTimeout(() => fills.forEach(fillBar), 1200);
})();

// ========== 3D TILT ON PROJECT CARDS ==========
(function() {
  const cards = document.querySelectorAll('.project-card');
  if (!cards.length) return;
  const MAX_TILT = 8; // degrees

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * MAX_TILT * 2;
      const rotateX = (0.5 - py) * MAX_TILT * 2;
      card.style.transition = 'box-shadow 0.3s, border-color 0.3s';
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.4s ease, box-shadow 0.3s, border-color 0.3s';
      card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
})();

// ========== TECH MARQUEE ==========
(function() {
  const track = document.getElementById('techMarqueeTrack');
  if (!track) return;
  // Duplicate the content once so the -50% translateX loop is seamless.
  track.innerHTML += track.innerHTML;
})();

// ========== STREAMING TEXT REVEAL (About) ==========
(function() {
  const targets = document.querySelectorAll('.about-text p');
  if (!targets.length) return;

  function prepare(el) {
    if (el.dataset.streamPrepared) return;
    el.dataset.streamPrepared = '1';
    const html = el.innerHTML;
    const parts = html.split(/(<[^>]+>)/g);
    let wordIndex = 0;
    const rebuilt = parts.map(part => {
      if (!part) return '';
      if (part.charAt(0) === '<') return part;
      return part.split(/(\s+)/).map(chunk => {
        if (!chunk.trim()) return chunk;
        const span = `<span class="stream-word" style="--wi:${wordIndex}">${chunk}</span>`;
        wordIndex++;
        return span;
      }).join('');
    }).join('');
    el.innerHTML = rebuilt;
  }

  function reveal(el) {
    prepare(el);
    el.classList.add('stream-active');
  }

  if (!('IntersectionObserver' in window)) {
    targets.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  targets.forEach(el => { prepare(el); observer.observe(el); });

  // Safety net so the text is never stuck invisible.
  setTimeout(() => targets.forEach(reveal), 2200);
})();

// ========== LIVE METRICS (simulated, Prometheus-style) ==========
(function() {
  const latencyEl = document.getElementById('metricLatency');
  const throughputEl = document.getElementById('metricThroughput');
  const uptimeEl = document.getElementById('metricUptime');
  if (!latencyEl || !throughputEl || !uptimeEl) return;

  function rand(min, max, decimals) {
    const v = Math.random() * (max - min) + min;
    return decimals ? v.toFixed(decimals) : Math.round(v);
  }

  function tick() {
    latencyEl.textContent = rand(38, 92);
    throughputEl.textContent = rand(120, 260);
    uptimeEl.textContent = rand(99.90, 99.99, 2);
  }

  tick();
  setInterval(tick, 2200);
})();

// ========== COMMAND PALETTE (⌘K) ==========
(function() {
  const overlay = document.getElementById('cmdkOverlay');
  const input = document.getElementById('cmdkInput');
  const list = document.getElementById('cmdkList');
  const trigger = document.getElementById('cmdkTrigger');
  if (!overlay || !input || !list) return;

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  const items = [
    { icon: '🏠', label: 'Home', action: () => scrollToSection('hero') },
    { icon: '👤', label: 'About', action: () => scrollToSection('about') },
    { icon: '💼', label: 'Experience', action: () => scrollToSection('experience') },
    { icon: '🚀', label: 'Projects', action: () => scrollToSection('projects') },
    { icon: '🧠', label: 'Skills', action: () => scrollToSection('skills') },
    { icon: '🎓', label: 'Education', action: () => scrollToSection('education') },
    { icon: '✉️', label: 'Contact', action: () => scrollToSection('contact') },
    { icon: '🌙', label: 'Toggle Theme', action: () => { const btn = document.getElementById('themeSwitcher'); if (btn) btn.click(); } },
    { icon: '📄', label: 'Download Resume', action: () => { const a = document.createElement('a'); a.href = 'manish_sonawane_CV.pdf'; a.download = ''; a.click(); } },
    { icon: '📧', label: 'Email Manish', action: () => { window.location.href = 'mailto:manishsonawane19@gmail.com'; } },
    { icon: '🔗', label: 'Open LinkedIn', action: () => { window.open('http://linkedin.com/in/manish-sonawane-ai', '_blank'); } }
  ];

  let filtered = items.slice();
  let activeIndex = 0;

  function render() {
    if (!filtered.length) {
      list.innerHTML = '<div class="cmdk-empty">No matches</div>';
      return;
    }
    list.innerHTML = filtered.map((item, i) => `
      <div class="cmdk-item${i === activeIndex ? ' active' : ''}" data-index="${i}">
        <span class="cmdk-item-icon">${item.icon}</span><span>${item.label}</span>
      </div>
    `).join('');
    list.querySelectorAll('.cmdk-item').forEach(el => {
      el.addEventListener('click', () => {
        runItem(parseInt(el.getAttribute('data-index'), 10));
      });
    });
  }

  function runItem(idx) {
    const item = filtered[idx];
    if (!item) return;
    close();
    setTimeout(() => item.action(), 150);
  }

  function filterItems() {
    const q = input.value.trim().toLowerCase();
    filtered = !q ? items.slice() : items.filter(i => i.label.toLowerCase().includes(q));
    activeIndex = 0;
    render();
  }

  function open() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    input.value = '';
    filterItems();
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', (e) => {
    const isOpen = overlay.classList.contains('open');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen ? close() : open();
    } else if (e.key === 'Escape' && isOpen) {
      close();
    } else if (isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      if (!filtered.length) return;
      activeIndex = e.key === 'ArrowDown'
        ? (activeIndex + 1) % filtered.length
        : (activeIndex - 1 + filtered.length) % filtered.length;
      render();
    } else if (isOpen && e.key === 'Enter') {
      e.preventDefault();
      runItem(activeIndex);
    }
  });

  input.addEventListener('input', filterItems);
  overlay.addEventListener('click', close);
  if (trigger) trigger.addEventListener('click', open);
})();

// ========== CONSOLE EASTER EGG ==========
console.log('%c👋 Hey, fellow engineer.', 'font-size:16px;font-weight:700;color:#3b82f6;');
console.log('%cSince you\'re inspecting — this whole site (particle/neural canvas, animated architecture diagrams, skill embedding map, command palette) is hand-built vanilla JS/CSS, no framework. If you\'re hiring for AI/ML roles, let\'s talk: manishsonawane19@gmail.com', 'font-size:12px;color:#94a3b8;');

// ========== THEME SWITCHER ==========
(function() {
  const btn = document.getElementById('themeSwitcher');
  const icon = btn ? btn.querySelector('.theme-icon') : null;
  if (!btn) return;
  
  const stored = localStorage.getItem('portfolio-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', stored);
  if (icon) icon.textContent = stored === 'dark' ? '🌙' : '☀️';
  
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('portfolio-theme', next);
    if (icon) icon.textContent = next === 'dark' ? '🌙' : '☀️';
  });
})();

// ========== ACCENT PICKER ==========
(function() {
  const dots = document.querySelectorAll('.accent-dot');
  const stored = localStorage.getItem('portfolio-accent') || 'mono';
  document.documentElement.setAttribute('data-accent', stored);
  dots.forEach(d => d.classList.toggle('active', d.getAttribute('data-accent') === stored));
  
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const accent = dot.getAttribute('data-accent');
      document.documentElement.setAttribute('data-accent', accent);
      localStorage.setItem('portfolio-accent', accent);
      dots.forEach(d => d.classList.toggle('active', d === dot));
    });
  });
})();

// ========== MAGNETIC BUTTONS ==========
(function() {
  const magnetics = document.querySelectorAll('.magnetic');
  magnetics.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.2;
      const dy = (e.clientY - cy) * 0.2;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });
})();

// ========== CONTACT FORM (real submission via FormSubmit.co) ==========
(function() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const btn = document.getElementById('contact-submit-btn');
  const success = document.getElementById('formSuccess');
  const errorEl = document.getElementById('formError');
  const SEND_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Message';
  const SENDING_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Sending...';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (success) success.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (btn) { btn.disabled = true; btn.innerHTML = SENDING_ICON; }

    const payload = {
      name: form.elements['name'].value,
      email: form.elements['email'].value,
      subject: form.elements['subject'].value || 'Portfolio Contact Form',
      message: form.elements['message'].value
    };

    try {
      const res = await fetch('https://formsubmit.co/ajax/manishsonawane19@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Request failed');
      if (success) {
        success.style.display = 'block';
        setTimeout(() => { success.style.display = 'none'; }, 5000);
      }
      form.reset();
    } catch (err) {
      if (errorEl) errorEl.style.display = 'block';
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = SEND_ICON; }
    }
  });
})();

// ========== MODALS ==========
const modalData = {
  sentinel: {
    title: 'Sentinel Bot',
    subtitle: 'AI-Powered Enterprise Automation Assistant',
    status: 'status-live',
    statusLabel: 'In Production',
    problem: 'Enterprise teams waste hours switching between GitHub, Jira, Confluence, databases, and monitoring dashboards. The context-switching cost is massive and error-prone.',
    solution: 'Sentinel Bot enables any user to perform complex multi-system operations using natural language. A function-calling framework with JSON schema validation dynamically selects and executes the right tools across 50+ enterprise services.',
    intendedUse: 'Enterprise teams needing natural-language automation across internal tools — GitHub, Jira, Confluence, databases, and monitoring — without constant manual context-switching.',
    trainingData: 'Function-calling schemas spanning 50+ enterprise service APIs; real conversation logs used to refine intent-to-action mapping and multi-turn context handling.',
    metrics: [{ value: '~95%', label: 'Intent Accuracy' }, { value: '50+', label: 'Services Integrated' }, { value: '1000s', label: 'Daily Requests' }],
    architecture: ['LangGraph for multi-turn stateful conversation management', 'JSON Schema validation for dynamic function routing', 'ETL pipelines normalizing heterogeneous API responses', 'Context-aware follow-up query handling with memory'],
    results: ['~95% intent-to-action accuracy in production', 'Thousands of daily requests handled autonomously', '50+ enterprise service integrations (GitHub, Jira, Confluence, DBs, monitoring)', 'Significantly reduced manual task overhead across engineering teams'],
    limitations: 'Intent classification is strongest on well-scoped enterprise queries; highly ambiguous multi-intent requests may need clarification. Tool orchestration reliability depends on the uptime of underlying enterprise APIs.',
    stack: ['LangGraph', 'GPT-4', 'FastAPI', 'JSON Schema', 'ETL Pipelines', 'Python', 'LangChain']
  },
  surveillance: {
    title: 'Surveillance System',
    subtitle: 'Weapon Detection & Face Matching',
    status: 'status-completed',
    statusLabel: 'Completed',
    problem: 'Traditional surveillance systems require human monitoring and cannot reliably detect threats or verify identities in real time at scale.',
    solution: 'A real-time AI-powered surveillance system integrating weapon detection and biometric face matching, deployed on AWS Cloud for high-performance production inference.',
    intendedUse: 'Security teams needing real-time, automated threat and identity flagging in monitored premises as an assistive layer alongside human security operations — not a fully autonomous decision-maker.',
    trainingData: 'Labeled image/video datasets for weapon classes and paired face-identity samples; YOLO and Faster R-CNN backbones fine-tuned via transfer learning.',
    metrics: [{ value: 'Real-time', label: 'Detection Speed' }, { value: 'AWS', label: 'Cloud Deployed' }],
    architecture: ['YOLO and Faster R-CNN for weapon detection', 'Deep learning feature extraction for face recognition', 'GPU-accelerated inference with model quantization', 'FastAPI REST APIs for seamless security system integration', 'AWS EC2/S3/Lambda for scalable cloud deployment'],
    results: ['Real-time detection and matching performance', 'High accuracy weapon identification in diverse scenarios', 'Scalable cloud deployment handling high-throughput video streams', 'Seamless integration with existing security infrastructure via REST APIs'],
    limitations: 'Detection accuracy can vary in extremely low-light or heavily occluded scenes; face-matching quality depends on enrollment image quality. Intended to support, not replace, human security review.',
    stack: ['YOLO', 'Faster R-CNN', 'PyTorch', 'FastAPI', 'AWS EC2', 'S3', 'Lambda', 'OpenCV', 'GPU Inference']
  },
  property: {
    title: 'Property Insights Automator',
    subtitle: 'NER System for Property & Legal Services',
    status: 'status-completed',
    statusLabel: 'Completed',
    problem: 'Manual review of thousands of legal and property documents is slow, error-prone, and requires significant specialized human effort.',
    solution: 'An AI-powered system combining NER, document classification, PII redaction, and summarization trained on 10,000+ legal documents to automate document intelligence at scale.',
    intendedUse: 'Legal and property teams processing high volumes of documents who need automated classification, entity extraction, and PII-safe summarization.',
    trainingData: '10,000+ real-world legal/property documents, cleaned and preprocessed (20% noise reduction) for NER and classification fine-tuning on LegalBERT.',
    metrics: [{ value: '92%', label: 'Classification Accuracy' }, { value: '10K+', label: 'Documents' }, { value: '20%', label: 'Noise Reduced' }],
    architecture: ['LegalBERT fine-tuned for property/legal NER', 'Document classification pipeline achieving 92% accuracy', 'PII extraction and redaction for compliance', 'OCR pipeline with transformer-based NLP post-processing', 'FastAPI deployment on Azure with Docker containerization'],
    results: ['92% classification accuracy on 10,000+ legal documents', '90% overall NLP system accuracy in production', '20% reduction in dataset noise via meticulous preprocessing', '20% reduction in manual case management effort', 'Deployed on Azure with Docker containerization'],
    limitations: 'Tuned specifically for property/legal document formats seen in training; performance may degrade on out-of-domain document types. PII redaction should be paired with human compliance review for high-stakes cases.',
    stack: ['LegalBERT', 'LangChain', 'NER', 'OCR', 'FastAPI', 'Azure', 'Docker', 'Python', 'Scikit-learn']
  }
};

function openModal(key) {
  const data = modalData[key];
  if (!data) return;

  const overlay = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');
  if (!overlay || !body) return;

  body.innerHTML = `
    <div class="modal-badge">📋 Model Card</div>
    <div class="modal-status ${data.status}"><span class="status-dot"></span>${data.statusLabel}</div>
    <h2>${data.title}</h2>
    <p class="modal-subtitle">${data.subtitle}</p>

    <div class="project-metrics modal-metrics">
      ${data.metrics.map(m => `<div class="metric"><span class="metric-value">${m.value}</span><span class="metric-label">${m.label}</span></div>`).join('')}
    </div>

    <div class="modal-section">
      <h4>🎯 Intended Use</h4>
      <p>${data.intendedUse}</p>
    </div>

    <div class="modal-section">
      <h4>📚 Training Data</h4>
      <p>${data.trainingData}</p>
    </div>

    <div class="modal-section">
      <h4>🏗️ Architecture</h4>
      <ul>${data.architecture.map(a => `<li>${a}</li>`).join('')}</ul>
    </div>

    <div class="modal-section">
      <h4>📊 Key Results</h4>
      <ul>${data.results.map(r => `<li>${r}</li>`).join('')}</ul>
    </div>

    <div class="modal-section">
      <h4>⚠️ Limitations &amp; Considerations</h4>
      <p>${data.limitations}</p>
    </div>

    <div class="modal-section">
      <h4>🛠️ Tech Stack</h4>
      <div class="modal-tags">${data.stack.map(s => `<span class="tech-tag">${s}</span>`).join('')}</div>
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ========== PARALLAX ==========
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero-bg-gradient');
  if (hero) {
    hero.style.transform = `translateY(${window.scrollY * 0.2}px)`;
  }
});

// ========== SMOOTH REVEAL STAGGER ==========
document.querySelectorAll('.about-card, .edu-card, .skill-category').forEach((el, i) => {
  el.style.transitionDelay = (i * 0.1) + 's';
});

// ========== INTERACTIVE NEURAL NETWORK VISUALIZER ==========
(function() {
  const canvas = document.getElementById('nnCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const runBtn  = document.getElementById('nnRunBtn');
  const resetBtn = document.getElementById('nnResetBtn');
  const hoveredInfoEl  = document.getElementById('nnHoveredInfo');
  const hoveredValueEl = document.getElementById('nnHoveredValue');

  // Architecture: input(4) → hidden(6) → hidden(6) → output(3)
  const architecture = [4, 6, 6, 3];
  const layerLabels = ['Input', 'Hidden 1', 'Hidden 2', 'Output'];

  let W, H, dpr;
  let neurons = []; // [{x, y, layer, index, value, glow, targetGlow}]
  let weights = []; // [{from, to, value, signal, signalProgress}]
  let hoveredNeuron = null;
  let animRunning = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildNetwork();
  }

  function getAccentRGB() {
    const accent = document.documentElement.getAttribute('data-accent') || 'mono';
    const map = {
      mono:    [180, 190, 210],
      blue:    [59, 130, 246],
      purple:  [139, 92, 246],
      emerald: [16, 185, 129],
      neon:    [34, 211, 238]
    };
    return map[accent] || map.mono;
  }

  function buildNetwork() {
    neurons = [];
    weights = [];
    const paddingX = 60;
    const paddingY = 40;
    const layerSpacing = (W - paddingX * 2) / (architecture.length - 1);

    // Create neurons
    for (let l = 0; l < architecture.length; l++) {
      const count = architecture[l];
      const x = paddingX + l * layerSpacing;
      const neuronSpacing = (H - paddingY * 2) / (count + 1);
      for (let n = 0; n < count; n++) {
        const y = paddingY + neuronSpacing * (n + 1);
        neurons.push({
          x, y, layer: l, index: n,
          value: l === 0 ? Math.random() : 0, // Input layer has random values
          glow: l === 0 ? 0.6 : 0.15,
          targetGlow: l === 0 ? 0.6 : 0.15,
          radius: l === 0 || l === architecture.length - 1 ? 12 : 10,
        });
      }
    }

    // Create weights (connections)
    for (let l = 0; l < architecture.length - 1; l++) {
      const fromNeurons = neurons.filter(n => n.layer === l);
      const toNeurons = neurons.filter(n => n.layer === l + 1);
      for (const from of fromNeurons) {
        for (const to of toNeurons) {
          weights.push({
            from, to,
            value: (Math.random() - 0.5) * 2, // -1 to 1
            signal: false,
            signalProgress: 0,
            signalSpeed: 0.015 + Math.random() * 0.01,
          });
        }
      }
    }
  }

  // ReLU activation
  function relu(x) { return Math.max(0, x); }

  // Forward pass animation
  function triggerForwardPass() {
    if (animRunning) return;
    animRunning = true;
    if (runBtn) { runBtn.classList.add('running'); runBtn.innerHTML = '<span class="nn-live-dot pulse" style="width:6px;height:6px;border-radius:50%;background:#22c55e"></span> Running...'; }

    // Reset all neurons
    neurons.forEach(n => {
      if (n.layer === 0) {
        n.value = Math.random();
        n.targetGlow = 0.9;
      } else {
        n.value = 0;
        n.targetGlow = 0.1;
      }
    });

    // Cascade layer by layer
    let layerDelay = 0;
    for (let l = 0; l < architecture.length - 1; l++) {
      const currentLayer = l;
      setTimeout(() => {
        // Compute values for next layer
        const toNeurons = neurons.filter(n => n.layer === currentLayer + 1);
        toNeurons.forEach(to => {
          const incoming = weights.filter(w => w.to === to);
          let sum = 0;
          incoming.forEach(w => {
            sum += w.from.value * w.value;
            // Trigger signal animation on this weight
            w.signal = true;
            w.signalProgress = 0;
          });
          // Apply activation
          setTimeout(() => {
            to.value = currentLayer + 1 < architecture.length - 1 ? relu(sum) : sigmoid(sum);
            to.targetGlow = Math.min(1, Math.abs(to.value) * 0.8 + 0.3);
          }, 400);
        });
      }, layerDelay);
      layerDelay += 600;
    }

    // Reset running state
    setTimeout(() => {
      animRunning = false;
      if (runBtn) {
        runBtn.classList.remove('running');
        runBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Forward Pass';
      }
    }, layerDelay + 800);
  }

  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

  function resetNetwork() {
    neurons.forEach(n => {
      if (n.layer === 0) {
        n.value = Math.random();
        n.targetGlow = 0.6;
      } else {
        n.value = 0;
        n.targetGlow = 0.15;
      }
    });
    weights.forEach(w => {
      w.signal = false;
      w.signalProgress = 0;
      w.value = (Math.random() - 0.5) * 2;
    });
    animRunning = false;
    if (runBtn) {
      runBtn.classList.remove('running');
      runBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Forward Pass';
    }
  }

  // Mouse interaction
  let mouseX = -100, mouseY = -100;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    // Find hovered neuron
    hoveredNeuron = null;
    for (const n of neurons) {
      const dx = mouseX - n.x;
      const dy = mouseY - n.y;
      if (Math.sqrt(dx * dx + dy * dy) < n.radius + 6) {
        hoveredNeuron = n;
        break;
      }
    }

    if (hoveredNeuron) {
      canvas.style.cursor = 'pointer';
      // Highlight connected weights
      hoveredNeuron.targetGlow = 1;
      if (hoveredInfoEl) hoveredInfoEl.style.display = '';
      if (hoveredValueEl) hoveredValueEl.textContent = `L${hoveredNeuron.layer}[${hoveredNeuron.index}] = ${hoveredNeuron.value.toFixed(3)}`;
    } else {
      canvas.style.cursor = 'crosshair';
      if (hoveredInfoEl) hoveredInfoEl.style.display = 'none';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    mouseX = -100; mouseY = -100;
    hoveredNeuron = null;
    if (hoveredInfoEl) hoveredInfoEl.style.display = 'none';
  });

  canvas.addEventListener('click', () => {
    if (hoveredNeuron) {
      // Click on a neuron triggers forward pass
      triggerForwardPass();
    }
  });

  if (runBtn) runBtn.addEventListener('click', triggerForwardPass);
  if (resetBtn) resetBtn.addEventListener('click', resetNetwork);

  // ── Render loop ──
  function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);

    const rgb = getAccentRGB();
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const t = performance.now();

    // Animate glow values
    neurons.forEach(n => {
      n.glow += (n.targetGlow - n.glow) * 0.08;
      // Subtle pulse for input neurons
      if (n.layer === 0) {
        n.targetGlow = 0.5 + Math.sin(t * 0.002 + n.index) * 0.15;
      }
      // Decay non-hovered neurons back to baseline
      if (n !== hoveredNeuron && !animRunning && n.layer > 0) {
        n.targetGlow = 0.15 + n.value * 0.3;
      }
    });

    // Draw weights (connections)
    for (const w of weights) {
      const isHoveredWeight = hoveredNeuron && (w.from === hoveredNeuron || w.to === hoveredNeuron);
      const baseAlpha = isHoveredWeight ? 0.35 : 0.08;
      const weightAlpha = baseAlpha + Math.abs(w.value) * 0.1;

      // Draw the line
      ctx.beginPath();
      ctx.moveTo(w.from.x, w.from.y);
      ctx.lineTo(w.to.x, w.to.y);
      const lineColor = isHoveredWeight
        ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${weightAlpha})`
        : `rgba(${isDark ? '255,255,255' : '0,0,0'},${weightAlpha * 0.5})`;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = isHoveredWeight ? 1.8 : 0.6;
      ctx.stroke();

      // Draw signal if active
      if (w.signal) {
        w.signalProgress += w.signalSpeed;
        if (w.signalProgress >= 1) {
          w.signal = false;
          w.signalProgress = 0;
        } else {
          const sx = w.from.x + (w.to.x - w.from.x) * w.signalProgress;
          const sy = w.from.y + (w.to.y - w.from.y) * w.signalProgress;
          const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
          grd.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`);
          grd.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
          ctx.beginPath();
          ctx.arc(sx, sy, 8, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      }
    }

    // Draw neurons
    for (const n of neurons) {
      const isHovered = n === hoveredNeuron;
      const r = isHovered ? n.radius + 3 : n.radius;

      // Outer glow
      const glowR = r * (2.5 + n.glow * 1.5);
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
      grd.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${n.glow * 0.5})`);
      grd.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Neuron body
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      const bodyAlpha = 0.15 + n.glow * 0.5;
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${bodyAlpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${n.glow * 0.8 + 0.15})`;
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.stroke();

      // Center bright core
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${n.glow})`;
      ctx.fill();

      // Value text (only for hovered or active neurons)
      if (isHovered || (n.glow > 0.4 && n.value !== 0)) {
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isDark ? `rgba(255,255,255,${n.glow})` : `rgba(0,0,0,${n.glow})`;
        ctx.fillText(n.value.toFixed(2), n.x, n.y + r + 14);
      }
    }

    // Layer labels at top
    ctx.font = '600 10px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelColor = isDark ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.6)';
    for (let l = 0; l < architecture.length; l++) {
      const layerNeurons = neurons.filter(n => n.layer === l);
      if (layerNeurons.length > 0) {
        ctx.fillStyle = labelColor;
        ctx.fillText(layerLabels[l], layerNeurons[0].x, 8);
      }
    }
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();
