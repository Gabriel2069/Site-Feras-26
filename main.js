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
const eventTrack = $("#eventTrack");
const yearSection = $(".year");
const yearPin = $("#yearPin");
const yearHead = $(".year__head");
const yearFoot = $(".year__foot");
let yearPinned = false;
let pinStart = 0;
let railRange = 0;
function measureYear() {
  const previous = yearPinned;
  railRange = Math.max(0, eventTrack.scrollWidth - eventTrack.clientWidth);
  yearPinned = innerWidth > 900 && !reduced.matches && railRange > 30;
  if (!yearPinned) {
    yearSection.style.minHeight = "";
    if (previous) eventTrack.scrollLeft = 0;
    return;
  }
  const padding = parseFloat(getComputedStyle(yearSection).paddingTop) || 0;
  const base = padding + yearHead.offsetHeight + innerHeight + yearFoot.offsetHeight + 180;
  yearSection.style.minHeight = Math.ceil(base + railRange) + "px";
  pinStart = yearPin.offsetTop;
  requestMotion();
}
function advanceYear(direction) {
  if (yearPinned) {
    const p = clamp(scrollY - pinStart + direction * eventTrack.clientWidth * .76, 0, railRange);
    window.scrollTo({top: pinStart + p, behavior: reduced.matches ? "auto" : "smooth"});
  } else {
    eventTrack.scrollBy({left:direction * eventTrack.clientWidth * .76,behavior:reduced.matches?"auto":"smooth"});
  }
}

const archiveFilters = $("#archiveFilters");
const mosaic = $("#mosaicWall");
const archiveNote = $("#archiveNote");
const modal = $("#chapterDialog");
let currentEvents = [];
let currentScenes = {locais: [], recortes: []};
let cinemaMode = false;
let rafPending = false;
let previousFocus = null;

function filePath(src) {
  if (typeof src !== "string") return null;
  // Publicação de mídia é deliberada e local. IDs e tokens privados do Drive não entram aqui.
  if (Object.hasOwn(window.ferasPreview?.images ?? {}, src)) return window.ferasPreview.images[src];
  return /^\.\/media\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|avif|mp4|webm)$/i.test(src) ? src : null;
}
function isVideo(src) { return /\.(mp4|webm)$/i.test(src); }
function text(tag, value, cls) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  el.textContent = value == null ? "" : String(value);
  return el;
}
function safeAsset(index) {
  return ["assets/camera-sticker.png", "assets/clapper-sticker.png", "assets/burst-sticker.png"][index % 3];
}

function updateMotion() {
  rafPending = false;
  const maximum = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  progress.style.transform = "scaleX(" + clamp(scrollY / maximum, 0, 1) + ")";
  nav.classList.toggle("is-scrolled", scrollY > 46);
  if (yearPinned) eventTrack.scrollLeft = clamp(scrollY - pinStart, 0, railRange);
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
addEventListener("resize",()=>requestAnimationFrame(measureYear),{passive:true});
reduced.addEventListener("change", measureYear);
if(document.fonts?.ready) document.fonts.ready.then(()=>requestAnimationFrame(measureYear));
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
    if(document.fullscreenElement && document.exitFullscreen)try{await document.exitFullscreen();}catch{}
    updateCinema(false);
  } else {
    updateCinema(true);
    if(document.documentElement.requestFullscreen)try{await document.documentElement.requestFullscreen();}catch{}
  }
});
document.addEventListener("fullscreenchange",()=>{
  if(!document.fullscreenElement && cinemaMode)updateCinema(false);
});

const defaultLocations=[
  {id:"portao",nome:"A GUARITA",descricao:"As catracas de vez em quando travavam.",imagem:null},
  {id:"patio",nome:"O PÁTIO",numero:"02",descricao:"Era onde a gente se encontrava antes de ir pra sala.",imagem:null},
  {id:"salas",nome:"AS SALAS",numero:"03",descricao:"Cada uma com seu jeito, suas conversas e seus professores.",imagem:null},
  {id:"auditorio",nome:"O AUDITÓRIO",numero:"04",descricao:"Tem aulão e outros encontros que merecem entrar no arquivo.",imagem:null}
];
function switchLocation(id) {
  const loc=(currentScenes.locais||[]).find(x=>x.id===id) || defaultLocations.find(x=>x.id===id);
  if(!loc)return;
  $$("button[data-place]").forEach(b=>{
    const active=b.dataset.place===id;
    b.classList.toggle("is-active",active);
    b.setAttribute("aria-pressed",String(active));
  });
  $("#locationName").textContent=loc.nome;
  $("#locationDescription").textContent=loc.descricao || "";
  corridor.dataset.place=id;
  const surface=$("#locationImage");
  const src=filePath(loc.imagem);
  if(src && !isVideo(src)) {
    surface.style.backgroundImage="url('"+src+"')";
    surface.classList.add("has-image");
    if (!reduced.matches) {
      surface.getAnimations().forEach(animation => animation.cancel());
      surface.animate([{ opacity: .3, transform: "scale(1.045)" }, { opacity: 1, transform: "scale(1)" }], {
        duration: 360, easing: "cubic-bezier(.2,.7,.3,1)"
      });
    }
  } else {
    surface.style.backgroundImage="";
    surface.classList.remove("has-image");
  }
}
$$("button[data-place]").forEach(b=>b.addEventListener("click",()=>switchLocation(b.dataset.place)));

