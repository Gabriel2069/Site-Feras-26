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
const intro = $(".intro");
const introCenter = $("#introCenter");
const introLogo = $("#introLogo");
const introTitle = $("#introTitle");
const introSlash = $(".intro__slash");
const introFrames = $$(".intro__film-frame");
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
  pinStart = yearSection.getBoundingClientRect().top + scrollY + padding + yearHead.offsetHeight;
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
  const introBounds = intro.getBoundingClientRect();
  const introTravel = Math.max(1, intro.offsetHeight - innerHeight);
  const p = clamp(-introBounds.top / introTravel, 0, 1);
  if (introBounds.bottom >= 0 && introBounds.top <= innerHeight) {
    introCenter.style.transform = "translate3d(0," + (-95*p) + "px,0) scale(" + (1+0.14*p) + ")";
    introCenter.style.opacity = String(clamp(1 - p*1.15,.06,1));
    introLogo.style.filter = "drop-shadow(0 20px 22px #0009)";
    introSlash.style.opacity = String(.1 + .65*p);
    introSlash.style.transform = "translate3d(" + (-50*p) + "px,0,0) scale(" + (1+0.18*p) + ")";
    introFrames.forEach((frame, i) => {
      const shift = (i === 0 ? -1 : 1) * p * 180;
      frame.style.translate = shift + "px " + (p * (i === 0 ? -115 : 125)) + "px";
    });
  }
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
  {id:"portao",nome:"O PORTÃO",numero:"01",descricao:"O começo de todo dia. A entrada, a espera, o caminho pra dentro.",imagem:null},
  {id:"patio",nome:"O PÁTIO",numero:"02",descricao:"Era onde a gente se encontrava antes de ir pra sala.",imagem:null},
  {id:"salas",nome:"AS SALAS",numero:"03",descricao:"Cada uma com seu jeito, suas conversas e seus professores.",imagem:null},
  {id:"auditorio",nome:"O AUDITÓRIO",numero:"04",descricao:"Tem aulão e outros encontros que merecem entrar no arquivo.",imagem:null}
];
function switchLocation(id) {
  const loc=(currentScenes.locais||[]).find(x=>x.id===id) || defaultLocations.find(x=>x.id===id);
  if(!loc)return;
  $$("[data-place]").forEach(b=>{
    const active=b.dataset.place===id;
    b.classList.toggle("is-active",active);
    b.setAttribute("aria-pressed",String(active));
  });
  $("#locationName").textContent=loc.nome;
  $("#locationStamp").textContent=loc.numero+" / 04";
  $("#locationDescription").textContent=loc.descricao;
  corridor.dataset.place=id;
  const surface=$("#locationImage");
  const src=filePath(loc.imagem);
  if(src && !isVideo(src)) {
    surface.style.backgroundImage="url('"+src+"')";
    surface.classList.add("has-image");
  } else {
    surface.style.backgroundImage="";
    surface.classList.remove("has-image");
  }
}
$$("[data-place]").forEach(b=>b.addEventListener("click",()=>switchLocation(b.dataset.place)));

