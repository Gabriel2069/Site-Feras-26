import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const width of [1280,390]) {
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let attempts=0;
  await page.route('**/rest/v1/feras_memorias?*',route=>route.fulfill({json:route.request().method()==='POST'
   ? [{id:'00000000-0000-4000-8000-000000000002',kind:'Cotidiano',message:'seu ***',author:'Teste'}]
   : [{id:'00000000-0000-4000-8000-000000000001',kind:'Cotidiano',message:'Lembrança <teste> da turma',author:'Teste'}]}));
  await page.route('**/rest/v1/rpc/feras_apagar_memoria',route=>{
   attempts++;
   const data=route.request().postDataJSON();
   assert.equal(data.p_id,'00000000-0000-4000-8000-000000000001');
   return route.fulfill({json:data.p_senha==='senha-de-teste'?{ok:true,code:'deleted'}:{ok:false,code:'invalid_password'}});
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  const remove=page.locator('#memoryWall button');await remove.waitFor({state:'visible'});
  await remove.click();await page.locator('#memoryDeleteCancel').click();assert.equal(attempts,0);assert.equal(await remove.count(),1);
  await remove.click();await page.locator('#memoryDeletePassword').fill('errada');await page.locator('#memoryDeleteConfirm').click();
  await page.getByText('Senha incorreta. A mensagem foi mantida.',{exact:true}).waitFor();assert.equal(await remove.count(),1);
  await page.locator('#memoryDeletePassword').fill('senha-de-teste');await page.locator('#memoryDeleteConfirm').click();
  await page.getByText('Mensagem apagada.',{exact:true}).waitFor();assert.equal(await page.locator('#memoryWall article').count(),0);
  assert.equal(await page.locator('#memoryDeleteDialog').evaluate(el=>el.open),false);assert.equal(await page.locator('#memoryDeletePassword').inputValue(),'');assert.deepEqual(errors,[]);
  await page.locator('#memoryText').fill('seu idiota');
  await page.locator('#memoryName').fill('Teste');
  await page.locator('#relato button[type=submit]').click();
  await page.getByText('Lembrança publicada no mural.',{exact:true}).waitFor();
  assert.equal(await page.locator('#memoryWall article p').textContent(),'seu ***');
  assert.equal(await page.locator('#memoryWall button').count(),1);
  await page.close();
 }
 for (const removeBeforeLoad of [false,true]) {
  const race = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  let release; const gate = new Promise(resolve=>release=resolve);
  const saved = {id:'00000000-0000-4000-8000-000000000003',kind:'Cotidiano',message:'Nova lembrança',author:'Teste'};
  await race.route('**/rest/v1/feras_memorias?*', async route=>{
   if(route.request().method()==='POST') return route.fulfill({json:[saved]});
   await gate; return route.fulfill({json:removeBeforeLoad?[saved]:[]});
  });
  await race.route('**/rest/v1/rpc/feras_apagar_memoria',route=>route.fulfill({json:{ok:true,code:'deleted'}}));
  await race.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await race.locator('#memoryText').fill('Nova lembrança');
  await race.locator('#relato button[type=submit]').click();
  await race.getByText('Lembrança publicada no mural.',{exact:true}).waitFor();
  if(removeBeforeLoad) {
   await race.locator('#memoryWall button').click();
   await race.locator('#memoryDeletePassword').fill('senha-de-teste');
   await race.locator('#memoryDeleteConfirm').click();
   await race.getByText('Mensagem apagada.',{exact:true}).waitFor();
  }
  const loaded = race.waitForResponse(response=>response.url().includes('/rest/v1/feras_memorias?') && response.request().method()==='GET');
  release(); await (await loaded).finished(); await race.waitForTimeout(150);
  assert.equal(await race.locator('#memoryWall article').count(),removeBeforeLoad?0:1,'Carga atrasada preserva publicações e remoções confirmadas');
  await race.close();
 }
 console.log('Mural: remoção, publicação imediata filtrada e carga atrasada conferidas em desktop e celular, sem mensagens reais.');
} finally {await browser.close();}
