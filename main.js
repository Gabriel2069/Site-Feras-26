/* FERAS 26 — Direção audiovisual 03; sem dependências externas */
"use strict";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const nav = $("#masthead");
const navigation = $("#navigation");
const menuButton = $("#menuButton");
const progress = $("#progress");
const corridor = $("#corridor");
const corridorBackdrop = $("#corridorBackdrop");
const archiveFilters = $("#archiveFilters");
const mosaic = $("#mosaicWall");
const archiveNote = $("#archiveNote");
const modal = $("#chapterDialog");
let currentEvents = [];
let currentScenes = {locais: [], recortes: []};
let cinemaMode = false;
let rafPending = false;
let previousFocus = null;

const returnTimeout = 5 * 60 * 1000;
const returnKey = "feras26:away:" + location.pathname;
const navigationType = performance.getEntriesByType("navigation")[0]?.type;
let awaySince = null;
if (navigationType === "reload" || navigationType === "back_forward") {
  try { awaySince = Number(sessionStorage.getItem(returnKey)) || null; } catch {}
}

function rememberDeparture() {
  awaySince ??= Date.now();
  try { sessionStorage.setItem(returnKey, String(awaySince)); } catch {}
}

function returnToPage() {
  if (document.hidden) return;
  const wasAway = awaySince !== null && Date.now() - awaySince >= returnTimeout;
  awaySince = null;
  try { sessionStorage.removeItem(returnKey); } catch {}
  if (!wasAway) return;

  closeChapter();
  if (miniDialog.open) miniDialog.close();
  setMenu(false, false);
  if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
  requestAnimationFrame(() => scrollTo({top:0, left:0, behavior:"instant"}));
}

addEventListener("pagehide", rememberDeparture);
addEventListener("pageshow", returnToPage);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) rememberDeparture();
  else returnToPage();
});

function filePath(src) {
  if (typeof src !== "string") return null;
  if (Object.hasOwn(window.ferasPreview?.images ?? {}, src)) return window.ferasPreview.images[src];
  if (!/^\.\/media\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|avif|mp4|webm)$/i.test(src)) return null;
  return window.ferasHosted?.base ? window.ferasHosted.base + src.slice(2) : src;
}
function isVideo(src) { return /\.(mp4|webm)$/i.test(src); }
function fullPhotoPath(src, highResolution) {
  if (highResolution !== true || !window.ferasHosted?.base || !filePath(src) || isVideo(src)) return null;
  return new URL("detail/" + src.slice(8), window.ferasHosted.base).href;
}
function text(tag, value, cls) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  el.textContent = value == null ? "" : String(value);
  return el;
}
function updateMotion() {
  rafPending = false;
  const maximum = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  progress.style.transform = "scaleX(" + clamp(scrollY / maximum, 0, 1) + ")";
  nav.classList.toggle("is-scrolled", scrollY > 46);
  if (reduced.matches) return;
  if (corridor) {
    const r = corridor.getBoundingClientRect();
    if (r.top <= innerHeight && r.bottom >= 0) {
      const v = clamp((innerHeight-r.top)/(innerHeight+r.height),0,1);
      corridorBackdrop.style.transform = "scale(" + (1.14+v*.16) + ") translate3d(" + ((v-.5)*8) + "%,0,0)";
    }
  }
}
function requestMotion() {
  if (!rafPending) { rafPending = true; requestAnimationFrame(updateMotion); }
}
addEventListener("scroll", requestMotion, {passive:true});
addEventListener("resize", requestMotion, {passive:true});
requestMotion();

const observer = ("IntersectionObserver" in window && !reduced.matches)
  ? new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
      if (!isIntersecting) return;
      target.classList.add("is-visible");
      observer.unobserve(target);
    }), {threshold:.11,rootMargin:"0px 0px -35px 0px"})
  : null;
function observe(root = document) {
  $$("[data-reveal]",root).forEach(el => observer ? observer.observe(el) : el.classList.add("is-visible"));
}
observe();

const photoReveal = new IntersectionObserver(entries => {
  let visible = 0;
  for (const {target, isIntersecting} of entries) {
    if (!isIntersecting) continue;
    photoReveal.unobserve(target);
    const delay = Math.min(visible++, 5) * 44;
    target.style.setProperty("--reveal-delay", `${delay}ms`);
    target.classList.add("photo-reveal--visible");
  }
}, {threshold:.14});
function revealPhotos(pictures) {
  if (reduced.matches) return;
  for (const [index, picture] of pictures.entries()) {
    picture.style.setProperty("--photo-side", index % 2 ? "1" : "-1");
    picture.classList.add("photo-reveal");
    photoReveal.observe(picture);
  }
}

