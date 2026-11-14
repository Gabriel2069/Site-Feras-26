"use strict";

// Keep the paper in place while the browser fetches and decodes the image.
function developPhoto(image, source) {
  image.classList.remove("photo-developed", "photo-unavailable");
  image.classList.add("photo-developing");
  let settled = false;
  const ready = async () => {
    if (settled || !image.naturalWidth) return;
    settled = true;
    try { await image.decode(); } catch {}
    image.classList.replace("photo-developing", "photo-developed");
  };
  image.addEventListener("load", ready, {once:true});
  image.addEventListener("error", () => {
    image.classList.replace("photo-developing", "photo-unavailable");
    image.addEventListener("load", () => {
      image.classList.remove("photo-unavailable");
      image.classList.add("photo-developed");
    }, {once:true});
  }, {once:true});
  image.src = source;
  if (image.complete) ready();
}



const memorialAudio = (() => {
  const control = document.querySelector("#soundButton");
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  const trackButton = document.querySelector("#soundtrackPlay");
  const trackStatus = document.querySelector("#soundtrackStatus");
  const localTrack = window.ferasPreview?.soundtrack || window.ferasHosted?.soundtrack;
  const music = new Audio(localTrack || window.ferasPreview?.soundtrackPreview || "./media/audio/outro-previa.mp3");
  music.preload = "none";
  music.loop = Boolean(localTrack);
  music.volume = localTrack ? .35 : .24;
  let context;
  let master;
  let noise;
  let muted = false;
  let featured = false;
  let soundtrackWanted = Boolean(localTrack);
  if (localTrack) {
    trackButton.textContent = "Tocar trilha";
    trackStatus.textContent = "A trilha acompanha o memorial a partir da primeira interação.";
  }

  function updateMusic() {
    if (muted || featured || !soundtrackWanted) {
      music.pause();
      return;
    }
    if (!music.paused) return;
    music.play().catch(error => {
      if (error.name === "AbortError" || muted || featured || !soundtrackWanted) return;
      trackStatus.textContent = "Toque em Tocar trilha para continuar.";
    });
  }
  for (const event of ["play", "pause", "ended"]) {
    music.addEventListener(event, () => {
      const playing = !music.paused && !music.ended;
      trackButton.textContent = playing ? "Pausar trilha" : localTrack ? "Tocar trilha" : "Tocar prévia";
      trackButton.setAttribute("aria-pressed", String(playing));
      if (playing) trackStatus.textContent = "Tocando Outro · M83";
      if (event === "ended") {
        soundtrackWanted = false;
        trackStatus.textContent = "Fim da prévia. A versão integral está no canal do M83.";
      }
    });
  }
  trackButton.addEventListener("click", () => {
    soundtrackWanted = music.paused && (!featured || !soundtrackWanted);
    if (soundtrackWanted && muted) control.click();
    if (soundtrackWanted && featured) trackStatus.textContent = "A trilha volta depois da cena do baile.";
    updateMusic();
  });
  function unlock() {
    if (!AudioEngine || muted) return;
    if (!context) {
      context = new AudioEngine();
      master = context.createGain();
      master.connect(context.destination);
      noise = context.createBuffer(1, Math.round(context.sampleRate * .4), context.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    if (context.state !== "running") context.resume().catch(() => {});
    if (soundtrackWanted && music.paused) updateMusic();
  }
  control.addEventListener("click", () => {
    muted = !muted;
    control.setAttribute("aria-pressed", String(muted));
    control.title = muted ? "Ativar sons" : "Silenciar todos os sons";
    control.setAttribute("aria-label", control.title);
    if (master) master.gain.value = muted ? 0 : 1;
    if (!muted) unlock();
    updateMusic();
    document.dispatchEvent(new Event("memorial-sound-change"));
  });
  for (const event of ["pointerdown","touchend","keydown"]) {
    addEventListener(event, input => {
      if (!input.target.closest?.("#soundButton, #soundtrackPlay")) unlock();
    }, {passive:true});
  }
  return {
    get muted() { return muted; },
    feature(active) {
      if (featured === active) return;
      featured = active;
      updateMusic();
    },
    effect(name, delay = 0) {
      if (muted || context?.state !== "running") return;
      const settings = {
        key:[.032,2150,.10], page:[.17,1220,.065], beat:[.29,140,.50],
      };
      const [duration, frequency, level] = settings[name];
      const start = context.currentTime + delay;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const envelope = context.createGain();
      source.buffer = noise;
      filter.type = "lowpass";
      filter.frequency.value = frequency * (.9 + Math.random() * .2);
      envelope.gain.setValueAtTime(level, start);
      envelope.gain.exponentialRampToValueAtTime(.001, start + duration);
      source.connect(filter).connect(envelope).connect(master);
      source.start(start,0,duration);
    }
  };
})();


// A horizontal gesture changes the page. Vertical gestures remain native.
function watchHorizontalSwipe(surface, changePage, accepts = () => true) {
  let start;
  surface.addEventListener("pointerdown", event => {
    start = undefined;
    if (!event.isPrimary || event.button !== 0 || !accepts(event) ||
        event.target.closest("button, a, video, input, select")) return;
    start = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  surface.addEventListener("pointerup", event => {
    if (start?.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = undefined;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.35) changePage(dx < 0 ? 1 : -1);
  });
  surface.addEventListener("pointercancel", () => { start = undefined; });
  surface.addEventListener("dragstart", event => {
    if (start && event.target.closest("img")) event.preventDefault();
  });
}

(() => {
  const film = document.querySelector(".film");
  const layers = Object.fromEntries(
    [...film.querySelectorAll("[data-layer]")].map(layer => [layer.dataset.layer, layer])
  );
  const shot = window.ferasPreview?.shots ?? window.ferasHosted?.shots ?? {};
  const graphics = {
    "trote-1": "assets/kit-trote-i.webp",
    "trote-2": "assets/kit-trote-ii.webp",
    "trote-3": "assets/kit-trote-iii.webp",
    "saudade-1": "assets/quadros-feras.png",
    "saudade-2": "assets/kit-recreaco.webp",
    "saudade-3": "assets/kit-day-off.webp",
    "saudade-4": "assets/baloes-feras.png",
  };

  for (const image of film.querySelectorAll("[data-shot]")) {
    const key = image.dataset.shot;
    const src = shot[key] ?? graphics[key];
    if (src) developPhoto(image, src);
    if (shot[key]) image.dataset.previewShot = "";
  }
  if (window.ferasPreview || window.ferasHosted) document.body.classList.add("preview-media");

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const opening = layers.opening;
  const reel = layers.reel;
  const collective = layers.collective;
  const stage = film.querySelector(".film__stage");
  const openingPhoto = film.querySelector(".film__photograph img");
  const openingTitle = film.querySelector(".film__opening-type");
  const openingMark = film.querySelector(".film__mark");
  const tiles = [...film.querySelectorAll(".film__tile")];
  const inks = [...film.querySelectorAll(".film__ink")];
  const strips = [...film.querySelectorAll(".film__strip")];
  const grid = film.querySelector(".film__grid");
  const gridPieces = [...grid.children];
  const reelPrints = [...film.querySelectorAll(".film__reel-print")];
  const openingWords = [...openingTitle.querySelector(".film__title").children];
  const reelWords = [...reel.querySelector(".film__title").children];
  const collectiveWords = [...collective.querySelector(".film__title").children];
  const openingTiles = [...opening.querySelector(".film__tiles").children];
  const paper = reel.querySelector(".film__reel-paper");
  const shapes = opening.querySelector(".film__shapes");
  const splice = film.querySelector(".film__splice");
  const spliceInk = splice.querySelector(".film__splice-ink");
  const spliceTiles = [...splice.querySelector(".film__splice-tiles").children];
  const wash = collective.querySelector(".film__collective-wash");

  let current = 0;
  let frame = 0;
  let lastTime = 0;
  let start = 0;
  let travel = 1;
  const between = (value, start, end) => Math.min(1, Math.max(0, (value - start) / (end - start)));
  const ease = value => value * value * (3 - 2 * value);
  const section = (value, start, end) => ease(between(value, start, end));

  // The same scroll position produces the same exposed fibres, even when played backwards.
  const fibres = Array.from({length: 65}, (_, i) =>
    Math.sin(i * .41) * 3.7 + Math.sin(i * .99) * 2.1 + Math.sin(i * 2.67) * 1.6);
  function torn(value, direction) {
    const edge = fibres.map((offset, index) => {
      const along = index * 100 / (fibres.length - 1);
      const position = 112 - value * 125 + offset;
      return direction === "up" ? `${along}% ${position}%` : `${position}% ${along}%`;
    });
    return "polygon(" + edge.join(",") + (direction === "up" ? ",100% 100%,0 100%)" : ",100% 100%,100% 0)");
  }
  const show = (layer, visible) => {
    if (layer.hidden !== !visible) layer.hidden = !visible;
    if (layer.inert !== !visible) layer.inert = !visible;
  };
  function title(words, p, first, last) {
    words.forEach((word, i) => {
      const reveal = section(p, first + i * .033, last + i * .027);
      word.style.clipPath = `inset(0 0 ${(1 - reveal) * 110}% -12%)`;
      word.style.translate = `${(1 - reveal) * (i ? 13 : -9)}vw ${(1 - reveal) * 10}vh`;
    });
  }

  function cut(p, start, end, kind) {
    const phase = between(p, start, end);
    if (phase === 0 || phase === 1) return false;
    splice.dataset.cut = kind;
    if (kind === "mosaic") {
      splice.style.clipPath = "none";
      splice.style.translate = "0 0";
      spliceTiles.forEach((tile, i) => {
        const close = section(phase, (i % 4) * .057, .34 + (i % 4) * .052);
        const open = section(phase, .51 + (i % 4) * .036, .84 + (i % 4) * .048);
        const direction = i < 4 ? -1 : 1;
        tile.style.translate = `${((1 - close) - open) * (i % 2 ? 16 : -16)}vw ${(1 - close + open) * direction * 65}vh`;
        tile.style.rotate = `${(1 - close + open) * direction * 11}deg`;
        tile.style.opacity = "1";
      });
      return true;
    }
    const fall = section(phase, 0, .58);
    const pull = section(phase, .44, 1);
    const direction = kind === "ink" ? "right" : "up";
    splice.style.clipPath = torn(fall, direction);
    splice.style.translate = kind === "ink" ? `${-pull * 119}% 0` : `0 ${-pull * 119}%`;
    spliceInk.style.scale = `${.48 + fall * .66}`;
    spliceTiles.forEach((tile, i) => {
      const stamp = section(phase, .12 + (i % 4) * .048, .57 + (i % 4) * .044);
      tile.style.translate = `${(1 - stamp) * (i % 2 ? 21 : -18)}vw ${(1 - stamp) * (i < 4 ? -15 : 12)}vh`;
      tile.style.rotate = `${(1 - stamp) * (i % 2 ? 38 : -25)}deg`;
      tile.style.opacity = stamp;
    });
    return true;
  }

  function compose(p) {
    const enter = section(p, .096, .239);
    const leaveOpening = section(p, .409, .585);
    const enterCollective = section(p, .711, .854);
    show(layers.slate, enter < 1);
    document.body.classList.toggle("film-in-slate", p < .075);
    show(opening, enter > 0 && leaveOpening < 1);
    show(reel, leaveOpening > 0 && enterCollective < 1);
    show(collective, enterCollective > 0);
    splice.hidden = !(cut(p, .088, .248, "paper") || cut(p, .394, .557, "ink") || cut(p, .697, .835, "mosaic"));

    if (!opening.hidden) {
      const push = section(p, .15, .42);
      opening.style.clipPath = enter < 1 ? torn(enter, "up") : "none";
      openingPhoto.style.transform = `translate3d(${(push - .5) * 2.2}%,${(push - .5) * 1.5}%,0) scale(${1 + push * .055})`;
      shapes.style.transform = `translate3d(${(push - .5) * -5}%,${(push - .5) * 4}%,0) rotate(${push * 9 - 4}deg)`;
      title(openingWords, p, .195, .278);
      openingMark.style.opacity = section(p, .277, .346);
      openingMark.style.translate = `${(1 - section(p, .256, .344)) * 15}vw`;
      inks.forEach((ink, index) => {
        const spread = section(p, .15 + index * .05, .32 + index * .035);
        ink.style.scale = String(.48 + spread * .52);
        ink.style.rotate = (index ? -1 : 1) * (1 - spread) * 23 + "deg";
      });
      openingTiles.forEach((tile, index) => {
        const stamp = section(p, .164 + index * .011, .261 + index * .011);
        tile.style.scale = String(.2 + stamp * .8);
        tile.style.opacity = stamp;
        tile.style.rotate = `${(1 - stamp) * (index % 2 ? 45 : -35)}deg`;
      });
      tiles.forEach((tile, index) => {
        const landing = section(p, .208 + index * .039, .306 + index * .031);
        tile.style.translate = `${(index ? 1 : -1) * (1 - landing) * 35}vw ${(1 - landing) * 16}vh`;
        tile.style.rotate = `${(1 - landing) * (index ? 25 : -22)}deg`;
      });
    }
    if (!reel.hidden) {
      reel.style.clipPath = leaveOpening < 1 ? torn(leaveOpening, "right") : "none";
      const conveyor = section(p, .51, .747);
      paper.style.translate = `${-conveyor * 6}vw ${(1 - section(p, .423, .553)) * 16}vh`;
      title(reelWords, p, .49, .55);
      strips.forEach((strip, index) => {
        const landing = section(p, .463 + index * .04, .577 + index * .034);
        const pull = section(p, .66, .781);
        strip.style.translate = `${(1 - landing) * (43 - index * 8) - conveyor * 11 - pull * index * 3}vw ${(1 - landing) * (index === 1 ? -42 : 36) - pull * (index - 1) * 10}vh`;
        strip.style.rotate = `${(1 - landing) * (index === 1 ? 21 : -20) + conveyor * (index - 1) * 6}deg`;
      });
      reelPrints.forEach((sticker, i) => {
        const pop = section(p, .528 + i * .033, .6 + i * .03);
        sticker.style.opacity = pop;
        sticker.style.scale = `${.45 + pop * .55}`;
        sticker.style.translate = `0 ${(1 - pop) * 9}vh`;
      });
    }
    if (!collective.hidden) {
      collective.style.clipPath = enterCollective < 1 ? torn(enterCollective, "up") : "none";
      const settle = section(p, .805, .972);
      wash.style.scale = `${.69 + settle * .33}`;
      title(collectiveWords, p, .819, .907);
      grid.style.scale = String(1.18 - settle * .18);
      gridPieces.forEach((piece, index) => {
        const land = section(p, .749 + index * .027, .866 + index * .027);
        piece.style.translate = `${(index % 2 ? 1 : -1) * (1 - land) * 31}vw ${(index < 2 ? -1 : 1) * (1 - land) * 19}vh`;
        piece.style.rotate = `${(index % 2 ? -1 : 1) * (1 - land) * 18}deg`;
        piece.style.scale = `${.68 + land * .32}`;
      });
    }
  }

  function draw(time) {
    frame = 0;
    if (motion.matches || film.classList.contains("is-writing")) return;
    const target = between(scrollY, start, start + travel);
    if (target === current) return;
    const elapsed = Math.min(45, time - lastTime || 16);
    lastTime = time;
    current += (target - current) * (1 - Math.exp(-elapsed / 46));
    if (Math.abs(target - current) < .001) current = target;
    compose(current);
    if (current !== target) queue();
  }
  function queue() {
    if (!motion.matches && !frame) frame = requestAnimationFrame(draw);
  }
  function measure() {
    start = film.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, film.offsetHeight - stage.offsetHeight);
    queue();
  }
  function configure() {
    film.classList.toggle("is-directed", !motion.matches);
    if (motion.matches) {
      document.body.classList.remove("film-in-slate");
      cancelAnimationFrame(frame);
      frame = 0;
      for (const layer of Object.values(layers)) show(layer, true);
      splice.hidden = true;
      for (const node of [opening, reel, collective, openingPhoto, openingMark, paper, shapes, wash, grid,
        ...openingWords, ...reelWords, ...collectiveWords, ...openingTiles, ...reelPrints, ...tiles, ...inks, ...strips, ...gridPieces]) {
        node.removeAttribute("style");
      }
    } else {
      measure();
      current = between(scrollY, start, start + travel);
      compose(current);
    }
  }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  motion.addEventListener("change", configure);
  configure();

  // Match the pauses and block cursor from Aryana's cartela.
  if (!motion.matches && (!location.hash || location.hash === "#inicio") && scrollY < 2) {
    const slateText = layers.slate.querySelector(".film__slate-text");
    const originals = [...slateText.children].map(line => line.textContent);
    const typing = document.createElement("span");
    typing.className = "film__typing";
    typing.setAttribute("aria-hidden", "true");
    const lines = originals.map((original, index) => {
      const line = document.createElement("span");
      line.className = "film__type-line";
      line.dataset.active = String(index === 0);
      typing.append(line);
      return line;
    });
    slateText.append(typing);
    const timing = [[640,1150],[1840,3040],[3530,4440]];
    const menuButton = document.querySelector("#menuButton");
    const navWasDisabled = menuButton.disabled;
    menuButton.disabled = true;
    const locked = [...document.querySelectorAll(".skip, main > section:not(.film), body > .footer")];
    const changed = locked.filter(node => !node.inert);
    for (const node of changed) node.inert = true;
    film.classList.add("is-writing");
    document.documentElement.classList.add("film-writing");
    let started = performance.now();
    let animation;
    function unlock() {
      cancelAnimationFrame(animation);
      film.classList.remove("is-writing");
      document.documentElement.classList.remove("film-writing");
      typing.remove();
      for (const node of changed) node.inert = false;
      menuButton.disabled = navWasDisabled;
      motion.removeEventListener("change", motionChanged);
      window.removeEventListener("hashchange", unlock);
      queue();
    }
    function motionChanged() { if (motion.matches) unlock(); }
    function paint(now) {
      const elapsed = now - started;
      if (elapsed >= 5160) { unlock(); return; }
      const currentLine = timing.findLastIndex(([from]) => elapsed >= from);
      lines.forEach((line, i) => {
        const [from, to] = timing[i];
        const ratio = between(elapsed, from, to);
        const displayed = originals[i].slice(0, Math.floor(originals[i].length * ratio));
        if (line.textContent !== displayed) {
          if (/\S/.test(displayed.slice(line.textContent.length))) memorialAudio.effect("key");
          line.textContent = displayed;
        }
        line.dataset.active = String(currentLine === i);
      });
      animation = requestAnimationFrame(paint);
    }
    window.addEventListener("hashchange", unlock, {once:true});
    motion.addEventListener("change", motionChanged);
    animation = requestAnimationFrame(paint);
  }
})();

(() => {
  const reel = document.querySelector(".october-reel");
  if (!reel) return;

  const stage = reel.querySelector(".october-stage");
  const track = reel.querySelector(".october-track");
  const slides = [...track.children];
  const controls = reel.querySelector(".october-controls");
  const steps = [...controls.querySelectorAll("[data-reel-step]")];
  const prev = controls.querySelector("[data-reel-prev]");
  const next = controls.querySelector("[data-reel-next]");
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  let active = 0;
  let range = 0;
  let travel = 0;
  let queued = false;

  const position = slide => slide.offsetLeft - slides[0].offsetLeft;
  const start = () => reel.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(stage).top);

  function mark(index) {
    active = index;
    steps.forEach((button, i) => {
      if (i === index) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  }

  function render() {
    queued = false;
    if (reel.classList.contains("is-directed")) {
      const progress = Math.max(0, Math.min(1, (window.scrollY - start()) / travel));
      track.scrollLeft = range * progress;
    }
    const nearest = slides.reduce((best, slide, index) =>
      Math.abs(position(slide) - track.scrollLeft) < Math.abs(position(slides[best]) - track.scrollLeft)
        ? index : best, 0);
    if (nearest !== active) mark(nearest);
  }

  function queueRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }

  function measure() {
    range = track.scrollWidth - track.clientWidth;
    const stageHeight = stage.offsetHeight;
    const top = parseFloat(getComputedStyle(reel).getPropertyValue("--reel-top"));
    const directed = motion.matches && range > 0 && stageHeight + top < innerHeight - 16;
    travel = Math.round(range * .62);
    reel.style.setProperty("--reel-stage-height", stageHeight + "px");
    reel.style.setProperty("--reel-travel", travel + "px");
    reel.classList.toggle("is-directed", directed);
    queueRender();
  }

  function go(index, immediate = false) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    const target = Math.min(position(slides[index]), range);
    const behavior = immediate || !motion.matches ? "instant" : "smooth";
    if (reel.classList.contains("is-directed")) {
      window.scrollTo({ top: start() + travel * target / range, behavior });
    } else {
      track.scrollTo({ left: target, behavior });
    }
  }

  steps.forEach((button, index) => button.addEventListener("click", () => go(index)));
  prev.addEventListener("click", () => go(active - 1));
  next.addEventListener("click", () => go(active + 1));
  let drag;
  let preventClick = false;
  track.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest("video, input")) return;
    if (event.pointerType !== "mouse" && !reel.classList.contains("is-directed")) return;
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY, left:track.scrollLeft, active:false};
    preventClick = false;
  });
  track.addEventListener("pointermove", event => {
    if (drag?.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = undefined; return; }
      if (Math.abs(dx) < 8) return;
      track.setPointerCapture(event.pointerId);
      track.classList.add("is-dragging");
      drag.active = preventClick = true;
    }
    const left = Math.min(range, Math.max(0, drag.left - dx));
    if (reel.classList.contains("is-directed")) {
      window.scrollTo({top:start() + travel * left / range, behavior:"instant"});
    }
    track.scrollLeft = left;
  });
  function settleDrag(event) {
    if (drag?.id !== event.pointerId) return;
    if (drag.active) {
      const left = track.scrollLeft;
      const dx = event.clientX - drag.x;
      const nearest = (positionValue) => slides.reduce((best, slide, index) =>
        Math.abs(position(slide) - positionValue) < Math.abs(position(slides[best]) - positionValue) ? index : best, 0);
      const from = nearest(drag.left);
      const to = nearest(left);
      go(from === to && Math.abs(dx) > 28 ? from - Math.sign(dx) : to);
    }
    drag = undefined;
    track.classList.remove("is-dragging");
  }
  track.addEventListener("pointerup", settleDrag);
  track.addEventListener("pointercancel", settleDrag);
  track.addEventListener("dragstart", event => { if (drag) event.preventDefault(); });
  track.addEventListener("click", event => {
    if (preventClick && event.detail) {
      event.preventDefault();
      event.stopImmediatePropagation();
      preventClick = false;
    }
  }, true);
  track.addEventListener("keydown", event => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    go(active + (event.key === "ArrowRight" ? 1 : -1));
  });
  track.addEventListener("focusin", event => {
    const slide = event.target.closest(".timeline-story");
    if (slide && slides[active] !== slide) go(slides.indexOf(slide), true);
  });
  track.addEventListener("scroll", queueRender, { passive: true });
  window.addEventListener("scroll", queueRender, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  motion.addEventListener("change", measure);
  controls.hidden = false;
  mark(0);
  new ResizeObserver(measure).observe(stage);
  measure();
})();

