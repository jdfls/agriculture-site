/* ============================================================
   Gallery morph hero - vanilla port of the 21.dev
   "scroll-morph-hero" component (framer-motion -> plain JS).

   Phases, like the original:
     scatter  -> cards fly in from random spots
     line     -> they line up in a row
     circle   -> they gather into a ring
     morph    -> as you scroll, the ring opens into a bottom arc
   Each card flips on hover (handled in CSS).

   Instead of hijacking the mouse wheel (which traps the page),
   the morph is driven by how far you have scrolled through the
   tall .morph-section - standard "scrollytelling".
   ============================================================ */

(function () {
  const section = document.getElementById('morph');
  const stage = document.getElementById('stage');
  const cardLayer = document.getElementById('cards');
  const intro = document.getElementById('introText');
  const arcText = document.getElementById('arcText');
  if (!section || !cardLayer) return; // not on this page

  // The trip photos, repeated so the ring looks full (like the 21.dev 20).
  const PHOTOS = [
    { src: 'images/arrival.svg',       label: 'Arrival' },
    { src: 'images/greenhouse.svg',    label: 'Greenhouse' },
    { src: 'images/sensors.svg',       label: 'Sensors' },
    { src: 'images/hydroponics.svg',   label: 'Hydroponics' },
    { src: 'images/vertical-farm.svg', label: 'Vertical Farm' },
    { src: 'images/drone.svg',         label: 'Drone' },
    { src: 'images/ai.svg',            label: 'AI Brain' },
  ];
  const TOTAL = 18;
  const lerp = (a, b, t) => a * (1 - t) + b * t;

  // --- Build the cards (the original maps over its image array) ---
  const cards = [];
  const scatter = [];
  for (let i = 0; i < TOTAL; i++) {
    const photo = PHOTOS[i % PHOTOS.length];

    const card = document.createElement('div');
    card.className = 'mcard';
    card.innerHTML =
      '<div class="mcard-inner">' +
        '<div class="mcard-front"><img src="' + photo.src + '" alt="' + photo.label + '"><div class="shade"></div></div>' +
        '<div class="mcard-back"><p class="tag">View</p><p>' + photo.label + '</p></div>' +
      '</div>';
    cardLayer.appendChild(card);
    cards.push(card);

    // a stable random scatter start for each card
    scatter.push({
      x: (Math.random() - 0.5) * 1400,
      y: (Math.random() - 0.5) * 900,
      rot: (Math.random() - 0.5) * 180,
      scale: 0.6,
      opacity: 0,
    });
  }

  // --- Phase timeline: scatter -> line -> circle (starts when seen) ---
  let phase = 'scatter';
  let started = false;
  const startIntro = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !started) {
        started = true;
        setTimeout(() => { phase = 'line'; }, 500);
        setTimeout(() => { phase = 'circle'; }, 2200);
      }
    });
  }, { threshold: 0.25 });
  startIntro.observe(stage);

  // --- How far we have scrolled through the section (0 -> 1) ---
  function scrollProgress() {
    const total = section.offsetHeight - window.innerHeight;
    const scrolled = -section.getBoundingClientRect().top;
    if (total <= 0) return 0;
    return Math.min(Math.max(scrolled / total, 0), 1);
  }

  // --- Per-frame layout (replaces framer-motion's animate/springs) ---
  function frame() {
    const rect = stage.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const isMobile = w < 768;

    // morph only runs once the circle has formed
    const morph = phase === 'circle' ? scrollProgress() : 0;

    // intro heading fades out as the morph begins; arc heading fades in near the end
    if (intro)   intro.style.opacity   = (phase === 'circle' && morph < 0.5) ? (1 - morph * 2) : (phase === 'circle' ? 0 : 1);
    if (arcText) arcText.style.opacity = morph > 0.8 ? (morph - 0.8) / 0.2 : 0;

    cards.forEach((card, i) => {
      let x, y, rot, scale, opacity;

      if (phase === 'scatter') {
        const p = scatter[i];
        x = p.x; y = p.y; rot = p.rot; scale = p.scale; opacity = p.opacity;

      } else if (phase === 'line') {
        const spacing = 70;
        x = i * spacing - (TOTAL * spacing) / 2;
        y = 0; rot = 0; scale = 1; opacity = 1;

      } else {
        // ----- circle position -----
        const minDim = Math.min(w, h);
        const circleR = Math.min(minDim * 0.44, 400);
        const cAngle = (i / TOTAL) * 360;
        const cRad = (cAngle * Math.PI) / 180;
        const circle = {
          x: Math.cos(cRad) * circleR,
          y: Math.sin(cRad) * circleR,
          rot: cAngle + 90,
        };

        // ----- bottom arc (rainbow) position -----
        const baseR = Math.min(w, h * 1.5);
        const arcR = baseR * (isMobile ? 1.4 : 1.05);
        const apexY = h * (isMobile ? 0.34 : 0.22);
        const arcCenterY = apexY + arcR;
        const spread = isMobile ? 100 : 130;
        const start = -90 - spread / 2;
        const step = spread / (TOTAL - 1);
        const aAngle = start + i * step;
        const aRad = (aAngle * Math.PI) / 180;
        const arc = {
          x: Math.cos(aRad) * arcR,
          y: Math.sin(aRad) * arcR + arcCenterY,
          rot: aAngle + 90,
          scale: isMobile ? 1.2 : 1.5,
        };

        // ----- interpolate circle -> arc by scroll progress -----
        x = lerp(circle.x, arc.x, morph);
        y = lerp(circle.y, arc.y, morph);
        rot = lerp(circle.rot, arc.rot, morph);
        scale = lerp(1, arc.scale, morph);
        opacity = 1;
      }

      card.style.opacity = opacity;
      card.style.transform =
        'translate(-50%, -50%) translate(' + x + 'px, ' + y + 'px) rotate(' + rot + 'deg) scale(' + scale + ')';
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