function setMenu(open, shouldFocus = true) {
  navigation.classList.toggle("is-open",open);
  navigation.inert = !open;
  menuButton.setAttribute("aria-expanded",String(open));
  document.body.classList.toggle("nav-open",open);
  if (shouldFocus) (open ? $("a",navigation) : menuButton)?.focus({preventScroll:true});
}
menuButton.addEventListener("click",()=>setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
$$("a",navigation).forEach(link=>link.addEventListener("click",()=>setMenu(false,false)));
document.addEventListener("keydown",event=>{
  if (event.key==="Escape" && navigation.classList.contains("is-open")) setMenu(false);
});
document.addEventListener("click",event=>{
  if(navigation.classList.contains("is-open")&&!navigation.contains(event.target)&&!menuButton.contains(event.target))setMenu(false,false);
});

const cinemaButton=$("#cinemaButton");
const cinemaLabel=$("#cinemaLabel");
function updateCinema(active) {
  cinemaMode = active;
  document.body.classList.toggle("cinema-on",active);
  cinemaButton.setAttribute("aria-pressed",String(active));
  cinemaLabel.textContent=active?"SAIR DO CINEMA":"MODO CINEMA";
}
cinemaButton.addEventListener("click",async()=>{
  if (cinemaMode) {
    updateCinema(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      try { await document.exitFullscreen(); } catch {}
    }
    return;
  }
  updateCinema(true);
  if (document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
      if (!cinemaMode && document.fullscreenElement) await document.exitFullscreen();
    } catch {}
  }
});
document.addEventListener("fullscreenchange",()=>{
  if(!document.fullscreenElement && cinemaMode)updateCinema(false);
});

const defaultLocations=[
  {id:"portao",nome:"A GUARITA",descricao:"A catraca travou? Era esperar o tio ou tentar passar por baixo e levar esporro. Quem passou por ali sabe.",imagem:null},
  {id:"patio",nome:"O PÁTIO",numero:"02",descricao:"Antes de subir pra sala, a gente acabava se encontrando por aqui.",imagem:null},
  {id:"salas",nome:"AS SALAS",numero:"03",descricao:"Cada uma com seu jeito, suas conversas e seus professores.",imagem:null},
  {id:"auditorio",nome:"O AUDITÓRIO",numero:"04",descricao:"Tem aulão e outros encontros que merecem entrar no arquivo.",imagem:null}
];
const locationPhotos = $("#locationPhotos");
const locationPhotoCount = $("#locationPhotoCount");
const locationPlayback = $("#locationPlayback");
const locationSurface = $("#locationImage");
const locationFull = $("#locationFull");
let placePhotos = [];
let placePhotoIndex = 0;
let placePhotoTimer;
let placePaused = false;
let placeVisible = false;

function schedulePlacePhoto() {
  clearTimeout(placePhotoTimer);
  if (placePhotos.length > 1 && placeVisible && !placePaused && !document.hidden && !reduced.matches) {
    placePhotoTimer = setTimeout(nextPlacePhoto, 5000);
  }
}

function showPlacePhoto() {
  const photo = placePhotos[placePhotoIndex];
  const src = filePath(photo?.imagem);
  const full = fullPhotoPath(photo?.imagem, photo?.hd);
  locationFull.hidden = !full;
  if (full) locationFull.href = full;
  else locationFull.removeAttribute("href");
  locationSurface.classList.toggle("has-image", Boolean(src));
  locationSurface.style.backgroundImage = src ? 'url("' + src + '")' : "";
  if (src && !reduced.matches) {
    locationSurface.getAnimations().forEach(animation => animation.cancel());
    locationSurface.animate([{opacity:.3, transform:"scale(1.045)"}, {opacity:1, transform:"scale(1)"}],
      {duration:360, easing:"cubic-bezier(.2,.7,.3,1)"});
  }
  locationPhotoCount.textContent = placePhotos.length > 1 ? (placePhotoIndex + 1) + " / " + placePhotos.length : "";
}

function nextPlacePhoto() {
  if (placePhotos.length < 2) return;
  placePhotoIndex = (placePhotoIndex + 1) % placePhotos.length;
  showPlacePhoto();
  schedulePlacePhoto();
}