(() => {
  const finale = document.querySelector(".finale");
  const stage = finale.querySelector(".finale__stage");
  const prints = [...stage.querySelectorAll(".finale__print")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  for (const image of stage.querySelectorAll("[data-finale-shot]")) {
    const src = (window.ferasPreview?.shots ?? window.ferasHosted?.shots)?.[image.dataset.finaleShot];
    if (src) developPhoto(image, src);
  }

  let frame = 0;
  const clamp = n => Math.max(0, Math.min(1, n));
  function render() {
    frame = 0;
    if (reduced.matches) return;
    const bounds = finale.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) return;
    const travel = Math.max(1, finale.offsetHeight - stage.offsetHeight);
    const progress = clamp((stage.offsetHeight * .4 - bounds.top) / (travel + stage.offsetHeight * .4));
    stage.style.setProperty("--finale-progress", progress);
    for (const [index, print] of prints.entries()) {
      const arrive = clamp((progress - index * .085) / .45);
      const eased = arrive * arrive * (3 - 2 * arrive);
      print.style.setProperty("--print-arrival", eased);
    }
  }
  function queue() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  function configure() {
    finale.classList.toggle("finale--directed", !reduced.matches);
    queue();
  }
  window.addEventListener("scroll", queue, {passive:true});
  window.addEventListener("resize", queue, {passive:true});
  reduced.addEventListener("change", configure);
  stage.addEventListener("focusin", event => {
    if (!reduced.matches && event.target.closest(".finale__restart")) {
      const bounds = finale.getBoundingClientRect();
      const end = finale.offsetHeight - stage.offsetHeight;
      if (bounds.top + end > 16) window.scrollTo({top: scrollY + bounds.top + end, behavior:"instant"});
    }
  });
  configure();
})();