function makeEpisode(item,index) {
  const card=document.createElement("button");
  card.type="button";card.className="episode";
  card.setAttribute("aria-label","Abrir capítulo: "+item.titulo);
  const top=text("div","","episode__top");
  top.append(text("span",String(index+1).padStart(2,"0")+" / 06"),text("span",item.subtitulo||item.categoria));
  const numeral=text("div",String(index+1).padStart(2,"0"),"episode__number");
  numeral.setAttribute("aria-hidden","true");
  const polaroid=text("div","","episode__photo");
  polaroid.setAttribute("aria-hidden","true");
  const photo=text("div","","episode__picture");
  const first=(item.midias||[]).find(m=>filePath(m.src)&&!isVideo(m.src));
  if(first) {
    const img=document.createElement("img");
    img.src=first.src;img.alt="";img.loading="lazy";photo.append(img);
  } else {
    photo.append(text("span","FERAS 26 / ARQUIVO"));
  }
  polaroid.append(photo);
  const decal=document.createElement("img");
  decal.className="episode__decal";decal.src=safeAsset(index);decal.alt="";decal.loading="lazy";decal.setAttribute("aria-hidden","true");
  const bottom=text("div","","episode__bottom");
  bottom.append(text("h3",item.titulo));
  bottom.append(text("p",item.resumo));
  const footer=text("div","","episode__footer");
  footer.append(text("span","FERAS 26"),text("span","ABRIR CAPÍTULO ↗"));
  bottom.append(footer);
  card.append(top,numeral,polaroid,decal,bottom);
  card.addEventListener("click",()=>openChapter(item));
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

function renderMosaic(events,filter="todos"){
  const available=events.flatMap(event=>(event.midias||[]).filter(m=>filePath(m.src)&&!isVideo(m.src)).map(m=>({...m,event})));
  if(!available.length){archiveNote.textContent="Estamos selecionando as fotos e os vídeos que poderão fazer parte do memorial.";return;}
  const selected=available.filter(m=>filter==="todos" || m.event.id===filter);
  mosaic.replaceChildren();
  if(!selected.length){
    mosaic.append(text("div","Esse capítulo ainda não tem fotos publicadas.","mosaic__graphic mosaic__graphic--last"));
  }else{
    selected.slice(0,36).forEach(item=>{
      const button=document.createElement("button");button.type="button";button.className="mosaic__photo";
      const image=document.createElement("img");image.src=item.src;image.alt=item.alt||item.event.titulo;image.loading="lazy";image.decoding="async";
      const cap=text("span",item.legenda||item.event.titulo);
      button.append(image,cap);
      button.addEventListener("click",()=>openChapter(item.event));
      mosaic.append(button);
    });
  }
  archiveNote.textContent=selected.length+" foto"+(selected.length===1?"":"s")+" selecionada"+(selected.length===1?"":"s")+" para esta parte do memorial.";
}
function setupFilters(events){
  const available=events.filter(e=>(e.midias||[]).some(m=>filePath(m.src)&&!isVideo(m.src)));
  if(!available.length){archiveFilters.replaceChildren();return;}
  archiveFilters.replaceChildren();
  const options=[{id:"todos",name:"TUDO"},...available.map(e=>({id:e.id,name:e.titulo.toUpperCase()}))];
  options.forEach(({id,name},index)=>{
    const b=document.createElement("button");b.type="button";b.dataset.filter=id;b.className=index===0?"is-selected":"";b.setAttribute("aria-pressed",String(index===0));b.textContent=name;
    b.addEventListener("click",()=>{
      $$("button",archiveFilters).forEach(x=>{const selected=x.dataset.filter===id;x.classList.toggle("is-selected",selected);x.setAttribute("aria-pressed",String(selected));});
      renderMosaic(events,id);
    });
    archiveFilters.append(b);
  });
}

function openChapter(item){
  previousFocus=document.activeElement;
  $("#chapterCode").textContent="FERAS 26 / "+(item.categoria||"ACERVO");
  $("#chapterCategory").textContent=item.subtitulo||"NOSSAS FOTOS";
  $("#chapterTitle").textContent=item.titulo;
  $("#chapterText").textContent=item.texto||item.resumo;
  const list=$("#chapterMedia");
  list.replaceChildren();
  let count=0;
  (item.midias||[]).forEach(media=>{
    const src=filePath(media.src);
    if(!src)return;
    const figure=document.createElement("figure");
    let element;
    if(isVideo(src)){
      element=document.createElement("video");element.src=src;element.controls=true;element.preload="metadata";element.playsInline=true;
      element.setAttribute("aria-label",media.alt||"Vídeo do "+item.titulo);
    }else{
      element=document.createElement("img");element.src=src;element.loading="lazy";element.alt=media.alt||item.titulo;element.decoding="async";
    }
    const caption=text("figcaption",media.legenda||"");
    figure.append(element,caption);list.append(figure);count++;
  });
  $("#chapterEmpty").hidden=count>0;
  modal.showModal();
}
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
  const r=await fetch(path,{cache:"no-cache"});
  if(!r.ok)throw Error("Não foi possível abrir "+path+": HTTP "+r.status);
  return await r.json();
}
async function loadContent(){
  const [eventsResult,scenesResult]=await Promise.allSettled([fetchJson("./content/acervo.json"),fetchJson("./content/cenas.json")]);
  if(eventsResult.status==="fulfilled"){
    const data=eventsResult.value;
    currentEvents=Array.isArray(data.eventos)?data.eventos:[];
    renderEpisodes(currentEvents);
    renderMosaic(currentEvents);
    setupFilters(currentEvents);
  }else{
    eventTrack.replaceChildren();
    eventTrack.append(text("p","Os capítulos estão indisponíveis agora.","loading"));
    console.error(eventsResult.reason);
  }
  if(scenesResult.status==="fulfilled"){
    const data=scenesResult.value;
    currentScenes={locais:Array.isArray(data.locais)?data.locais:[],recortes:Array.isArray(data.recortes)?data.recortes:[]};
  }else{console.warn("Cenas complementares indisponíveis:",scenesResult.reason);}
  switchLocation("patio");
}
loadContent();
