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
  const reelPrint = film.querySelector(".film__reel-print");

  let current = 0;
  let frame = 0;
  let lastTime = 0;
  let start = 0;
  let travel = 1;
  const between = (value, start, end) => Math.min(1, Math.max(0, (value - start) / (end - start)));
  const ease = value => value * value * (3 - 2 * value);
  const section = (value, start, end) => ease(between(value, start, end));

  // Fixed irregular edges let the exposed image read like the same piece of paper throughout.
  const edge = [0, 3, 4, 6, 2, 2, -3, -1, 1, 5, 7, 8, 4, 3, 5, 1, -4, -2, 1, 3, 2, 4, 0, -2, 1];
  const reveal = (value, direction) => {
    const amount = value * 124 - 12;
    const points = edge.map((offset, i) => {
      const along = i * 100 / (edge.length - 1);
      return direction === "up"
        ? along + "% " + (100 - amount + offset) + "%"
        : (100 - amount + offset) + "% " + along + "%";
    });
    return "polygon(" + points.join(",") + (direction === "up" ? ",100% 100%,0 100%)" : ",100% 100%,100% 0)");
  };
  const show = (layer, visible) => {
    if (layer.hidden !== !visible) layer.hidden = !visible;
    if (layer.inert !== !visible) layer.inert = !visible;
  };
  function compose(p) {
    const enter = section(p, .105, .272);
    const leaveOpening = section(p, .43, .62);
    const enterCollective = section(p, .70, .86);
    show(layers.slate, enter < 1);
    document.body.classList.toggle("film-in-slate", p < .075);
    show(opening, enter > 0 && leaveOpening < 1);
    show(reel, leaveOpening > 0 && enterCollective < 1);
    show(collective, enterCollective > 0);
    const push = section(p, .11, .50);
    if (!opening.hidden) {
      opening.style.clipPath = enter < 1 ? reveal(enter, "up") : "none";
      openingPhoto.style.transform = "translate3d(" + ((push - .5) * 5) + "%,0,0) scale(" + (1.12 + push * .23) + ")";
      const titles = section(p, .18, .29);
      openingTitle.style.opacity = titles;
      openingTitle.style.transform = "translate3d(0," + ((1 - titles) * 32 - push * 13) + "px,0)";
      openingMark.style.opacity = section(p, .23, .33);
      openingMark.style.translate = ((1 - section(p, .23, .33)) * 50) + "px";
      inks.forEach((ink, index) => {
        const spread = section(p, .135 + index * .04, .36);
        ink.style.scale = String(.44 + spread * .56);
        ink.style.rotate = (index ? -1 : 1) * (1 - spread) * 16 + "deg";
      });
      tiles.forEach((tile, index) => {
        const landing = section(p, .18 + index * .025, .34 + index * .018);
        tile.style.translate = (index ? 1 : -1) * (1 - landing) * 34 + "vw " + (1 - landing) * 11 + "vh";
      });
    }
    if (!reel.hidden) {
      reel.style.clipPath = leaveOpening < 1 ? reveal(leaveOpening, "right") : "none";
      strips.forEach((strip, index) => {
        const landing = section(p, .43 + index * .027, .61 + index * .028);
        const lift = section(p, .71, .86);
        strip.style.translate = ((1 - landing) * (26 - index * 6) - lift * 12) + "vw " +
          ((1 - landing) * (index === 1 ? -28 : 24) - lift * 8) + "vh";
      });
      reelPrint.style.opacity = section(p, .58, .66);
    }
    if (!collective.hidden) {
      collective.style.clipPath = enterCollective < 1 ? reveal(enterCollective, "up") : "none";
      const settle = section(p, .78, .96);
      grid.style.scale = String(1.15 - settle * .15);
      gridPieces.forEach((piece, index) => {
        const land = section(p, .74 + index * .025, .86 + index * .022);
        piece.style.translate = (index % 2 ? 1 : -1) * (1 - land) * 20 + "vw " +
          (index < 2 ? -1 : 1) * (1 - land) * 12 + "vh";
      });
    }
  }

  function draw(time) {
    frame = 0;
    if (motion.matches) return;
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
      for (const node of [opening, reel, collective, openingPhoto, openingTitle, openingMark, reelPrint, grid, ...tiles, ...inks, ...strips, ...gridPieces]) {
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
})();
