(() => {
  'use strict';

  const C = window.LOVE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  const COLORS = ['--hb-red', '--hb-pink', '--hb-coral', '--hb-yellow', '--hb-lilac', '--hb-peach'];
  const flower = (v, cls = '') =>
    `<svg class="hb ${cls}" style="--c: var(${v})" aria-hidden="true" focusable="false"><use href="#hibiscus"></use></svg>`;
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const retrigger = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  const storage = type => ({
    get(k) { try { return JSON.parse(window[type].getItem(k)); } catch (_) { return null; } },
    set(k, v) { try { window[type].setItem(k, JSON.stringify(v)); } catch (_) {} },
    del(k) { try { window[type].removeItem(k); } catch (_) {} },
  });
  const local = storage('localStorage');
  const session = storage('sessionStorage');

  const waLink = text =>
    `https://wa.me/${String(C.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  const mailLink = (subject, text) =>
    `mailto:${String(C.email || '').trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;


  /* ═══════════════════════  THE APOLOGY  ═══════════════════════ */

  const gate = $('#gate');
  const card = $('#card');
  const main = $('#main');
  const yesBtn = $('#yes');
  const noBtn = $('#no');
  const msg = $('#msg');
  const form = $('#forgive-form');
  const input = $('#forgive-input');
  const msg2 = $('#msg2');
  const phraseEl = $('#phrase');
  const submitBtn = $('#forgive-submit');

  const say = (el, text) => { el.textContent = text; retrigger(el, 'pop'); };
  const shake = () => { if (!reduced) retrigger(card, 'shake'); };

  const showStep = name => {
    $$('.step', card).forEach(s => {
      const on = s.dataset.step === name;
      s.classList.toggle('is-active', on);
      s.inert = !on;
    });
  };

  // — the "No" button, and its slow emotional collapse —
  const NO_SCRIPT = [
    ['Wrong answer.', 'Are you sure?'],
    ['Still the wrong answer.', 'Really sure?'],
    ['Hmm. That doesn’t sound right.', 'Think again'],
    ['Pretty sure you meant the other button.', 'Pretty please?'],
    ['I’m going to pretend I didn’t see that.', 'Bishesha, please'],
    ['Okay. Now the No button is getting nervous.', 'NO'],
  ];
  const RUN_SCRIPT = [
    'Nope.',
    'Too slow.',
    'It really doesn’t want to be pressed.',
    'Honestly, neither do I.',
    'Almost had it.',
    'So close. (Not really.)',
  ];

  let noCount = 0;
  let runCount = 0;
  let running = false;
  let lastDodge = 0;
  let lastNoTouch = 0; // any No tap / dodge; a Yes "click" right after one is a stray finger, not a yes
  let ghost = null;    // invisible stand-in that keeps Yes from sliding under her finger

  noBtn.addEventListener('pointerdown', () => { lastNoTouch = performance.now(); });

  noBtn.addEventListener('click', () => {
    lastNoTouch = performance.now();
    if (running) { dodge(); return; }
    const [line, label] = NO_SCRIPT[noCount];
    noCount += 1;
    say(msg, line);
    shake();
    noBtn.textContent = label;
    yesBtn.style.setProperty('--grow', Math.min(1 + noCount * 0.14, 1.85));
    noBtn.style.setProperty('--shrink', Math.max(1 - noCount * 0.04, 0.8));
    if (noCount >= NO_SCRIPT.length) {
      running = true;
      noBtn.addEventListener('pointerenter', dodge);
    }
  });

  const clear = (x, y, w, h, r, m) =>
    x + w < r.left - m || x > r.right + m || y + h < r.top - m || y > r.bottom + m;

  function dodge() {
    const now = performance.now();
    lastNoTouch = now;
    if (now - lastDodge < 280) return;
    lastDodge = now;

    if (runCount >= RUN_SCRIPT.length) { noLeaves(); return; }

    const r = noBtn.getBoundingClientRect();
    if (!noBtn.classList.contains('is-running')) {
      // lift it out of the card so it can roam the whole screen, leaving an
      // invisible placeholder so the Yes button stays exactly where it was
      ghost = document.createElement('span');
      ghost.className = 'no-ghost';
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.width = `${r.width}px`;
      ghost.style.height = `${r.height}px`;
      noBtn.replaceWith(ghost);
      body.appendChild(noBtn);
      noBtn.classList.add('is-running');
      noBtn.style.left = `${r.left}px`;
      noBtn.style.top = `${r.top}px`;
      void noBtn.offsetWidth;
    }

    const w = r.width;
    const h = r.height;
    const pad = 16;
    const maxX = Math.max(pad, innerWidth - w - pad);
    const maxY = Math.max(pad, innerHeight - h - pad);
    const cardR = card.getBoundingClientRect();
    const yesR = yesBtn.getBoundingClientRect();
    const rand = () => ({ x: pad + Math.random() * (maxX - pad), y: pad + Math.random() * (maxY - pad) });
    const farEnough = p => Math.hypot(p.x - r.left, p.y - r.top) > 120;

    let pos = null;
    for (let i = 0; i < 60 && !pos; i += 1) {
      const p = rand();
      if (farEnough(p) && clear(p.x, p.y, w, h, cardR, 10)) pos = p;
    }
    for (let i = 0; i < 60 && !pos; i += 1) {
      const p = rand();
      if (farEnough(p) && clear(p.x, p.y, w, h, yesR, 16)) pos = p;
    }
    pos = pos || { x: pad, y: pad };

    noBtn.style.left = `${pos.x}px`;
    noBtn.style.top = `${pos.y}px`;
    say(msg, RUN_SCRIPT[runCount]);
    runCount += 1;
  }

  function noLeaves() {
    noBtn.removeEventListener('pointerenter', dodge);
    noBtn.classList.add('is-gone');
    say(msg, 'The No button has left the chat.');
    setTimeout(() => noBtn.remove(), 500);
    // after a beat, let Yes glide to the centre (nothing left to mis-tap by then)
    setTimeout(() => {
      if (!ghost) return;
      ghost.style.width = '0px';
      ghost.style.marginLeft = '-12px';
      setTimeout(() => { if (ghost) ghost.remove(); ghost = null; }, 600);
    }, 1200);
    setTimeout(() => {
      if (!$('.step[data-step="ask"]').classList.contains('is-active')) return;
      say(msg, 'Looks like there’s only one option now.');
      yesBtn.classList.add('is-pulsing');
    }, 2600);
  }

  addEventListener('resize', () => {
    if (!noBtn.classList.contains('is-running') || !noBtn.isConnected) return;
    const r = noBtn.getBoundingClientRect();
    noBtn.style.left = `${Math.min(r.left, innerWidth - r.width - 16)}px`;
    noBtn.style.top = `${Math.min(r.top, innerHeight - r.height - 16)}px`;
  });

  // — "Yes" —
  yesBtn.addEventListener('click', () => {
    // a finger that was aiming for No shouldn't count as a yes
    if (performance.now() - lastNoTouch < 700) return;
    if (noBtn.parentElement === body) {
      noBtn.classList.add('is-gone');
      setTimeout(() => noBtn.remove(), 400);
    }
    showStep('type');
    setTimeout(() => input.focus({ preventScroll: true }), 500);
  });

  // — say it properly —
  const PHRASE = 'I forgive you Shreyas';
  const norm = s => s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const TARGET = norm(PHRASE);

  phraseEl.innerHTML = Array.from(PHRASE).map(ch => `<span>${esc(ch)}</span>`).join('');
  const chars = $$('span', phraseEl);

  input.addEventListener('input', () => {
    const typed = input.value.trimStart().toLowerCase();
    const target = PHRASE.toLowerCase();
    let n = 0;
    while (n < typed.length && n < target.length && typed[n] === target[n]) n += 1;
    chars.forEach((s, i) => s.classList.toggle('hit', i < n));
    submitBtn.classList.toggle('is-ready', norm(input.value) === TARGET);
  });

  input.addEventListener('paste', e => {
    e.preventDefault();
    say(msg2, 'No copy-paste. Type it — with feeling.');
    shake();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = norm(input.value);
    if (v === TARGET) { forgive(); return; }

    let line = 'Hmm, not quite. Word for word, please.';
    if (!v) line = 'The box is empty. Kind of like my memory on our anniversary.';
    else if (/\b(don't|dont|do not|not|never|nope|no)\b/.test(v)) line = 'Nice try. Let’s lose the “not”.';
    else if (v.includes('forgive') && !v.includes('shreyas')) line = 'Almost — but forgive who? (Hint: it’s me.)';
    else if (v.includes('forgive') && v.includes('shreyas')) line = 'So close. Exactly as written, please.';
    else if (v.includes('love')) line = 'I love you too. But that’s not what I asked.';
    say(msg2, line);
    shake();
  });

  function forgive() {
    session.set('forgiven', true);
    input.blur();
    showStep('done');
    bloom();
    setTimeout(() => enter(false), reduced ? 700 : 2400);
  }

  function bloom() {
    if (reduced) return;
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const reach = Math.max(innerWidth, innerHeight) * 0.5;
    const layer = document.createElement('div');
    layer.className = 'bloom';
    layer.setAttribute('aria-hidden', 'true');

    const REAL = ['white', 'orange', 'pink'].map(n => `assets/flowers/${n}.webp`);
    for (let i = 0; i < 24; i += 1) {
      const size = 24 + Math.random() * 40;
      const angle = Math.random() * Math.PI * 2;
      const dist = 140 + Math.random() * reach;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 60;
      const rot = (Math.random() - 0.5) * 400;
      const el = document.createElement('img');
      el.className = 'bloom__f';
      el.src = REAL[i % REAL.length];
      el.alt = '';
      el.style.width = `${size}px`;
      el.style.left = `${cx - size / 2}px`;
      el.style.top = `${cy - size / 2}px`;
      layer.appendChild(el);
      el.animate([
        { transform: 'translate(0, 0) scale(.2) rotate(0deg)', opacity: 0 },
        { opacity: 1, offset: 0.15 },
        { transform: `translate(${dx}px, ${dy}px) scale(1) rotate(${rot}deg)`, opacity: 0 },
      ], {
        duration: 1800 + Math.random() * 1300,
        delay: Math.random() * 250,
        easing: 'cubic-bezier(.15, .7, .3, 1)',
        fill: 'forwards',
      });
    }
    body.appendChild(layer);
    setTimeout(() => layer.remove(), 3800);
  }

  function enter(instant) {
    if (noBtn.parentElement === body) noBtn.remove();
    body.classList.remove('is-locked');
    main.inert = false;
    if (instant) {
      gate.remove();
    } else {
      window.scrollTo(0, 0);
      gate.classList.add('is-leaving');
      setTimeout(() => gate.remove(), 1200);
      $('#hello').focus({ preventScroll: true });
    }
    startReveal();
    onScroll();
  }


  /* ═══════════════════════  THE PAGE  ═══════════════════════ */

  // — reveal on scroll —
  function startReveal() {
    const items = $$('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(el => io.observe(el));
  }

  // — scroll progress —
  const bar = $('#progress');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

  // — photos —
  const photos = C.photos || {};
  const placeholder = (i, ar) => {
    const c = COLORS[i % COLORS.length];
    return `<div class="ph" style="--c: var(${c}); --ar: ${ar}">${flower(c)}<span>photo coming soon</span></div>`;
  };

  // her: one photo, or a slow crossfade through several
  const herList = (photos.her || []).filter(p => p && p.src);
  if (herList.length) {
    const arch = $('#her .arch');
    arch.innerHTML = herList.map((p, i) =>
      `<img src="${esc(p.src)}" alt="${i ? '' : esc(p.alt || 'Bishesha')}" decoding="async"${i ? ' loading="lazy"' : ''}${i ? '' : ' class="is-on"'}>`
    ).join('');
    $$('img', arch).forEach(img => img.addEventListener('error', () => {
      const wasOn = img.classList.contains('is-on');
      img.remove();
      const left = $$('img', arch);
      if (!left.length) arch.innerHTML = placeholder(1, 'auto');
      else if (wasOn) left[0].classList.add('is-on');
    }, { once: true }));

    if (herList.length > 1 && !reduced) {
      setInterval(() => {
        const imgs = $$('img', arch);
        if (imgs.length < 2 || document.hidden) return;
        const k = Math.max(0, imgs.findIndex(im => im.classList.contains('is-on')));
        imgs[k].classList.remove('is-on');
        imgs[(k + 1) % imgs.length].classList.add('is-on');
      }, 4500);
    }

    const cap = herList[0].caption;
    if (typeof cap === 'string') {
      $('#her-caption').textContent = cap;
      $('#her-caption').hidden = !cap;
    }
  }

  const gallery = $('#gallery');
  const us = (photos.us || []).filter(p => p && p.src);
  if (us.length) {
    gallery.innerHTML = us.map((p, i) => `
      <figure class="shot reveal" style="--d: ${(i % 3) * 90}ms">
        <button class="shot__open" type="button" data-i="${i}" aria-label="View photo${p.caption ? `: ${esc(p.caption)}` : ''}">
          <img src="${esc(p.src)}" alt="${esc(p.alt || p.caption || 'Us')}" decoding="async">
        </button>
        ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}
      </figure>`).join('');
    $$('img', gallery).forEach((img, i) => {
      img.addEventListener('error', () => { img.closest('.shot__open').outerHTML = placeholder(i, '4 / 5'); }, { once: true });
    });
  } else {
    gallery.innerHTML = ['4 / 5', '1 / 1', '3 / 4', '4 / 3', '4 / 5', '1 / 1']
      .map((ar, i) => `<figure class="shot reveal" style="--d: ${(i % 3) * 90}ms">${placeholder(i, ar)}</figure>`)
      .join('');
  }

  // — lightbox —
  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  const lbCap = $('figcaption', lb);
  let lbIndex = 0;
  let lbReturn = null;

  const lbShow = i => {
    const p = us[i];
    lbIndex = i;
    lbImg.src = p.src;
    lbImg.alt = p.alt || p.caption || 'Us';
    lbCap.textContent = p.caption || '';
  };
  const lbClose = () => {
    lb.classList.remove('is-open');
    setTimeout(() => { lb.hidden = true; }, 250);
    if (lbReturn) lbReturn.focus();
  };

  gallery.addEventListener('click', e => {
    const b = e.target.closest('.shot__open');
    if (!b) return;
    lbReturn = b;
    lbShow(Number(b.dataset.i));
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    $('.lightbox__close', lb).focus();
  });
  lb.addEventListener('click', e => { if (e.target !== lbImg) lbClose(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowRight') lbShow((lbIndex + 1) % us.length);
    else if (e.key === 'ArrowLeft') lbShow((lbIndex - 1 + us.length) % us.length);
  });

  // — open when… letters —
  $$('.letter').forEach(b => {
    b.addEventListener('click', () => {
      const open = b.classList.toggle('is-open');
      b.setAttribute('aria-expanded', String(open));
    });
  });

  // — coupons —
  const redeemed = local.get('coupons') || {};
  $$('.coupon').forEach(c => {
    const id = c.dataset.id;
    const title = $('.coupon__title', c).textContent.trim();
    const stub = $('.coupon__stub', c);
    const btn = $('.coupon__btn', c);
    const stamp = $('.coupon__stamp', c);
    const unlimited = c.hasAttribute('data-unlimited');

    const tell = document.createElement('a');
    tell.className = 'coupon__tell';
    tell.target = '_blank';
    tell.rel = 'noopener';
    tell.textContent = 'tell him →';
    tell.href = waLink(`Hi Shreyas 🌺 I'm redeeming my coupon: "${title}".`);

    const render = animate => {
      const n = Number(redeemed[id]) || 0;
      if (!n) return;
      c.classList.add('is-redeemed');
      if (animate && !reduced) retrigger(c, 'stamp-in');
      if (unlimited) {
        btn.textContent = 'Redeem again';
        stamp.textContent = n > 1 ? `redeemed ×${n}` : 'redeemed';
      } else if (btn.isConnected) {
        btn.remove();
      }
      if (!tell.isConnected) stub.appendChild(tell);
    };

    btn.addEventListener('click', () => {
      redeemed[id] = (Number(redeemed[id]) || 0) + 1;
      local.set('coupons', redeemed);
      render(true);
    });
    render(false);
  });

  // — feedback —
  const fb = $('#fb');
  const receipt = $('#receipt');
  const rlist = $('#receipt-list');
  const rateText = $('#rate-text');
  const fbMsg = $('#fb-msg');
  const rates = $$('.rate', fb);
  const RATE = [
    'tap a flower',
    'Needs a lot of work. (Fair.)',
    'Has potential.',
    'Decent — could be more on time.',
    'Pretty great, honestly.',
    'Best boyfriend ever. (Biased survey.)',
  ];
  let rating = 0;

  const paint = v => {
    rates.forEach(l => l.classList.toggle('is-on', Number(l.dataset.v) <= v));
    rateText.textContent = RATE[v];
  };
  rates.forEach(l => l.addEventListener('mouseenter', () => paint(Number(l.dataset.v))));
  $('#rating').addEventListener('mouseleave', () => paint(rating));
  fb.addEventListener('change', e => {
    if (e.target.name !== 'rating') return;
    rating = Number(e.target.value);
    paint(rating);
  });

  const collect = () => {
    const d = new FormData(fb);
    return {
      rating: Number(d.get('rating')) || 0,
      work: d.getAll('work'),
      loves: String(d.get('loves') || '').trim(),
      note: String(d.get('note') || '').trim(),
      love: String(d.get('love') || ''),
    };
  };

  const compose = f => {
    const lines = ['Boyfriend performance review 🌺', '', `Rating: ${f.rating}/5 — ${RATE[f.rating]}`];
    if (f.work.length) lines.push(`Work on: ${f.work.join(', ')}`);
    if (f.loves) lines.push(`Something I love: ${f.loves}`);
    if (f.note) lines.push(`Also: ${f.note}`);
    if (f.love) lines.push(`Still love you? ${f.love}`);
    return lines.join('\n');
  };

  // POST as plain form data (a "simple" request, so the browser skips the CORS preflight);
  // resolves true only if the service confirms it went through
  const postForm = async (url, payload, confirmed, ms = 12000) => {
    if (!window.fetch || !window.FormData) return false;
    const body = new FormData();
    Object.entries(payload).forEach(([k, v]) => body.append(k, v));
    const ctrl = window.AbortController ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), ms);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body,
        signal: ctrl ? ctrl.signal : undefined,
      });
      const data = await res.json().catch(() => ({}));
      return res.ok && confirmed(data);
    } catch (_) {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  // quietly email the answers to him: Web3Forms first, FormSubmit as a backup
  const mailFeedback = async f => {
    const subject = `Boyfriend performance review: ${f.rating}/5 🌺`;
    const fields = {
      Rating: `${f.rating}/5 — ${RATE[f.rating]}`,
      'Work on': f.work.join(', ') || '—',
      'Something she loves': f.loves || '—',
      'Anything else': f.note || '—',
      'Still loves you?': f.love || '—',
    };

    const key = String(C.web3formsKey || '').trim();
    if (key && await postForm('https://api.web3forms.com/submit',
      { access_key: key, subject, from_name: 'Bishesha', ...fields },
      d => d.success === true || String(d.success) === 'true')) return true;

    const to = String(C.feedbackTo || '').trim();
    if (to && await postForm(`https://formsubmit.co/ajax/${to}`,
      { _subject: subject, _template: 'table', _captcha: 'false', ...fields },
      d => String(d.success) === 'true')) return true;

    return false;
  };

  const showReceipt = (f, focus) => {
    const mini = `<span class="mini">${Array.from({ length: f.rating }, (_, i) => flower(COLORS[i])).join('')}</span>`;
    const rows = [['Rating', `${mini}${esc(RATE[f.rating])}`]];
    if (f.work.length) rows.push(['Work on', esc(f.work.join(', '))]);
    if (f.loves) rows.push(['Loves', esc(f.loves)]);
    if (f.note) rows.push(['Also', esc(f.note).replace(/\n/g, '<br>')]);
    if (f.love) rows.push(['Still loves him', esc(f.love)]);
    rlist.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

    const text = compose(f);
    $('#send-wa').href = waLink(text);
    $('#send-mail').href = mailLink('Boyfriend performance review', text);

    $('#receipt-text').textContent = f.sent
      ? 'Shreyas has been notified, emotionally and by email. He’s probably reading it right now.'
      : 'Shreyas has been notified (emotionally). The email didn’t go through, so send it to him this way:';
    $('#receipt-actions').hidden = !!f.sent;

    fb.hidden = true;
    receipt.hidden = false;
    if (focus) receipt.focus({ preventScroll: true });
  };

  const sendBtn = $('#fb-send');
  let sending = false;

  fb.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;
    const f = collect();
    if (!f.rating) {
      say(fbMsg, 'Pick a flower first — even one. (Gently.)');
      rates[0].querySelector('input').focus();
      return;
    }
    sending = true;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';
    fbMsg.textContent = '';

    f.sent = await mailFeedback(f);
    local.set('feedback', f);

    sending = false;
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send feedback';
    showReceipt(f, true);
    receipt.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  });

  $('#fb-edit').addEventListener('click', () => {
    receipt.hidden = true;
    fb.hidden = false;
    fb.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });

  const saved = local.get('feedback');
  if (saved && saved.rating) {
    rating = Number(saved.rating) || 0;
    fb.elements.rating.value = String(rating);
    $$('input[name="work"]', fb).forEach(cb => { cb.checked = (saved.work || []).includes(cb.value); });
    fb.elements.loves.value = saved.loves || '';
    fb.elements.note.value = saved.note || '';
    if (saved.love) fb.elements.love.value = saved.love;
    paint(rating);
    showReceipt({ ...saved, rating, work: saved.work || [] }, false);
  }

  // — days together —
  if (C.togetherSince) {
    const start = new Date(`${C.togetherSince}T00:00:00`);
    const days = Math.floor((Date.now() - start.getTime()) / 864e5);
    if (!Number.isNaN(days) && days > 0) {
      const el = $('#days');
      el.textContent = `${days.toLocaleString('en-IN')} days of us, and counting.`;
      el.hidden = false;
    }
  }


  /* ═══════════════════════  START  ═══════════════════════ */

  if (new URLSearchParams(location.search).has('again')) {
    session.del('forgiven');
    history.replaceState(null, '', location.pathname + location.hash);
  }

  if (session.get('forgiven')) enter(true);
})();
