/* Ritus Sangrai — GSAP ScrollTrigger + Lenis (smooth) + interaksi */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 1. Lenis smooth scroll ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToEl(t) {
    if (lenis) lenis.scrollTo(t, { offset: 0 });
    else t.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  /* ---------- intro counter ---------- */
  var intro = document.getElementById('intro'), introN = document.getElementById('introN');
  function heroIn() {
    gsap.to('.hero-h .w', { y: 0, duration: 1.1, stagger: .09, ease: 'power4.out' });
    gsap.to('.hero-sub', { opacity: 1, y: 0, duration: .9, delay: .45, ease: 'power3.out' });
    gsap.to('.hero-foot', { opacity: 1, duration: .9, delay: .7 });
  }
  if (reduce) { intro.classList.add('gone'); heroIn(); }
  else {
    var n = { v: 0 };
    gsap.to(n, {
      v: 100, duration: 1.5, ease: 'power2.inOut',
      onUpdate: function () { introN.textContent = ('0' + Math.round(n.v)).slice(-2); },
      onComplete: function () {
        gsap.to(intro, { yPercent: -100, duration: .9, ease: 'power4.inOut', onComplete: function () { intro.classList.add('gone'); } });
        heroIn();
      }
    });
  }

  /* ---------- cursor ---------- */
  var cur = document.getElementById('cur');
  if (cur && matchMedia('(hover:hover)').matches) {
    var cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
    gsap.ticker.add(function () {
      cx += (tx - cx) * .2; cy += (ty - cy) * .2;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
    });
    document.addEventListener('mouseover', function (e) {
      cur.classList.toggle('big', !!e.target.closest('a,button'));
    });
  }

  /* ---------- nav hide/show + solid + chapter ---------- */
  var nav = document.getElementById('nav'), last = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      var y = self.scroll();
      nav.classList.toggle('solid', y > 60);
      nav.classList.toggle('hide', y > 320 && y > last);
      last = y;
    }
  });
  var navChI = document.getElementById('navChI');
  document.querySelectorAll('.ch').forEach(function (s) {
    ScrollTrigger.create({
      trigger: s, start: 'top 45%', end: 'bottom 45%',
      onEnter: function () { navChI.textContent = s.dataset.ch; },
      onEnterBack: function () { navChI.textContent = s.dataset.ch; }
    });
  });

  /* ---------- menu ---------- */
  var burger = document.getElementById('burger'), menu = document.getElementById('menu');
  function menuToggle(open) {
    menu.classList.toggle('open', open);
    burger.classList.toggle('on', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  burger.addEventListener('click', function () { menuToggle(!menu.classList.contains('open')); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { menuToggle(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') { menuToggle(false); cartToggle(false); } });

  /* ---------- 2. split heading per kata (mask) ---------- */
  function splitWords(el) {
    if (el.dataset.split) return [];
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/);
          if (parts.length < 2 && !c.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'wm';
            var i = document.createElement('span'); i.className = 'wi'; i.textContent = p;
            w.appendChild(i); frag.appendChild(w); out.push(i);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') {
          var w2 = document.createElement('span'); w2.className = 'wm';
          var i2 = document.createElement('span'); i2.className = 'wi';
          c.parentNode.insertBefore(w2, c); i2.appendChild(c); w2.appendChild(i2); out.push(i2);
        }
      });
    })(el);
    el.dataset.split = '1';
    return out;
  }

  /* ---------- 4/5. reveal: blur + stagger per grup + reverse saat scroll balik ---------- */
  if (!reduce) {
    document.querySelectorAll('.sec-h').forEach(function (h) {
      var wis = splitWords(h);
      if (!wis.length) return;
      gsap.set(wis, { yPercent: 115 });
      gsap.to(wis, {
        yPercent: 0, duration: 1.05, stagger: .05, ease: 'power4.out',
        scrollTrigger: { trigger: h, start: 'top 88%', toggleActions: 'play none none reverse' }
      });
    });

    var revEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    var done = new Set();
    revEls.forEach(function (el) {
      if (done.has(el)) return;
      var sibs = revEls.filter(function (x) { return x.parentElement === el.parentElement; });
      sibs.forEach(function (s) { done.add(s); });
      var from = { opacity: 0, y: 34, filter: 'blur(8px)' };
      var to = {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: sibs.length > 1 ? el.parentElement : el, start: 'top 84%', toggleActions: 'play none none reverse' }
      };
      if (sibs.length > 1) to.stagger = .1;
      gsap.fromTo(sibs.length > 1 ? sibs : el, from, to);
    });

    document.querySelectorAll('.reveal-clip').forEach(function (el) {
      gsap.to(el, {
        clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power4.inOut',
        scrollTrigger: { trigger: el, start: 'top 84%', toggleActions: 'play none none reverse' }
      });
      var im = el.querySelector('img');
      if (im) gsap.fromTo(im, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---------- 3. scrub drift: teks, angka, decor ---------- */
    /* parallax hero */
    gsap.to('.hero-bg img', {
      yPercent: 14, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.utils.toArray('.ch-head').forEach(function (h) {
      gsap.fromTo(h, { yPercent: 16 }, {
        yPercent: -16, ease: 'none',
        scrollTrigger: { trigger: h.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    gsap.utils.toArray('.lead').forEach(function (h) {
      gsap.fromTo(h, { yPercent: 9 }, {
        yPercent: -9, ease: 'none',
        scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    gsap.utils.toArray('.sec-h').forEach(function (h) {
      gsap.fromTo(h, { yPercent: 7 }, {
        yPercent: -7, ease: 'none',
        scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    gsap.utils.toArray('.tl-y').forEach(function (h) {
      gsap.fromTo(h, { yPercent: 22 }, {
        yPercent: -22, ease: 'none',
        scrollTrigger: { trigger: h.closest('.tl-c') || h, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    gsap.fromTo('.stat', { yPercent: 10 }, {
      yPercent: -10, ease: 'none',
      scrollTrigger: { trigger: '.stat', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.fromTo('.ft-word', { xPercent: -5 }, {
      xPercent: 3, ease: 'none',
      scrollTrigger: { trigger: '.ft', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });

    /* ---------- 6. chapter decor per bab ---------- */
    gsap.utils.toArray('.ch-decor').forEach(function (d) {
      gsap.fromTo(d, { yPercent: 30, opacity: 0 }, {
        yPercent: -30, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: d.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* counter angka */
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var o = { v: 0 }, to = +el.dataset.count;
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
        }
      });
    });
  } else {
    document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = el.dataset.count; });
  }

  /* ---------- timeline sejarah (stagger + reverse) ---------- */
  var tlCards = gsap.utils.toArray('.tl-c');
  if (!reduce) {
    gsap.fromTo(tlCards, { opacity: 0, y: 26, filter: 'blur(6px)' }, {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: .9, stagger: .12, ease: 'power3.out',
      scrollTrigger: { trigger: '#tl', start: 'top 78%', toggleActions: 'play none none reverse' }
    });
    gsap.fromTo('#tlBar', { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '#tl', start: 'top 80%', end: 'bottom 55%', scrub: true }
    });
  } else { tlCards.forEach(function (c) { c.style.opacity = 1; c.style.transform = 'none'; }); }

  /* ---------- 8. proses: matchMedia desktop stack / mobile stagger ---------- */
  var cards = gsap.utils.toArray('.ps-card');
  var mm = gsap.matchMedia();
  if (reduce) {
    cards.forEach(function (c) { c.style.opacity = 1; c.style.transform = 'none'; });
  } else {
    mm.add('(min-width: 821px)', function () {
      var st = gsap.timeline({
        scrollTrigger: { trigger: '#ps', start: 'top top', end: 'bottom bottom', scrub: .6 }
      });
      for (var i = 1; i < cards.length; i++) {
        st.fromTo(cards[i],
          { opacity: 0, y: 70, scale: .97, zIndex: i + 1 },
          { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'power2.out' }, i);
        st.to(cards[i - 1], { scale: .965, opacity: .55, duration: .5, ease: 'power2.out' }, i);
      }
      cards.forEach(function (c) {
        var im = c.querySelector('.ps-img img');
        if (im) gsap.fromTo(im, { yPercent: -4 }, {
          yPercent: 4, ease: 'none',
          scrollTrigger: { trigger: '#ps', start: 'top top', end: 'bottom bottom', scrub: true }
        });
      });
    });
    mm.add('(max-width: 820px)', function () {
      cards.forEach(function (c, i) {
        var kids = c.querySelectorAll('.ps-img, .ps-txt');
        if (!kids.length) return;
        gsap.fromTo(kids, { opacity: 0, y: 40, filter: 'blur(6px)' }, {
          opacity: 1, y: 0, filter: 'blur(0px)', duration: .9, stagger: .12, delay: i * .04, ease: 'power3.out',
          scrollTrigger: { trigger: c, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      });
    });
  }

  /* ---------- 7. marquee ×2 (konstan, bukan ikut scroll) ---------- */
  if (!reduce) {
    [['.mq .mq-t', 70], ['.mq-big .mq-t', 44]].forEach(function (cfg) {
      var track = document.querySelector(cfg[0]);
      if (!track) return;
      var unit = track.scrollWidth;
      if (!unit) return;
      var need = Math.ceil((innerWidth * 2) / unit);
      if (need % 2) need++;
      var html = track.innerHTML;
      for (var k = 1; k < need; k++) track.innerHTML += html;
      gsap.to(track, { xPercent: -50, duration: (unit * need / 2) / cfg[1], ease: 'none', repeat: -1 });
    });
  }

  /* ---------- 10. progress bar scroll ---------- */
  gsap.fromTo('#prog', { scaleX: 0 }, {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: .3 }
  });

  /* ---------- keranjang ---------- */
  var cart = document.getElementById('cart'), cartL = document.getElementById('cartL'),
      cartTot = document.getElementById('cartTot'), cartN = document.getElementById('cartN');
  var items = [];
  function rupiah(v) { return 'Rp' + v.toLocaleString('id-ID'); }
  function cartRender() {
    var n = items.reduce(function (a, b) { return a + b.q; }, 0);
    var tot = items.reduce(function (a, b) { return a + b.q * b.price; }, 0);
    cartN.textContent = n;
    cartTot.textContent = rupiah(tot);
    if (!items.length) { cartL.innerHTML = '<p class="cart-e">Masih kosong. Mulai dari Bab VI.</p>'; return; }
    cartL.innerHTML = items.map(function (it, i) {
      return '<div class="cart-i"><div><b>' + it.name + '</b><div class="ci-n">' + it.q + ' × ' + rupiah(it.price) + '</div></div>' +
             '<button data-rm="' + i + '">Hapus</button></div>';
    }).join('');
  }
  function cartToggle(open) { cart.classList.toggle('open', open); cart.setAttribute('aria-hidden', String(!open)); }
  document.getElementById('navCart').addEventListener('click', function () { cartToggle(true); });
  document.getElementById('cartX').addEventListener('click', function () { cartToggle(false); });
  cart.addEventListener('click', function (e) { if (e.target === cart) cartToggle(false); });
  cartL.addEventListener('click', function (e) {
    var i = e.target.getAttribute('data-rm');
    if (i !== null && i !== undefined) { items.splice(+i, 1); cartRender(); }
  });
  document.querySelectorAll('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var c = btn.closest('.tk-c'), id = c.dataset.id;
      var it = items.find(function (x) { return x.id === id; });
      if (it) it.q++; else items.push({ id: id, name: c.dataset.name, price: +c.dataset.price, q: 1 });
      cartRender();
      btn.classList.add('done'); btn.textContent = 'Ditambahkan ✓';
      setTimeout(function () { btn.classList.remove('done'); btn.textContent = '+ Keranjang'; }, 1300);
    });
  });
  document.querySelector('.cart-buy').addEventListener('click', function () {
    var b = this; b.textContent = 'Demo saja — belum ada pembayaran'; setTimeout(function () { b.textContent = 'Checkout (demo)'; }, 1800);
  });

  /* ---------- newsletter ---------- */
  var nl = document.getElementById('nl'), nlOk = document.getElementById('nlOk');
  nl.addEventListener('submit', function (e) { e.preventDefault(); nl.style.display = 'none'; nlOk.style.display = 'block'; });

  /* ---------- smooth anchor (via Lenis) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      scrollToEl(t);
    });
  });

  addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
