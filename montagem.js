"use strict";

(() => {
  const film = document.querySelector(".film");
  const layers = Object.fromEntries(
    [...film.querySelectorAll("[data-layer]")].map(layer => [layer.dataset.layer, layer])
  );
  const shot = window.ferasPreview?.shots ?? {};
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
    if (src) image.src = src;
    if (shot[key]) image.dataset.previewShot = "";
  }
  if (window.ferasPreview) document.body.classList.add("preview-media");

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
    const locked = [...document.querySelectorAll(".skip, #masthead, #navigation, main > section:not(.film), body > .footer")];
    const changed = locked.filter(node => !node.inert);
    for (const node of changed) node.inert = true;
    film.classList.add("is-writing");
    document.documentElement.classList.add("film-writing");
    const started = performance.now();
    let animation;
    function unlock() {
      cancelAnimationFrame(animation);
      film.classList.remove("is-writing");
      document.documentElement.classList.remove("film-writing");
      typing.remove();
      for (const node of changed) node.inert = false;
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
        if (line.textContent !== displayed) line.textContent = displayed;
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
  const desktop = matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
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
    const directed = desktop.matches && range > 0 && stageHeight + top < innerHeight - 16;
    travel = Math.round(range * .62);
    reel.style.setProperty("--reel-stage-height", stageHeight + "px");
    reel.style.setProperty("--reel-travel", travel + "px");
    reel.classList.toggle("is-directed", directed);
    queueRender();
  }

  function go(index, immediate = false) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    const target = Math.min(position(slides[index]), range);
    const behavior = immediate || !desktop.matches ? "instant" : "smooth";
    if (reel.classList.contains("is-directed")) {
      window.scrollTo({ top: start() + travel * target / range, behavior });
    } else {
      track.scrollTo({ left: target, behavior });
    }
  }

  steps.forEach((button, index) => button.addEventListener("click", () => go(index)));
  prev.addEventListener("click", () => go(active - 1));
  next.addEventListener("click", () => go(active + 1));
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
  desktop.addEventListener("change", measure);
  controls.hidden = false;
  mark(0);
  new ResizeObserver(measure).observe(stage);
  measure();
})();