function switchLocation(id) {
  const loc = currentScenes.locais.find(item => item.id === id) || defaultLocations.find(item => item.id === id);
  if (!loc) return;
  $$("button[data-place]").forEach(button => {
    const active = button.dataset.place === id;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#locationName").textContent = loc.nome;
  $("#locationDescription").textContent = loc.descricao || "";
  const caption = $("#locationDescription").parentElement;
  if (!reduced.matches && corridor.dataset.place !== id) {
    caption.getAnimations().forEach(animation => animation.cancel());
    caption.animate([{opacity:.5, translate:"0 8px"}, {opacity:1, translate:"0 0"}],
      {duration:280, easing:"cubic-bezier(.2,.75,.25,1)"});
  }
  corridor.dataset.place = id;

  const photos = Array.isArray(loc.fotos) ? loc.fotos : [loc];
  placePhotos = photos.filter(photo => filePath(photo?.imagem) && !isVideo(photo.imagem));
  placePhotoIndex = 0;
  locationPhotos.hidden = placePhotos.length < 2;
  showPlacePhoto();
  schedulePlacePhoto();
}

$$("button[data-place]").forEach(button => button.addEventListener("click", () => switchLocation(button.dataset.place)));
$("#locationNext").addEventListener("click", nextPlacePhoto);
locationPlayback.addEventListener("click", () => {
  placePaused = !placePaused;
  locationPlayback.textContent = placePaused ? "Retomar" : "Pausar";
  schedulePlacePhoto();
});
locationPlayback.hidden = reduced.matches;
reduced.addEventListener("change", () => {
  locationPlayback.hidden = reduced.matches;
  schedulePlacePhoto();
});
document.addEventListener("visibilitychange", schedulePlacePhoto);
new IntersectionObserver(([entry]) => {
  placeVisible = entry.isIntersecting;
  schedulePlacePhoto();
}, {threshold: 0.2}).observe(corridor);

const archiveMore = $("#archiveMore");
let albumEntries = [];
let albumOffset = 0;

let relatedPhotos = new Map();

function shufflePhotos(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function mixedOrder(entries) {
  const pool = shufflePhotos(entries.map(entry => ({
    ...entry,
    scene: relatedPhotos.get(entry.media.src) ?? entry.media.src,
    series: entry.media.serie || entry.media.src
  })));
  const seenScenes = new Set();
  const recent = [];
  const ordered = [];
  while (pool.length) {
    let bestIndex = 0;
    let bestScore = Infinity;
    const penalties = new Map();
    for (const [distance, previous] of recent.entries()) {
      const weight = (12 - distance) / 12;
      for (const [key, cost] of [["scene:" + previous.scene, 30],
        ["series:" + previous.series, 5], ["event:" + previous.event.id, 2]]) {
        penalties.set(key, (penalties.get(key) ?? 0) + weight * cost);
      }
    }
    for (let i = 0; i < pool.length; i++) {
      const entry = pool[i];
      const score = (seenScenes.has(entry.scene) ? 8 : 0) +
        (penalties.get("scene:" + entry.scene) ?? 0) +
        (penalties.get("series:" + entry.series) ?? 0) +
        (penalties.get("event:" + entry.event.id) ?? 0);
      if (score < bestScore) {
        bestIndex = i;
        bestScore = score;
        if (score === 0) break;
      }
    }
    const [entry] = pool.splice(bestIndex, 1);
    ordered.push(entry);
    seenScenes.add(entry.scene);
    recent.unshift(entry);
    if (recent.length > 12) recent.pop();
  }
  return ordered;
}

function selectAlbum(filter) {
  const selected = currentEvents.filter(event => event.id !== "funcionarios" && (filter === "todos" || event.id === filter));
  const matches = selected.flatMap(event =>
    (event.midias || []).filter(media => filePath(media.src) && !(filter === "todos" && media.soNoAlbum)).map(media => ({ media, event }))
  );
  const albumPriority = ["outros", "convivencia", "retratos-sala"];
  const byPhoto = new Map();
  for (const entry of matches) {
    const current = byPhoto.get(entry.media.src);
    const rank = albumPriority.indexOf(entry.event.id);
    const currentRank = current ? albumPriority.indexOf(current.event.id) : -1;
    if (!current || (currentRank >= 0 && (rank < 0 || rank > currentRank))) {
      byPhoto.set(entry.media.src, entry);
    }
  }
  const available = [...byPhoto.values()];
  if (!available.length) return;
  for (const button of archiveFilters.querySelectorAll("button")) {
    const active = button.dataset.filter === filter;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
    if (active) {
      const bounds = button.getBoundingClientRect();
      const strip = archiveFilters.getBoundingClientRect();
      if (bounds.left < strip.left || bounds.right > strip.right) {
        archiveFilters.scrollLeft += bounds.left - strip.left - (strip.width - bounds.width) / 2;
      }
    }
  }
  [...mosaic.children].forEach(photo => photoReveal.unobserve(photo));
  mosaic.replaceChildren();
  mosaic.dataset.view = filter === "todos" ? "all" : "album";
  const albumName = filter === "todos" ? "Todos os álbuns" : selected[0].titulo;
  archiveNote.textContent = albumName + " · " + available.length + (available.length === 1 ? " registro" : " registros");
  albumEntries = mixedOrder(available);
  albumOffset = 0;
  appendArchivePage();
  if (!reduced.matches) {
    mosaic.getAnimations().forEach(animation => animation.cancel());
    mosaic.animate([{ opacity: .45, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }], {
      duration: 240, easing: "ease-out"
    });
  }
}

function appendArchivePage(moveFocus = false) {
  const start = albumOffset;
  const end = Math.min(start + 42, albumEntries.length);
  const fragment = document.createDocumentFragment();
  for (const { media, event } of albumEntries.slice(start, end)) {
    const button = text("button", "", "mosaic__photo");
    button.type = "button";
    const src = filePath(media.src);
    if (isVideo(media.src)) {
      button.classList.add("mosaic__photo--video");
      button.append(text("strong", "▶", "mosaic__play"));
      button.setAttribute("aria-label", "Ver vídeo: " + (media.alt || event.titulo));
    } else {
      const image = document.createElement("img");
      image.alt = media.alt || event.titulo;
      image.loading = "lazy";
      image.decoding = "async";
      developPhoto(image, src);
      button.append(image);
    }
    button.addEventListener("click", () => openChapter(event, media, button));
    fragment.append(button);
  }
  const newPictures = [...fragment.children];
  mosaic.append(fragment);
  revealPhotos(newPictures);
  albumOffset = end;
  archiveMore.hidden = albumOffset === albumEntries.length;
  if (moveFocus) mosaic.children[start]?.focus();
}
archiveMore.addEventListener("click", () => appendArchivePage(true));

function setupFilters(events) {
  const available = events.filter(event => event.id !== "funcionarios" && (event.midias || []).some(media => filePath(media.src)));
  archiveFilters.replaceChildren();
  if (!available.length) {
    archiveNote.textContent = "O álbum online ainda não tem fotos publicadas.";
    return;
  }
  const options = [{ id: "todos", titulo: "Todos" }, ...available];
  for (const { id, titulo } of options) {
    const button = text("button", titulo);
    button.type = "button";
    button.dataset.filter = id;
    button.addEventListener("click", () => selectAlbum(id));
    archiveFilters.append(button);
  }
  selectAlbum("todos");
}

const mediaView = $("#chapterMedia");
const mediaStrip = $("#chapterStrip");
const mediaControls = $("#chapterControls");
const mediaPosition = $("#photoPosition");
let viewer = { item: null, entries: [], index: 0 };

function turnAlbumPage(previous, next, direction) {
  previous.classList.add("chapter-modal__turning");
  previous.inert = true;
  previous.setAttribute("aria-hidden","true");
  mediaView.append(previous);
  previous.style.transformOrigin = next.style.transformOrigin = direction > 0 ? "left center" : "right center";
  const outgoing = previous.animate([
    { transform:"rotateY(0deg)", filter:"brightness(1)", opacity:1 },
    { transform:`rotateY(${direction * -47}deg) skewY(${direction * -2}deg)`, filter:"brightness(.77)", opacity:1, offset:.52 },
    { transform:`rotateY(${direction * -94}deg)`, filter:"brightness(.55)", opacity:0 }
  ], {duration:520,easing:"cubic-bezier(.38,.02,.65,1)",fill:"forwards"});
  outgoing.onfinish = () => previous.remove();
  next.animate([
    { opacity:.62, transform:`translateX(${direction * 12}px) scale(.97)`, filter:"brightness(.69)" },
    { opacity:1, transform:"translateX(0) scale(1)", filter:"brightness(1)" }
  ], {duration:520,easing:"cubic-bezier(.22,.74,.24,1)"});
}

const reactionPanel = $("#photoReaction");
const reactionToggle = $("#reactionToggle");
const reactionChoices = $("#reactionChoices");
const reactionStatus = $("#reactionStatus");
const reactionOptions = new Map([["❤️","Amei"],["😂","Dei risada"],["🥹","Deu saudade"],["🔥","Muito Fera"],["👏","Aplausos"],["💙","Carinho"]]);
const reactionPrefix = "feras26:reaction:";
const reactionUrl = () => remote && new URL("/rest/v1/feras_photo_reactions", remote);
const reactionHeaders = () => ({apikey:config.key});
const activePhoto = () => viewer.entries[viewer.index]?.media.src;
const pendingReactions = new Set();
let reactionRead = 0;

function closeReactions() {
  if (reactionChoices.contains(document.activeElement)) reactionToggle.focus({preventScroll:true});
  reactionToggle.setAttribute("aria-expanded","false");
  reactionChoices.hidden = true;
}

function displayReaction(emoji) {
  reactionToggle.textContent = reactionOptions.has(emoji) ? emoji + " Reação" : "♡ Reagir";
  reactionToggle.setAttribute("aria-label", reactionOptions.has(emoji) ? "Trocar reação: " + reactionOptions.get(emoji) : "Reagir à foto");
  for (const button of reactionChoices.children) button.setAttribute("aria-pressed", String(button.textContent === emoji));
}

function localReaction(key, emoji) {
  try {
    if (emoji !== undefined) localStorage.setItem(reactionPrefix + key, emoji);
    return localStorage.getItem(reactionPrefix + key);
  } catch { return null; }
}

async function loadReaction(key) {
  const read = ++reactionRead;
  displayReaction(localReaction(key));
  const url = reactionUrl();
  if (!url || pendingReactions.has(key)) return;
  url.search = new URLSearchParams({photo_path:"eq." + key, select:"emoji"});
  try {
    const response = await fetch(url,{headers:reactionHeaders(),cache:"no-store"});
    if (!response.ok) throw Error();
    const [row] = await response.json();
    if (read === reactionRead && activePhoto() === key) {
      localReaction(key, row?.emoji || "");
      displayReaction(row?.emoji);
    }
  } catch {
    if (read === reactionRead) reactionStatus.textContent = "Reação compartilhada indisponível.";
  }
}

for (const [emoji, description] of reactionOptions) {
  const button = text("button",emoji);
  button.type = "button";
  button.title = description;
  button.setAttribute("aria-label",description);
  reactionChoices.append(button);
  button.addEventListener("click", async () => {
    const key = activePhoto();
    if (!key || pendingReactions.has(key)) return;
    const url = reactionUrl();
    ++reactionRead;
    closeReactions();
    if (url) {
      pendingReactions.add(key);
      try {
        const response = await fetch(url, {method:"POST",
          headers:{...reactionHeaders(),"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},
          body:JSON.stringify({photo_path:key,emoji})});
        if (!response.ok) throw Error();
      } catch {
        reactionStatus.textContent = "A reação ficou como estava. Tente novamente.";
        return;
      } finally { pendingReactions.delete(key); }
    }
    localReaction(key,emoji);
    if (activePhoto() === key) {
      displayReaction(emoji);
      reactionStatus.textContent = description + (url ? " · Reação compartilhada salva." : " · Reação salva neste navegador.");
    }
  });
}
reactionToggle.addEventListener("click", () => {
  if (!reactionChoices.hidden) { closeReactions(); return; }
  reactionChoices.hidden = false;
  reactionToggle.setAttribute("aria-expanded","true");
  (reactionChoices.querySelector('[aria-pressed="true"]') || reactionChoices.firstElementChild).focus();
});
addEventListener("storage", event => {
  if (modal.open && event.key === reactionPrefix + activePhoto() && !reactionPanel.classList.contains("photo-reaction--video")) displayReaction(event.newValue);
});

function showMedia(index, keepThumbVisible = true) {
  const { entries, item } = viewer;
  if (index < 0 || index >= entries.length) return;
  mediaView.querySelector(".chapter-modal__turning")?.remove();
  const previous = mediaView.querySelector("figure");
  const direction = Math.sign(index - viewer.index);
  viewer.index = index;
  const { media, src } = entries[index];
  const video = isVideo(media.src);
  const element = document.createElement(video ? "video" : "img");
  if (video) {
    element.controls = true;
    element.preload = "metadata";
    element.playsInline = true;
    element.setAttribute("aria-label", media.alt || item.titulo);
  } else {
    element.alt = media.alt || item.titulo;
    element.decoding = "async";
  }
  const detail = !video && /^\.\/media\/[a-zA-Z0-9/_-]+\.webp$/i.test(media.src)
    ? window.ferasPreview?.detail?.[media.src] || (window.ferasPreview?.hasLocalDetails
      ? media.src.replace("./media/", "./fotos/") : null) : null;
  const hasHostedDetail = media.hd === true || window.ferasHosted?.details?.includes(media.src.slice(8));
  const hostedDetail = !video && window.ferasHosted?.base && hasHostedDetail
    ? new URL("detail/" + media.src.slice(8), window.ferasHosted.base).href : null;
  if (detail || hostedDetail) {
    element.addEventListener("error", () => { element.src = src; }, {once:true});
  }
  if (video) element.src = src;
  else developPhoto(element, detail || hostedDetail || src);
  $("video", mediaView)?.pause();
  const figure = document.createElement("figure");
  figure.append(element);
  mediaView.classList.toggle("chapter-modal__media--video", video);
  mediaView.replaceChildren(figure);
  if (!reduced.matches && previous && direction) {
    turnAlbumPage(previous, figure, direction);
    memorialAudio.effect("page");
  }
  reactionPanel.hidden = false;
  reactionPanel.classList.toggle("photo-reaction--video",video);
  reactionStatus.textContent = "";
  closeReactions();
  if (!video) loadReaction(media.src);
  else ++reactionRead;
  mediaPosition.textContent = (index + 1) + " / " + entries.length;
  $("#photoPrev").setAttribute("aria-disabled", String(index === 0));
  $("#photoNext").setAttribute("aria-disabled", String(index === entries.length - 1));
  [...mediaStrip.children].forEach((button, position) => {
    button.setAttribute("aria-current", position === index ? "true" : "false");
  });
  if (keepThumbVisible) {
    const active = mediaStrip.children[index];
    const stripBounds = mediaStrip.getBoundingClientRect();
    const activeBounds = active.getBoundingClientRect();
    if (activeBounds.left < stripBounds.left || activeBounds.right > stripBounds.right) {
      mediaStrip.scrollLeft += activeBounds.left - stripBounds.left - (stripBounds.width - activeBounds.width) / 2;
    }
  }
}

function openChapter(item, selectedMedia, trigger) {
  previousFocus = trigger;
  modal.dataset.album = item.id;
  const chapterMedia = item.midias || [];
  const throughMosaic = trigger.classList.contains("mosaic__photo");
  const filteredMedia = throughMosaic ? albumEntries.filter(entry => entry.event === item).map(entry => entry.media) : [];
  const orderedMedia = [...new Set([...filteredMedia, ...chapterMedia])];
  const entries = orderedMedia.map(media => ({media, src:filePath(media.src)})).filter(entry => entry.src);
  viewer = { item, entries, index: 0 };
  $("#chapterCode").textContent = item.categoria || "Acervo";
  $("#chapterCategory").textContent = item.subtitulo || "";
  $("#chapterTitle").textContent = item.titulo;
  $("#chapterText").textContent = item.texto || item.resumo || "";
  mediaView.replaceChildren();
  reactionPanel.hidden = true;
  mediaStrip.replaceChildren();
  mediaControls.hidden = entries.length < 2;
  mediaStrip.hidden = entries.length < 2;
  $("#chapterEmpty").hidden = entries.length > 0;
  if (entries.length > 1) {
    entries.forEach(({ media, src }, index) => {
      const button = text("button", "", "chapter-modal__thumb");
      button.type = "button";
      button.setAttribute("aria-label", media.alt || "Registro " + (index + 1));
      if (isVideo(media.src)) {
        button.textContent = "▶";
      } else {
        const image = document.createElement("img");
        image.src = src;
        image.alt = "";
        image.loading = "lazy";
        button.append(image);
      }
      button.addEventListener("click", () => showMedia(index));
      mediaStrip.append(button);
    });
  }
  modal.showModal();
  $("#chapterClose").focus({preventScroll:true});
  modal.scrollTop = 0;
  if (entries.length) showMedia(Math.max(0, entries.findIndex(entry => entry.media === selectedMedia)), entries.length > 1);
}

watchHorizontalSwipe(mediaView, step => showMedia(viewer.index + step));
$("#photoPrev").addEventListener("click", () => showMedia(viewer.index - 1));
$("#photoNext").addEventListener("click", () => showMedia(viewer.index + 1));
modal.addEventListener("keydown", event => {
  if (event.key === "Escape" && !reactionChoices.hidden) { event.preventDefault(); closeReactions(); return; }
  if (event.target.closest("video, #reactionChoices") || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  showMedia(viewer.index + (event.key === "ArrowRight" ? 1 : -1));
});

function closeChapter(){if(modal.open)modal.close();}
$("#chapterClose").addEventListener("click",closeChapter);
modal.addEventListener("click",event=>{
  if (event.target !== modal) return;
  const r=modal.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeChapter();
});
modal.addEventListener("close",()=>{
  closeReactions();
  $$("video",modal).forEach(v=>v.pause());
  if(previousFocus&&document.contains(previousFocus))previousFocus.focus({preventScroll:true});
});

async function fetchJson(path){
  if (Object.hasOwn(window.ferasPreview?.content ?? {}, path)) return window.ferasPreview.content[path];
  const url = window.ferasHosted?.base ? new URL(path, window.ferasHosted.base) : path;
  if (url instanceof URL && ["./content/acervo.json", "./content/cenas.json"].includes(path)) {
    url.searchParams.set("v", "revisao-do-acervo");
  }
  const r=await fetch(url);
  if(!r.ok)throw Error("Não foi possível abrir "+path+": HTTP "+r.status);
  return await r.json();
}
function showTimelinePhoto(image, source) {
  developPhoto(image, source);
  const frame = image.closest("figure");
  frame.hidden = false;
  if (!frame.closest(".october-track")) revealPhotos([frame]);
}

function loadStaffMural(event) {
  const mural = $("#staffMural");
  const portraits = document.createDocumentFragment();
  for (const [index, media] of (event?.midias ?? []).entries()) {
    const source = filePath(media.src);
    if (!source || isVideo(media.src)) continue;
    const card = text("li", "", "staff-mural__card");
    if (media.largura > media.altura) card.classList.add("staff-mural__card--wide");
    const link = document.createElement("a");
    link.href = fullPhotoPath(media.src, media.hd) ?? source;
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", "Abrir retrato " + (index + 1) + " do mural em nova aba");
    const image = document.createElement("img");
    image.alt = media.alt || "Retrato da equipe";
    image.loading = "lazy";
    image.decoding = "async";
    image.src = source;
    link.append(image);
    card.append(link);
    portraits.append(card);
  }
  mural.replaceChildren(portraits);
  mural.hidden = mural.childElementCount === 0;
}

async function loadContent(){
  const [eventsResult, scenesResult, relatedResult] = await Promise.allSettled([
    fetchJson("./content/acervo.json"), fetchJson("./content/cenas.json"),
    fetch("./content/fotos-semelhantes.json").then(response => response.ok ? response.json() : [])
  ]);
  if (relatedResult.status === "fulfilled" && Array.isArray(relatedResult.value)) {
    relatedPhotos = new Map(relatedResult.value.flatMap((group, index) => group.map(src => [src, index])));
  }
  if(eventsResult.status==="fulfilled"){
    const data=eventsResult.value;
    currentEvents=Array.isArray(data.eventos)?data.eventos:[];
    for (const image of $$("[data-timeline-album]")) {
      const event = currentEvents.find(item => item.id === image.dataset.timelineAlbum);
      const photo = event?.midias?.find(media => media.src === image.dataset.timelineSrc);
      const source = filePath(photo?.src);
      if (!source || isVideo(photo.src)) continue;
      photo.alt = image.alt;
      const caption = image.closest("figure").querySelector("figcaption");
      if (caption) photo.legenda = caption.textContent;
      showTimelinePhoto(image, source);
    }
    for (const button of $$("[data-open-event]")) {
      const event = currentEvents.find(item => item.id === button.dataset.openEvent);
      if (!event?.midias?.some(media => filePath(media.src))) continue;
      button.hidden = false;
      button.addEventListener("click", click => {
        if (click.altKey || click.ctrlKey || click.metaKey || click.shiftKey) return;
        click.preventDefault();
        openChapter(event, null, button);
      });
    }
    for (const grid of $$("[data-event-frames]")) {
      const event = currentEvents.find(item => item.id === grid.dataset.eventFrames);
      for (const media of (event?.midias ?? []).filter(media => media.destaque && !isVideo(media.src))) {
        const source = filePath(media.src);
        if (!source) continue;
        const figure = document.createElement("figure");
        const image = document.createElement("img");
        image.alt = media.alt || event.titulo;
        image.loading = "lazy";
        developPhoto(image, source);
        figure.append(image);
        if (event.id !== "funcionarios" && media.legenda) figure.append(text("figcaption", media.legenda));
        grid.append(figure);
        revealPhotos([figure]);
      }
    }
    loadStaffMural(currentEvents.find(event => event.id === "funcionarios"));
    setupFilters(currentEvents);
  }else{
    archiveNote.textContent = "O álbum está indisponível agora.";
    console.error(eventsResult.reason);
  }
  if(scenesResult.status==="fulfilled"){
    const data=scenesResult.value;
    for (const image of document.querySelectorAll(".film [data-shot]")) {
      const source = filePath(data.planos?.[image.dataset.shot]);
      if (source && !("previewShot" in image.dataset)) developPhoto(image, source);
      if (!image.hasAttribute("src") && image.dataset.shot === "turma-abertura") {
        const fallback = filePath(data.planos?.patio);
        if (fallback) developPhoto(image, fallback);
      }
    }
    for (const image of $$("[data-finale-shot]")) {
      const source = filePath(data.planos?.[image.dataset.finaleShot]);
      if (source && !image.hasAttribute("src")) developPhoto(image, source);
    }
    for (const image of $$("[data-timeline-plan]")) {
      const source = filePath(data.planos?.[image.dataset.timelinePlan]);
      if (source && !isVideo(source)) showTimelinePhoto(image, source);
    }
    currentScenes={locais:Array.isArray(data.locais)?data.locais:[],recortes:Array.isArray(data.recortes)?data.recortes:[]};
  }else{console.warn("Cenas complementares indisponíveis:",scenesResult.reason);}
  switchLocation("patio");
}
const miniDialog = $("#miniDialog");
const miniFrame = $("#miniFrame");
let miniTrigger;
for (const trigger of $$("[data-mini-open]")) {
  trigger.addEventListener("click", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    miniTrigger = trigger.closest("#navigation") ? menuButton : trigger;
    if (!miniFrame.hasAttribute("src") && !miniFrame.hasAttribute("srcdoc")) {
      if (window.ferasPreview?.miniHtml) miniFrame.srcdoc = window.ferasPreview.miniHtml;
      else miniFrame.src = "./mini-feras.html";
    }
    miniDialog.showModal();
    miniFrame.focus();
  });
}
$(".mini-dialog__close").addEventListener("click", () => miniDialog.close());
miniDialog.addEventListener("close", () => miniTrigger?.focus({ preventScroll: true }));
addEventListener("message", event => {
  if (miniDialog.open && event.source === miniFrame.contentWindow && event.data === "feras:close-mini") {
    miniDialog.close();
  }
});

const memoryForm = $("#relato");
const memoryKind = $("#memoryKind");
const memoryText = $("#memoryText");
const memoryStatus = $("#memoryStatus");

memoryForm.hidden = false;
memoryText.addEventListener("input", () => {
  memoryText.setCustomValidity("");
  memoryStatus.textContent = "";
});
for (const link of $$("[data-memory-kind]")) {
  link.addEventListener("click", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    memoryKind.value = link.dataset.memoryKind;
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    memoryForm.scrollIntoView({ behavior: "instant", block: "start" });
    memoryText.focus({ preventScroll: true });
  });
}
const memoryWall = $("#memoryWall");
const storageKey = "feras26:memory-wall:v1";
const config = window.ferasMemorias;
const remote = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config?.url || "")
  && /^sb_publishable_[a-zA-Z0-9_-]+$/.test(config?.key || "")
  ? new URL("/rest/v1/feras_memorias", config.url) : null;
const kinds = new Set([...memoryKind.options].map(option => option.value));
let memories = [];
let sharedMemories = [];
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(saved)) memories = saved.filter(row => row && typeof row.message === "string");
} catch {}