function makeEpisode(item,index) {
  const card=document.createElement("button");
  card.type="button";card.className="episode";
  card.dataset.album = item.id;
  card.setAttribute("aria-label","Abrir capítulo: "+item.titulo);
  const top=text("div","","episode__top");
  if (item.subtitulo) top.append(text("span",item.subtitulo));
  const numeral=text("div",String(index+1).padStart(2,"0"),"episode__number");
  numeral.setAttribute("aria-hidden","true");
  const polaroid=text("div","","episode__photo");
  polaroid.setAttribute("aria-hidden","true");
  const photo=text("div","","episode__picture");
  const first=(item.midias||[]).find(m=>filePath(m.src)&&!isVideo(m.src));
  if(first) {
    const img=document.createElement("img");
    img.src=filePath(first.src);img.alt="";img.loading="lazy";photo.append(img);
  } else {
    photo.append(text("span","FERAS 26 / ARQUIVO"));
  }
  polaroid.append(photo);
  const decal=document.createElement("img");
  decal.className="episode__decal";decal.src=safeAsset(index);decal.alt="";decal.loading="lazy";decal.setAttribute("aria-hidden","true");
  const bottom=text("div","","episode__bottom");
  bottom.append(text("h3",item.titulo));
  if (item.resumo) bottom.append(text("p",item.resumo));
  const footer=text("div","","episode__footer");
  footer.append(text("span","ABRIR CAPÍTULO ↗"));
  bottom.append(footer);
  card.append(top,numeral,polaroid,decal,bottom);
  card.addEventListener("click",()=>openChapter(item, null, card));
  return card;
}
function renderEpisodes(events){
  eventTrack.replaceChildren();
  if(!events.length){eventTrack.append(text("p","Os acontecimentos estão sendo organizados.","loading"));return;}
  events.forEach((x,i)=>eventTrack.append(makeEpisode(x,i)));
  requestAnimationFrame(measureYear);
}
$("#eventPrev").addEventListener("click",()=>advanceYear(-1));
$("#eventNext").addEventListener("click",()=>advanceYear(1));
eventTrack.addEventListener("keydown",event=>{
  if(event.target!==eventTrack)return;
  if(event.key==="ArrowRight"){event.preventDefault();advanceYear(1);}
  if(event.key==="ArrowLeft"){event.preventDefault();advanceYear(-1);}
});

const archiveMore = $("#archiveMore");
let albumEntries = [];
let albumOffset = 0;

function selectAlbum(filter) {
  const selected = currentEvents.filter(event => filter === "todos" || event.id === filter);
  const available = selected.flatMap(event =>
    (event.midias || []).filter(media => filePath(media.src)).map(media => ({ media, event }))
  );
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
  mosaic.replaceChildren();
  mosaic.dataset.view = filter === "todos" ? "all" : "album";
  const albumName = filter === "todos" ? "Todos os álbuns" : selected[0].titulo;
  archiveNote.textContent = albumName + " · " + available.length + (available.length === 1 ? " registro" : " registros");
  albumEntries = available;
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
    const caption = text("span", media.legenda || event.titulo, "mosaic__caption");
    const src = filePath(media.src);
    if (isVideo(src)) {
      button.classList.add("mosaic__photo--video");
      button.append(text("strong", "▶", "mosaic__play"));
      button.setAttribute("aria-label", "Ver vídeo: " + (media.alt || event.titulo));
    } else {
      const image = document.createElement("img");
      image.src = src;
      image.alt = media.alt || event.titulo;
      image.loading = "lazy";
      image.decoding = "async";
      button.append(image);
    }
    button.append(caption);
    button.addEventListener("click", () => openChapter(event, media, button));
    fragment.append(button);
  }
  mosaic.append(fragment);
  albumOffset = end;
  archiveMore.hidden = albumOffset === albumEntries.length;
  if (moveFocus) mosaic.children[start]?.focus();
}
archiveMore.addEventListener("click", () => appendArchivePage(true));

function setupFilters(events) {
  const available = events.filter(event => (event.midias || []).some(media => filePath(media.src)));
  archiveFilters.replaceChildren();
  if (!available.length) return;
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

for (const link of document.querySelectorAll("[data-archive-album]")) {
  link.addEventListener("click", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    selectAlbum(link.dataset.archiveAlbum);
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    $("#mosaico").scrollIntoView({ behavior: "instant" });
    $("#archiveTitle").focus({ preventScroll: true });
  });
}

