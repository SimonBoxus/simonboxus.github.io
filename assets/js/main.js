// ── Theme toggle ──
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) root.setAttribute('data-theme', 'dark');
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (next === 'dark') root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      localStorage.setItem('theme', next);
      // Reposition lenses (transitions can change geometry)
      requestAnimationFrame(() => {
        const topActive = document.querySelector('.nav-links a.active');
        const botActive = document.querySelector('.bottom-nav-item.active');
        if (topActive && topCtrl) topCtrl.move(topActive);
        if (botActive && botCtrl) botCtrl.move(botActive);
      });
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
      });
    });

    // Lens follower
    function makeLens(container, items, lens) {
      function move(item) {
        if (!item) return;
        const cRect = container.getBoundingClientRect();
        const iRect = item.getBoundingClientRect();
        lens.style.width = iRect.width + 'px';
        lens.style.transform = `translateX(${iRect.left - cRect.left}px)`;
        lens.classList.add('visible');
      }
      function activate(item) {
        items.forEach(i => i.classList.toggle('active', i === item));
        move(item);
      }
      items.forEach(item => {
        item.addEventListener('mouseenter', () => move(item));
        item.addEventListener('click', () => activate(item));
      });
      container.addEventListener('mouseleave', () => {
        const active = container.querySelector('.active');
        if (active) move(active);
      });
      return { activate, move };
    }

    const topLinks = document.querySelector('.nav-links');
    const topItems = topLinks ? topLinks.querySelectorAll('a') : [];
    const topLens  = document.querySelector('.nav-lens');
    const topCtrl  = topLinks ? makeLens(topLinks, topItems, topLens) : null;

    const botInner = document.querySelector('.bottom-nav-inner');
    const botItems = botInner ? botInner.querySelectorAll('.bottom-nav-item') : [];
    const botLens  = document.querySelector('.bottom-nav-lens');
    const botCtrl  = botInner ? makeLens(botInner, botItems, botLens) : null;

    function setActive(id) {
      [...topItems, ...botItems].forEach(i => {
        const match = i.getAttribute('href') === '#' + id;
        i.classList.toggle('active', match);
      });
      const topActive = [...topItems].find(i => i.classList.contains('active'));
      const botActive = [...botItems].find(i => i.classList.contains('active'));
      if (topCtrl && topActive) topCtrl.move(topActive);
      if (botCtrl && botActive) botCtrl.move(botActive);
    }

    // Wait for layout, then position lens to active item
    requestAnimationFrame(() => {
      const initialTop = [...topItems].find(i => i.classList.contains('active')) || topItems[0];
      const initialBot = [...botItems].find(i => i.classList.contains('active')) || botItems[0];
      if (topCtrl && initialTop) { topCtrl.activate(initialTop); }
      if (botCtrl && initialBot) { botCtrl.activate(initialBot); }
    });

    // Track scroll position
    const sections = document.querySelectorAll('section[id]');
    new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 }).observe;
    sections.forEach(s => {
      new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 }).observe(s);
    });

    // Reposition on resize
    window.addEventListener('resize', () => {
      const topActive = [...topItems].find(i => i.classList.contains('active'));
      const botActive = [...botItems].find(i => i.classList.contains('active'));
      if (topCtrl && topActive) topCtrl.move(topActive);
      if (botCtrl && botActive) botCtrl.move(botActive);
    });

    // ═══════════════════════════════════
    // 1) Cursor-following spotlight (whole page)
    // ═══════════════════════════════════
    document.addEventListener('mousemove', e => {
      document.body.style.setProperty('--mx', e.clientX + 'px');
      document.body.style.setProperty('--my', e.clientY + 'px');
    });

    // ═══════════════════════════════════
    // 2) Time-aware greeting
    // ═══════════════════════════════════
    const greetEl = document.getElementById('greeting');
    if (greetEl) {
      const h = new Date().getHours();
      greetEl.textContent =
        h < 5  ? 'Good night' :
        h < 12 ? 'Good morning' :
        h < 18 ? 'Good afternoon' :
        h < 22 ? 'Good evening' : 'Good night';
    }

    // ═══════════════════════════════════
    // 3) Animated stat counter
    // ═══════════════════════════════════
    function animateCounter(el) {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1100;
      const start = performance.now();
      function tick(t) {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.5 }).observe(document.querySelector('.counter'));

    // ═══════════════════════════════════
    // 4) Reveal on scroll
    // ═══════════════════════════════════
    new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 }).observe && document.querySelectorAll('.reveal').forEach(el => {
      new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.12 }).observe(el);
    });

    // ═══════════════════════════════════
    // 6) Cmd+K command palette
    // ═══════════════════════════════════
    const cmdk = document.getElementById('cmdk');
    const cmdkBackdrop = document.getElementById('cmdkBackdrop');
    const cmdkInput = document.getElementById('cmdkInput');
    const cmdkList = document.getElementById('cmdkList');

    const commands = [
      { id: 'about',      label: 'Jump to About',      hint: 'Section', icon: 'user',    action: () => scrollToId('about') },
      { id: 'experience', label: 'Jump to Experience', hint: 'Section', icon: 'brief',   action: () => scrollToId('experience') },
      { id: 'press',      label: 'Jump to Press',      hint: 'Section', icon: 'brief',   action: () => scrollToId('press') },
      { id: 'tools',      label: 'Jump to Tools',      hint: 'Section', icon: 'star',    action: () => scrollToId('tools') },
      { id: 'skills',     label: 'Jump to Skills',     hint: 'Section', icon: 'star',    action: () => scrollToId('skills') },
      { id: 'contact',    label: 'Jump to Contact',    hint: 'Section', icon: 'phone',   action: () => scrollToId('contact') },
      { id: 'email',      label: 'Copy email',         hint: 'boxus.s@gmail.com', icon: 'mail', action: copyEmail },
      { id: 'mailto',     label: 'Send email',         hint: 'Opens mail app',    icon: 'mail', action: () => location.href = 'mailto:boxus.s@gmail.com' },
      { id: 'linkedin',   label: 'Open LinkedIn',      hint: 'External',          icon: 'link', action: () => window.open('https://www.linkedin.com/in/simon-boxus-98a38a65/', '_blank') },
      { id: 'x',          label: 'Open X / Twitter',   hint: '@simon_boxus',      icon: 'x',    action: () => window.open('https://x.com/simon_boxus', '_blank') },
      { id: 'github',     label: 'Open GitHub',        hint: 'SimonBoxus',         icon: 'github', action: () => window.open('https://github.com/SimonBoxus', '_blank') },
      { id: 'theme',      label: 'Toggle theme',       hint: 'Light / Dark',      icon: 'moon', action: () => themeToggle.click() }
    ];

    const icons = {
      user:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"/></svg>',
      brief: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>',
      star:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 10 17 15 18 22 12 18 6 22 7 15 2 10 9 9"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
      mail:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
      link:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.5-1.5"/></svg>',
      moon:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
      x:     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
      github:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>'
    };

    function scrollToId(id) {
      const el = document.getElementById(id);
      if (!el) return;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }
    function copyEmail() {
      navigator.clipboard.writeText('boxus.s@gmail.com').then(() => {
        const item = [...cmdkList.children].find(c => c.dataset.id === 'email');
        if (item) {
          const old = item.querySelector('.cmdk-hint').textContent;
          item.querySelector('.cmdk-hint').textContent = 'Copied!';
          setTimeout(() => { item.querySelector('.cmdk-hint').textContent = old; }, 1200);
        }
      });
    }

    let cmdkSelected = 0;
    let cmdkMatched = commands.slice();

    function updateSelection() {
      cmdkList.querySelectorAll('.cmdk-item').forEach((el, i) => {
        el.classList.toggle('selected', i === cmdkSelected);
      });
    }

    function renderCmdk(filter = '') {
      const f = filter.toLowerCase();
      cmdkMatched = commands.filter(c => c.label.toLowerCase().includes(f) || c.hint.toLowerCase().includes(f));
      cmdkSelected = 0;
      if (cmdkMatched.length === 0) {
        cmdkList.innerHTML = '<div class="cmdk-empty">No results</div>';
        return;
      }
      cmdkList.innerHTML = cmdkMatched.map((c, i) => `
        <div class="cmdk-item ${i === 0 ? 'selected' : ''}" data-id="${c.id}" data-idx="${i}">
          <span class="cmdk-icon">${icons[c.icon]}</span>
          <span class="cmdk-label">${c.label}</span>
          <span class="cmdk-hint">${c.hint}</span>
        </div>
      `).join('');
      // Bind once per render — no rebuild on hover
      cmdkList.querySelectorAll('.cmdk-item').forEach(el => {
        const idx = parseInt(el.dataset.idx, 10);
        el.addEventListener('mousedown', e => { e.preventDefault(); });
        el.addEventListener('click', () => runCmd(cmdkMatched[idx]));
        el.addEventListener('mouseenter', () => { cmdkSelected = idx; updateSelection(); });
      });
    }

    function openCmdk() {
      cmdk.classList.add('open');
      cmdkBackdrop.classList.add('open');
      cmdkInput.value = '';
      cmdkSelected = 0;
      renderCmdk();
      setTimeout(() => cmdkInput.focus(), 30);
    }
    function closeCmdk() {
      cmdk.classList.remove('open');
      cmdkBackdrop.classList.remove('open');
    }
    function runCmd(cmd) {
      closeCmdk();
      setTimeout(cmd.action, 150);
    }

    cmdkBackdrop.addEventListener('click', closeCmdk);
    cmdkInput.addEventListener('input', () => renderCmdk(cmdkInput.value));
    cmdkInput.addEventListener('keydown', e => {
      const len = cmdkMatched.length;
      if (e.key === 'ArrowDown')   { e.preventDefault(); if (len) { cmdkSelected = (cmdkSelected + 1) % len; updateSelection(); } }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); if (len) { cmdkSelected = (cmdkSelected - 1 + len) % len; updateSelection(); } }
      else if (e.key === 'Enter')  { if (cmdkMatched[cmdkSelected]) runCmd(cmdkMatched[cmdkSelected]); }
      else if (e.key === 'Escape') closeCmdk();
    });

    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        cmdk.classList.contains('open') ? closeCmdk() : openCmdk();
      }
    });


    // ═══════════════════════════════════
    // 7) Konami code easter egg + confetti
    // ═══════════════════════════════════
    const konami = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
    let konamiBuf = [];
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const k = (e.key || '').toLowerCase();
      konamiBuf.push(k);
      konamiBuf = konamiBuf.slice(-konami.length);
      console.log('[konami]', konamiBuf.join(' → '));
      if (konamiBuf.length === konami.length && konamiBuf.every((v, i) => v === konami[i])) {
        e.preventDefault();
        burstConfetti();
        konamiBuf = [];
      }
    }, true);

    // Alternate trigger: triple-click the avatar
    const avatar = document.querySelector('.avatar-inner');
    if (avatar) {
      let clicks = 0, timer;
      avatar.addEventListener('click', () => {
        clicks++;
        clearTimeout(timer);
        timer = setTimeout(() => clicks = 0, 600);
        if (clicks >= 3) { burstConfetti(); clicks = 0; }
      });
    }

    // Alternate trigger: type "wow" anywhere
    let wowBuf = '';
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const k = (e.key || '').toLowerCase();
      if (k.length !== 1) return;
      wowBuf = (wowBuf + k).slice(-3);
      if (wowBuf === 'wow') { burstConfetti(); wowBuf = ''; }
    });

    function burstConfetti() {
      const colors = ['#007AFF','#0A84FF','#FF3B30','#FF9500','#FFCC00','#34C759','#5856D6','#AF52DE','#FF2D55'];
      const N = 140;
      const w = window.innerWidth;
      for (let i = 0; i < N; i++) {
        const el = document.createElement('div');
        el.className = 'confetti';
        const x = Math.random() * w;
        const size = 6 + Math.random() * 8;
        const rot = Math.random() * 360;
        el.style.left = x + 'px';
        el.style.width = size + 'px';
        el.style.height = (size * 0.4 + Math.random() * size) + 'px';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.borderRadius = (Math.random() < 0.4 ? '50%' : '2px');
        el.style.transform = `rotate(${rot}deg)`;
        el.style.opacity = '0';
        document.body.appendChild(el);

        const dur = 2400 + Math.random() * 1800;
        const drift = (Math.random() - 0.5) * 360;
        const fallTo = window.innerHeight + 50;
        const spinTo = rot + (Math.random() - 0.5) * 1080;

        el.animate([
          { transform: `translate(0, 0) rotate(${rot}deg)`, opacity: 1 },
          { transform: `translate(${drift}px, ${fallTo}px) rotate(${spinTo}deg)`, opacity: 0.9 }
        ], { duration: dur, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)', fill: 'forwards' });

        setTimeout(() => el.remove(), dur + 100);
      }
      // Subtle blue ring flash
      const ring = document.createElement('div');
      ring.style.cssText = `
        position:fixed; left:50%; top:50%;
        width:8px; height:8px;
        border-radius:50%; background:#007AFF;
        transform:translate(-50%,-50%);
        z-index:999; pointer-events:none;
        animation: konamiFlash 0.9s ease-out forwards;
      `;
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 1000);
    }


    // ═══════════════════════════════════
    // 8) Live Lyon time in footer
    // ═══════════════════════════════════
    function updateClock() {
      const el = document.getElementById('clock');
      if (!el) return;
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Paris',
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
      });
      const parts = fmt.formatToParts(new Date());
      const wd = parts.find(p => p.type === 'weekday').value;
      const h = parts.find(p => p.type === 'hour').value;
      const m = parts.find(p => p.type === 'minute').value;
      el.textContent = `🕐 Lyon · ${wd} ${h}:${m}`;
    }
    updateClock();
    setInterval(updateClock, 30000);

    // ═══════════════════════════════════
    // 9) Vertical scroll dots
    // ═══════════════════════════════════
    const scrollDots = document.querySelectorAll('.scroll-dot');
    scrollDots.forEach(dot => {
      dot.addEventListener('click', e => {
        e.preventDefault();
        scrollToId(dot.dataset.target);
      });
    });
    function setScrollDotActive(id) {
      scrollDots.forEach(d => d.classList.toggle('active', d.dataset.target === id));
    }

    // Hook into existing IntersectionObserver — the existing setActive call already updates nav items.
    // Wrap setActive to also update scroll dots.
    const _origSetActive = setActive;
    setActive = function(id) {
      _origSetActive(id);
      setScrollDotActive(id);
    };

    // ═══════════════════════════════════
    // 10) iOS toast helper
    // ═══════════════════════════════════
    const toast = document.getElementById('toast');
    const toastEmoji = document.getElementById('toastEmoji');
    const toastText = document.getElementById('toastText');
    let toastTimer;
    function showToast(emoji, text, duration = 2500) {
      toastEmoji.textContent = emoji;
      toastText.textContent = text;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
    }

    // ═══════════════════════════════════
    // 11) Skeleton loader
    // ═══════════════════════════════════
    window.addEventListener('load', () => {
      setTimeout(() => {
        const skel = document.getElementById('skeleton');
        skel.classList.add('hidden');
        document.body.classList.remove('is-loading');
        setTimeout(() => skel.remove(), 500);
        // Re-trigger reveal observer for sections
        document.querySelectorAll('.reveal').forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
        });
      }, 700);
    });

    // ═══════════════════════════════════
    // 12) Holiday effects + Konami upgrade
    // ═══════════════════════════════════
    function emojiRain(emojis, count = 60, duration = 4500) {
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'holiday-particle';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = Math.random() * window.innerWidth + 'px';
        el.style.fontSize = (20 + Math.random() * 24) + 'px';
        el.style.opacity = '0';
        document.body.appendChild(el);

        const dur = duration + Math.random() * 1500;
        const drift = (Math.random() - 0.5) * 200;
        const rot = (Math.random() - 0.5) * 720;

        el.animate([
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${drift}px, ${window.innerHeight + 80}px) rotate(${rot}deg)`, opacity: 0.95 }
        ], { duration: dur, easing: 'cubic-bezier(0.3, 0.5, 0.5, 1)', fill: 'forwards' });
        setTimeout(() => el.remove(), dur + 100);
      }
    }

    function fireworks(rounds = 6) {
      const colors = ['#FF3B30','#FF9500','#FFCC00','#34C759','#007AFF','#5856D6','#AF52DE','#FF2D55'];
      for (let r = 0; r < rounds; r++) {
        setTimeout(() => {
          const cx = window.innerWidth * (0.15 + Math.random() * 0.7);
          const cy = window.innerHeight * (0.15 + Math.random() * 0.4);
          const color = colors[Math.floor(Math.random() * colors.length)];
          const sparks = 36;
          for (let s = 0; s < sparks; s++) {
            const angle = (Math.PI * 2 * s) / sparks + Math.random() * 0.2;
            const dist = 110 + Math.random() * 90;
            const el = document.createElement('div');
            el.className = 'firework-spark';
            el.style.left = cx + 'px';
            el.style.top = cy + 'px';
            el.style.background = color;
            el.style.boxShadow = `0 0 8px ${color}`;
            document.body.appendChild(el);
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist + 60; // slight gravity
            el.animate([
              { transform: 'translate(0, 0) scale(1)', opacity: 1 },
              { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0 }
            ], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)', fill: 'forwards' });
            setTimeout(() => el.remove(), 1400);
          }
        }, r * 350);
      }
    }

    function celebrate(kind) {
      const kinds = {
        nye:    { emoji: '🎆', text: 'Happy New Year!',   action: fireworks },
        xmas:   { emoji: '🎄', text: 'Merry Christmas!',  action: () => emojiRain(['🎄','🎁','⭐','❄️'], 70) },
        hanu:   { emoji: '🕎', text: 'Happy Hanukkah!',   action: () => emojiRain(['🕎','🕯️','✨'], 50) },
        easter: { emoji: '🥚', text: 'Happy Easter!',     action: () => emojiRain(['🥚','🐰','🌷','🌸'], 60) }
      };
      const c = kinds[kind];
      if (!c) return;
      showToast(c.emoji, c.text, 3000);
      c.action();
    }

    // Konami → toast + confetti
    const _origBurst = burstConfetti;
    burstConfetti = function() {
      showToast('🏆', 'Easter egg unlocked!', 2800);
      _origBurst();
    };

    // Holiday keyboard triggers (typed phrases)
    const triggers = { 'nye': 'nye', 'xmas': 'xmas', 'hannu': 'hanu', 'easter': 'easter' };
    let phrasebuf = '';
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const k = (e.key || '').toLowerCase();
      if (k.length !== 1) return;
      phrasebuf = (phrasebuf + k).slice(-7);
      for (const [phrase, kind] of Object.entries(triggers)) {
        if (phrasebuf.endsWith(phrase)) {
          celebrate(kind);
          phrasebuf = '';
          break;
        }
      }
    });

    // Auto-celebrate on actual holidays
    (function autoHoliday() {
      const now = new Date();
      const m = now.getMonth() + 1, d = now.getDate();
      let kind = null;
      if (m === 12 && d === 31) kind = 'nye';
      else if (m === 1 && d === 1) kind = 'nye';
      else if (m === 12 && d >= 24 && d <= 26) kind = 'xmas';
      // (Hanukkah and Easter dates vary yearly — leave keyboard-only for those)
      if (kind) setTimeout(() => celebrate(kind), 1500);
    })();


    // ═══════════════════════════════════
    // 13) Theme transition wave (View Transitions API)
    // ═══════════════════════════════════
    // Replace existing themeToggle handler with one that supports view transition
    const themeToggleNew = document.getElementById('themeToggle');
    // Remove old listener by cloning the node
    const themeToggleClone = themeToggleNew.cloneNode(true);
    themeToggleNew.replaceWith(themeToggleClone);
    themeToggleClone.addEventListener('click', (e) => {
      const r = document.documentElement;
      const next = r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      const rect = themeToggleClone.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const maxR = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      r.style.setProperty('--theme-x', x + 'px');
      r.style.setProperty('--theme-y', y + 'px');
      r.style.setProperty('--theme-r', maxR + 'px');

      const apply = () => {
        if (next === 'dark') r.setAttribute('data-theme', 'dark');
        else r.removeAttribute('data-theme');
        localStorage.setItem('theme', next);
        // Reposition lens after transition
        requestAnimationFrame(() => {
          const t = document.querySelector('.nav-links a.active');
          const b = document.querySelector('.bottom-nav-item.active');
          if (t && typeof topCtrl !== 'undefined' && topCtrl) topCtrl.move(t);
          if (b && typeof botCtrl !== 'undefined' && botCtrl) botCtrl.move(b);
        });
      };

      if (document.startViewTransition) {
        document.startViewTransition(apply);
      } else {
        apply();
      }
    });

    // ═══════════════════════════════════
    // 15) Dynamic browser tab title + favicon sticker
    // ═══════════════════════════════════
    const origTitle = document.title;
    const origFavicon = document.querySelector('link[rel="icon"]').href;
    const sleepFavicon = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".88em" font-size="92">💤</text></svg>'
    );
    let titleTimer;
    document.addEventListener('visibilitychange', () => {
      const fav = document.querySelector('link[rel="icon"]');
      if (document.hidden) {
        document.title = '👋 Come back!';
        fav.href = sleepFavicon;
        clearTimeout(titleTimer);
        titleTimer = setTimeout(() => {
          if (document.hidden) document.title = '👀 Still there?';
        }, 5000);
      } else {
        clearTimeout(titleTimer);
        document.title = origTitle;
        fav.href = origFavicon;
      }
    });

    // ═══════════════════════════════════
    // 16) Live weather in Lyon footer
    // ═══════════════════════════════════
    const weatherEmoji = (code) => {
      if (code === 0) return '☀️';
      if (code <= 2) return '🌤️';
      if (code === 3) return '☁️';
      if (code <= 48) return '🌫️';
      if (code <= 67) return '🌧️';
      if (code <= 77) return '🌨️';
      if (code <= 82) return '🌦️';
      if (code <= 86) return '🌨️';
      if (code <= 99) return '⛈️';
      return '🌡️';
    };
    let lyonWeather = '';
    function updateClockWithWeather() {
      const el = document.getElementById('clock');
      if (!el) return;
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Paris',
        weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: false
      });
      const parts = fmt.formatToParts(new Date());
      const wd = parts.find(p => p.type === 'weekday').value;
      const h = parts.find(p => p.type === 'hour').value;
      const m = parts.find(p => p.type === 'minute').value;
      el.textContent = `🕐 Lyon · ${wd} ${h}:${m}${lyonWeather}`;
    }
    fetch('https://api.open-meteo.com/v1/forecast?latitude=45.75&longitude=4.85&current_weather=true')
      .then(r => r.json())
      .then(d => {
        if (d.current_weather) {
          const t = Math.round(d.current_weather.temperature);
          lyonWeather = ` · ${weatherEmoji(d.current_weather.weathercode)} ${t}°`;
          updateClockWithWeather();
        }
      })
      .catch(() => {});
    // Override the original clock updater
    if (typeof updateClock === 'function') {
      window._origUpdateClock = updateClock;
    }
    setInterval(updateClockWithWeather, 30000);
    updateClockWithWeather();

    // ═══════════════════════════════════
    // 17) First-visit welcome toast
    // ═══════════════════════════════════
    if (!localStorage.getItem('welcomed')) {
      setTimeout(() => {
        showToast('👋', 'Welcome! Press ⌘K to navigate', 4500);
        localStorage.setItem('welcomed', '1');
      }, 1800);
    }

    // ═══════════════════════════════════
    // 18) Idle wake-up
    // ═══════════════════════════════════
    let idleTimer;
    function wakeWave() {
      const wave = document.querySelector('.wave');
      if (!wave) return;
      wave.animate([
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(14deg)' },
        { transform: 'rotate(-8deg)' },
        { transform: 'rotate(14deg)' },
        { transform: 'rotate(-4deg)' },
        { transform: 'rotate(10deg)' },
        { transform: 'rotate(0deg)' }
      ], { duration: 1800, easing: 'ease-in-out' });
    }
    function resetIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(wakeWave, 45000);
    }
    ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(ev =>
      window.addEventListener(ev, resetIdle, { passive: true })
    );
    resetIdle();


    // ═══════════════════════════════════
    // 19) Hidden snake game
    // ═══════════════════════════════════
    (function() {
      const modal   = document.getElementById('snakeModal');
      const canvas  = document.getElementById('snakeCanvas');
      const ctx     = canvas.getContext('2d');
      const scoreEl = document.getElementById('snakeScore');
      const overlay = document.getElementById('snakeOverlay');
      const overlayMsg = document.getElementById('snakeOverlayMsg');
      const startBtn = document.getElementById('snakeStart');
      const closeBtn = document.getElementById('snakeClose');
      const link    = document.getElementById('snakeLink');

      const GRID = 20;
      const CELL = canvas.width / GRID;

      let snake, dir, nextDir, food, score, tickTimer, running, speed;

      function reset() {
        snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
        dir = {x: 1, y: 0};
        nextDir = dir;
        score = 0;
        speed = 130;
        placeFood();
        scoreEl.textContent = score;
      }

      function placeFood() {
        while (true) {
          food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
          if (!snake.some(s => s.x === food.x && s.y === food.y)) break;
        }
      }

      function draw() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const grid = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
        const blue = '#007AFF';

        // Fully clear before redrawing — fillRect with semi-transparent
        // color leaves trails since it stacks each frame.
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // grid dots
        ctx.fillStyle = grid;
        for (let x = 0; x < GRID; x++) {
          for (let y = 0; y < GRID; y++) {
            ctx.beginPath();
            ctx.arc(x * CELL + CELL/2, y * CELL + CELL/2, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // food
        ctx.fillStyle = '#FF3B30';
        ctx.beginPath();
        ctx.arc(food.x * CELL + CELL/2, food.y * CELL + CELL/2, CELL * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // snake
        snake.forEach((seg, i) => {
          const t = i / snake.length;
          ctx.fillStyle = i === 0 ? blue : `rgba(0,122,255,${1 - t * 0.6})`;
          const r = i === 0 ? CELL * 0.45 : CELL * 0.42;
          ctx.beginPath();
          ctx.arc(seg.x * CELL + CELL/2, seg.y * CELL + CELL/2, r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      function tick() {
        dir = nextDir;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) return gameOver();
        if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          score++;
          scoreEl.textContent = score;
          if (score % 5 === 0) speed = Math.max(60, speed - 10);
          placeFood();
        } else {
          snake.pop();
        }
        draw();
        tickTimer = setTimeout(tick, speed);
      }

      function gameOver() {
        running = false;
        clearTimeout(tickTimer);
        overlayMsg.innerHTML = `Game over · Score <strong>${score}</strong>`;
        startBtn.textContent = 'Play again';
        overlay.classList.add('show');
      }

      function start() {
        reset();
        running = true;
        overlay.classList.remove('show');
        draw();
        clearTimeout(tickTimer);
        tickTimer = setTimeout(tick, speed);
      }

      function open() {
        modal.classList.add('open');
        reset();
        draw();
        overlayMsg.innerHTML = 'Press <kbd>↑</kbd> or <strong>Play</strong>';
        startBtn.textContent = 'Play';
        overlay.classList.add('show');
        running = false;
      }
      function close() {
        modal.classList.remove('open');
        clearTimeout(tickTimer);
        running = false;
      }

      link.addEventListener('click', (e) => { e.preventDefault(); open(); });
      closeBtn.addEventListener('click', close);
      startBtn.addEventListener('click', start);
      modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

      // Keyboard
      window.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('open')) return;
        if (e.target.tagName === 'INPUT') return;
        const k = e.key;
        if (k === 'Escape') { close(); return; }
        const opp = (a, b) => (a.x === -b.x && a.y === -b.y);
        let nd = null;
        if (k === 'ArrowUp'    || k === 'w') nd = {x: 0, y: -1};
        else if (k === 'ArrowDown'  || k === 's') nd = {x: 0, y: 1};
        else if (k === 'ArrowLeft'  || k === 'a') nd = {x: -1, y: 0};
        else if (k === 'ArrowRight' || k === 'd') nd = {x: 1, y: 0};
        if (!nd) return;
        e.preventDefault();
        if (!running) { start(); nextDir = nd; return; }
        if (!opp(nd, dir)) nextDir = nd;
      });

      // Touch swipe support
      let touchStart = null;
      canvas.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        touchStart = { x: t.clientX, y: t.clientY };
      }, { passive: true });
      canvas.addEventListener('touchend', (e) => {
        if (!touchStart) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStart.x;
        const dy = t.clientY - touchStart.y;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
          if (!running) start();
          touchStart = null;
          return;
        }
        const opp = (a, b) => (a.x === -b.x && a.y === -b.y);
        let nd = null;
        if (Math.abs(dx) > Math.abs(dy)) nd = { x: dx > 0 ? 1 : -1, y: 0 };
        else                              nd = { x: 0, y: dy > 0 ? 1 : -1 };
        if (!running) { start(); nextDir = nd; }
        else if (!opp(nd, dir)) nextDir = nd;
        touchStart = null;
      });
    })();
