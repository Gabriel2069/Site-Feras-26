import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../retorno.js', import.meta.url), 'utf8');
function setup(type='navigate',hash='',departure=null) {
 const listeners={}, frames=[], storage=new Map(); let now=100000, resets=0, top=920;
 if (departure !== null) storage.set("feras26:away:/", String(departure));
 const location={pathname:'/',search:'',hash};
 const document={hidden:false,addEventListener:(n,f)=>listeners[n]=f};
 const history={state:null,scrollRestoration:'auto',replaceState:()=>location.hash=''};
 const context={location,document,history,performance:{getEntriesByType:()=>[{type}]},Date:{now:()=>now},
 sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 addEventListener:(n,f)=>listeners[n]=f,dispatchEvent:()=>resets++,Event:class {},requestAnimationFrame:f=>frames.push(f),scrollTo:opts=>top=opts.top};
 runInNewContext(source,context);
 return {fire:n=>listeners[n](),flush:()=>{while(frames.length)frames.shift()();}, hide:()=>{document.hidden=true;listeners.visibilitychange();},show:()=>{document.hidden=false;listeners.visibilitychange();},advance:t=>now+=t,setTop:v=>top=v,state:()=>({top,resets,hash:location.hash,mode:history.scrollRestoration})};
}
for(const type of ['navigate','reload','back_forward']) {
 const p=setup(type,type==='navigate'?'':'#pessoas');p.fire('pageshow');p.setTop(1800);p.flush();assert.equal(p.state().top,0);assert.equal(p.state().mode,'manual');assert.equal(p.state().hash,'');
}
const p=setup();p.fire('pageshow');p.flush();p.setTop(2400);p.hide();p.advance(59000);p.show();p.flush();assert.equal(p.state().top,2400,'Troca curta de aba preserva a leitura');p.hide();p.advance(60000);p.show();p.flush();assert.equal(p.state().top,0,'Um minuto fora retorna à entrada');p.setTop(3200);p.fire('pageshow');p.flush();assert.equal(p.state().top,3200,'Eventos repetidos não interrompem a leitura');
const direct=setup('navigate','#caminho');direct.fire('pageshow');direct.flush();assert.equal(direct.state().hash,'#caminho','Link direto deliberado continua válido');
console.log('Retorno: abertura, recarga, histórico, troca breve, ausência de um minuto e âncora direta conferidos.');

const stale=setup("navigate","#caminho",1000);stale.fire("pageshow");stale.flush();assert.equal(stale.state().hash,"#caminho");assert.equal(stale.state().resets,0,"Link direto prevalece sobre a ausência antiga");
