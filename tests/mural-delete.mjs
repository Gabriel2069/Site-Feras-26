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
 console.log('Mural: cancelar, senha errada e confirmação conferidos em desktop e celular, sem remover mensagens reais.');
} finally {await browser.close();}