const mediaView = $("#chapterMedia");
const mediaStrip = $("#chapterStrip");
const mediaControls = $("#chapterControls");
const mediaPosition = $("#photoPosition");
let viewer = { item: null, entries: [], index: 0 };

function showMedia(index, keepThumbVisible = true) {
  const { entries, item } = viewer;
  if (index < 0 || index >= entries.length) return;
  viewer.index = index;
  const { media, src } = entries[index];
  const video = isVideo(src);
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
  element.src = src;
  $("video", mediaView)?.pause();
  const figure = document.createElement("figure");
  figure.append(element);
  if (media.legenda) figure.append(text("figcaption", media.legenda));
  mediaView.replaceChildren(figure);
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
  const entries = (item.midias || []).map(media => ({ media, src: filePath(media.src) })).filter(entry => entry.src);
  viewer = { item, entries, index: 0 };
  $("#chapterCode").textContent = item.categoria || "Acervo";
  $("#chapterCategory").textContent = item.subtitulo || "";
  $("#chapterTitle").textContent = item.titulo;
  $("#chapterText").textContent = item.texto || item.resumo || "";
  mediaView.replaceChildren();
  mediaStrip.replaceChildren();
  mediaControls.hidden = entries.length < 2;
  mediaStrip.hidden = entries.length < 2;
  $("#chapterEmpty").hidden = entries.length > 0;
  if (entries.length > 1) {
    entries.forEach(({ media, src }, index) => {
      const button = text("button", "", "chapter-modal__thumb");
      button.type = "button";
      button.setAttribute("aria-label", media.alt || "Registro " + (index + 1));
      if (isVideo(src)) {
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
  if (entries.length) showMedia(Math.max(0, entries.findIndex(entry => entry.media === selectedMedia)), entries.length > 1);
}

$("#photoPrev").addEventListener("click", () => showMedia(viewer.index - 1));
$("#photoNext").addEventListener("click", () => showMedia(viewer.index + 1));
modal.addEventListener("keydown", event => {
  if (event.target.closest("video") || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  showMedia(viewer.index + (event.key === "ArrowRight" ? 1 : -1));
});

function closeChapter(){if(modal.open)modal.close();}
$("#chapterClose").addEventListener("click",closeChapter);
modal.addEventListener("click",event=>{
  const r=modal.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeChapter();
});
modal.addEventListener("close",()=>{
  $$("video",modal).forEach(v=>v.pause());
  if(previousFocus&&document.contains(previousFocus))previousFocus.focus({preventScroll:true});
});

async function fetchJson(path){
  if (Object.hasOwn(window.ferasPreview?.content ?? {}, path)) return window.ferasPreview.content[path];
  const r=await fetch(path,{cache:"no-cache"});
  if(!r.ok)throw Error("Não foi possível abrir "+path+": HTTP "+r.status);
  return await r.json();
}
async function loadContent(){
  const [eventsResult,scenesResult]=await Promise.allSettled([fetchJson("./content/acervo.json"),fetchJson("./content/cenas.json")]);
  if(eventsResult.status==="fulfilled"){
    const data=eventsResult.value;
    currentEvents=Array.isArray(data.eventos)?data.eventos:[];
    renderEpisodes(currentEvents.filter(item => item.categoria !== "ACERVO"));
    for (const button of $$("[data-open-event]")) {
      const event = currentEvents.find(item => item.id === button.dataset.openEvent);
      if (!event) continue;
      button.hidden = false;
      button.addEventListener("click", () => openChapter(event, null, button));
    }
    setupFilters(currentEvents);
  }else{
    eventTrack.replaceChildren();
    eventTrack.append(text("p","Os capítulos estão indisponíveis agora.","loading"));
    console.error(eventsResult.reason);
  }
  if(scenesResult.status==="fulfilled"){
    const data=scenesResult.value;
    for (const image of document.querySelectorAll(".film [data-shot]")) {
      const source = filePath(data.planos?.[image.dataset.shot]);
      if (source && !("previewShot" in image.dataset)) image.src = source;
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
memoryForm.addEventListener("submit", event => {
  event.preventDefault();
  const message = memoryText.value.trim();
  if (!message) {
    memoryText.setCustomValidity("Escreva uma lembrança antes de baixar.");
    memoryText.reportValidity();
    return;
  }
  const author = $("#memoryName").value.trim();
  const lines = ["Feras 26 · Caderno de memórias", memoryKind.value, "", message];
  if (author) lines.push("", author);
  const content = new Blob([lines.join("\n") + "\n"], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(content);
  const download = document.createElement("a");
  download.href = url;
  download.download = "Lembranca_Feras_26.txt";
  document.body.append(download);
  download.click();
  download.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  memoryStatus.textContent = "Arquivo preparado. Você pode continuar editando seu texto aqui.";
});

loadContent();