(() => {
  const scene = document.querySelector("#musica-do-baile");
  const art = scene.querySelector(".paredao");
  const button = scene.querySelector("[data-baile-play]");
  const label = button.querySelector("span");
  const source = window.ferasPreview?.baile || window.ferasHosted?.baile;
  const audio = source ? new Audio(source) : null;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let timer;
  let autoSeen = false;
  let waitingForSound = false;
  let playback = 0;
  if (audio) audio.preload = "none";

  function reset({resume = true} = {}) {
    ++playback;
    clearTimeout(timer);
    if (audio) audio.pause();
    waitingForSound = false;
    scene.classList.remove("baile--firing", "baile--playing");
    button.setAttribute("aria-pressed","false");
    label.textContent = "Soltar o paredão";
    if (resume) memorialAudio.feature(false);
  }
  function play() {
    scene.classList.remove("baile--firing");
    if (!audio) {
      label.textContent = "Repetir a cena";
      button.setAttribute("aria-pressed","false");
      memorialAudio.feature(false);
      return;
    }
    if (memorialAudio.muted) {
      waitingForSound = true;
      label.textContent = "Repetir a cena";
      button.setAttribute("aria-pressed","false");
      memorialAudio.feature(false);
      return;
    }
    const attempt = ++playback;
    audio.currentTime = 0;
    audio.play().then(() => {
      if (attempt !== playback) return;
      waitingForSound = false;
      scene.classList.add("baile--playing");
      button.setAttribute("aria-pressed","true");
      label.textContent = "Pausar música";
    }).catch(() => {
      if (attempt !== playback) return;
      waitingForSound = true;
      button.setAttribute("aria-pressed","false");
      label.textContent = "Tocar música";
      memorialAudio.feature(false);
    });
  }
  function fire() {
    autoSeen = true;
    memorialAudio.feature(true);
    reset({resume:false});
    scene.classList.add("baile--firing");
    button.setAttribute("aria-pressed","true");
    label.textContent = "Parar a cena";
    if (!reduced.matches) {
      [.16,.46,.65,1.04].forEach(delay => memorialAudio.effect("beat",delay));
    }
    timer = setTimeout(play, reduced.matches ? 0 : 1540);
  }
  button.addEventListener("click", () => {
    autoSeen = true;
    if (scene.classList.contains("baile--firing") || (audio && !audio.paused)) reset();
    else if (waitingForSound && !memorialAudio.muted) { memorialAudio.feature(true); play(); }
    else fire();
  });
  audio?.addEventListener("ended", () => reset());
  audio?.addEventListener("pause", () => {
    if (scene.classList.contains("baile--playing")) reset();
  });
  audio?.addEventListener("error", () => {
    if (scene.classList.contains("baile--playing")) reset();
  });
  document.addEventListener("memorial-sound-change", () => {
    if (audio) audio.muted = memorialAudio.muted;
  });
  new IntersectionObserver(entries => {
    if (!autoSeen && entries.some(entry => entry.isIntersecting)) fire();
  }, {threshold:.54}).observe(art);
  new IntersectionObserver(entries => {
    if (entries.some(entry => !entry.isIntersecting)) reset();
  }).observe(scene);
})();