function renderMemories() {
  [...memoryWall.children].forEach(card => photoReveal.unobserve(card));
  memoryWall.replaceChildren();
  for (const row of [...sharedMemories, ...memories]) {
    const card = text("article", "", "memory-wall__card");
    card.append(text("h3", row.kind), text("p", row.message));
    if (row.author) card.append(text("footer", row.author));
    memoryWall.append(card);
  }
  memoryWall.hidden = !memoryWall.childElementCount;
  revealPhotos([...memoryWall.children]);
}
renderMemories();

if (remote) {
  $("#memoryPrivacy").textContent = "A lembrança passa por revisão antes de aparecer para a turma.";
  const feed = new URL(remote);
  feed.search = "select=kind,message,author&order=created_at.desc&limit=100";
  fetch(feed, {headers:{apikey:config.key}})
    .then(response => {
      if (!response.ok) throw Error("Mural indisponível");
      return response.json();
    })
    .then(rows => { sharedMemories = rows; renderMemories(); })
    .catch(() => { memoryStatus.textContent = "O mural compartilhado está indisponível agora."; });
}

memoryForm.addEventListener("submit", async event => {
  event.preventDefault();
  const message = memoryText.value.trim();
  if (!message) {
    memoryText.setCustomValidity("Escreve uma lembrança antes de guardar.");
    memoryText.reportValidity();
    return;
  }
  const row = {kind: memoryKind.value, message, author: $("#memoryName").value.trim()};
  if (!kinds.has(row.kind)) return;
  const submit = memoryForm.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    if (remote) {
      const response = await fetch(remote, {
        method:"POST",
        headers:{apikey:config.key,"Content-Type":"application/json",Prefer:"return=minimal"},
        body:JSON.stringify(row)
      });
      if (!response.ok) throw Error("Falha ao enviar");
      memoryStatus.textContent = "Lembrança enviada para revisão.";
    } else {
      const next = [row, ...memories];
      localStorage.setItem(storageKey, JSON.stringify(next));
      memories = next;
      renderMemories();
      memoryStatus.textContent = "Lembrança guardada neste navegador.";
    }
    memoryForm.reset();
  } catch {
    memoryStatus.textContent = "Não consegui guardar agora. Seu texto continua aqui.";
  } finally {
    submit.disabled = false;
  }
});

loadContent();
