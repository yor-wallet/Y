/* Admin Control (14.0.0) — against the fake client that behaves like the database functions:
   - a normal user never reaches it (no call made);
   - the DY switch is retired with transfers: its history stays readable, nothing can change it from the app;
   - bank withdrawals: approve -> mark as paid with the bank reference; a refusal needs a reason;
   - crypto withdrawals: start processing -> confirm ONLY with a valid blockchain hash (a wrong one is refused and nothing changes);
   - settings: the withdrawals switch calls admin_set_setting with a real boolean. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const calls = (page, n) => page.evaluate(n => (window.__rpcLog || []).filter(c => c.name === n), n);
async function confirmSheet(page, value){
  await page.waitForSelector('.po-sheet #ad-go');
  if (value != null) await page.fill('#ad-in', value);
  await page.click('#ad-go'); await wait(700);
}
const tab = (page, k) => page.click('#dy-control .adm-tabs [data-adm="' + k + '"]');

{
  const { ctx, page, logs } = await openApp(browser, url, { settle: 400 });
  console.log('\n[utilisateur normal]');
  await ok('pas d’entrée administrateur ; l’écran renvoie à l’accueil sans appeler le serveur', async () => {
    await page.evaluate(() => R.go('account', { force: true })); await wait(400);
    assert.equal(await page.locator('[data-nav="dy-control"]').count(), 0);
    await page.evaluate(() => R.go('dy-control', { force: true })); await wait(800);
    assert.equal(await page.evaluate(() => R.current()), 'home');
    assert.equal((await calls(page, 'admin_withdrawal_list')).length + (await calls(page, 'admin_dy_overview')).length, 0);
  });
  /* the user makes one bank and one crypto withdrawal for the admin part below (same fake server only inside this page) */
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { settle: 400, admin: true, dy: true });
  console.log('\n[administrateur]');
  /* two requests exist (made through the user functions of the fake server) */
  await page.evaluate(async () => {
    await sb.rpc('withdraw_request', { p_amount: 20, p_holder: 'Amira Al Said', p_bank_code: 'BMCT', p_account: '0123456789', p_iban: null, p_key: 'key-bank-0001' });
    await sb.rpc('crypto_withdraw_request', { p_asset: 'USDT', p_network: 'tron', p_address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', p_memo: null, p_amount: 40, p_idempotency_key: 'key-crypto-001', p_pin_grant: 'g' });
    window.__rpcLog = [];
  });
  await ok('l’entrée est dans le compte ; tableau de bord avec les retraits en cours', async () => {
    await page.evaluate(() => R.go('account', { force: true })); await wait(400);
    await page.click('[data-nav="dy-control"]'); await page.waitForSelector('#dy-control.active #adm-main');
    await wait(900);
    const txt = await page.locator('#adm-main').innerText();
    assert.match(txt, /Bank withdrawals/); assert.match(txt, /Crypto withdrawals/);
    assert.ok((await calls(page, 'admin_withdrawal_list')).length >= 1 && (await calls(page, 'admin_crypto_withdrawal_list')).length >= 1);
  });
  await ok('transactions : un seul clic crédite, enregistre l’heure exacte, un seul e-mail ; un double-clic ne fait rien de plus', async () => {
    await tab(page, 'txs'); await page.waitForSelector('#adm-main [data-ad="t-confirm"]');
    assert.equal(await page.locator('#adm-main .tx-item').count(), 2);
    await page.dblclick('#adm-main [data-tx-item="atx-1"] [data-ad="t-confirm"]'); await wait(900);
    assert.equal((await calls(page, 'admin_tx_confirm')).length, 1, 'one call for a double click');
    assert.equal((await calls(page, 'admin_tx_confirm'))[0].args.p_tx, 'atx-1');
    const st = await page.evaluate(() => ({ s: window.__txAdm[0].status, at: window.__txAdm[0].confirmed_at, credit: window.__txCredits['atx-1'], mails: window.__txMails['atx-1'] }));
    assert.equal(st.s, 'CONFIRMED'); assert.ok(st.at); assert.equal(st.credit, 12.5); assert.equal(st.mails, 1);
    assert.match(await page.locator('#adm-main [data-tx-item="atx-1"]').innerText(), /CONFIRMED/, 'it stays in place, shown as confirmed');
    assert.equal(await page.evaluate(() => window.__txAdm[1].status), 'PENDING', 'the next transaction was not touched');
    await page.click('#dy-control [data-ad-f="tx:CONFIRMED"]'); await page.waitForSelector('#adm-main [data-tx-item="atx-1"]');
    const txt = await page.locator('#adm-main [data-tx-item="atx-1"]').innerText();
    assert.match(txt, /OMT48213999/); assert.match(txt, /\d{2}:\d{2}:\d{2}/, 'exact time with seconds'); assert.match(txt, /queued|file/i);
    await page.evaluate(() => sb.rpc('admin_tx_confirm', { p_tx: 'atx-1' }));          /* a late second confirmation */
    assert.equal(await page.evaluate(() => window.__txCredits['atx-1']), 12.5); assert.equal(await page.evaluate(() => window.__txMails['atx-1']), 1);
  });
  await ok('transactions : « Mettre en pause » garde la transaction en attente (montant réservé) ; elle reste confirmable et refusable', async () => {
    await page.click('#dy-control [data-ad-f="tx:PENDING"]'); await page.waitForSelector('#adm-main [data-tx-item="atx-2"] [data-ad="t-pause"]');
    await page.click('#adm-main [data-tx-item="atx-2"] [data-ad="t-pause"]'); await wait(900);
    assert.equal((await calls(page, 'admin_tx_pause')).length, 1);
    assert.equal(await page.evaluate(() => window.__txAdm[1].status), 'PENDING'); assert.equal(await page.evaluate(() => window.__txAdm[1].paused), true);
    const it = page.locator('#adm-main [data-tx-item="atx-2"]');
    assert.match(await it.innerText(), /Paused|En pause/);
    assert.equal(await it.locator('[data-ad="t-pause"]').count(), 0); assert.equal(await it.locator('[data-ad="t-confirm"]').count(), 1); assert.equal(await it.locator('[data-ad="t-reject"]').count(), 1);
  });
  await ok('transactions : refus avec motif obligatoire', async () => {
    await page.click('#dy-control [data-ad-f="tx:PENDING"]'); await page.waitForSelector('#adm-main [data-tx-item="atx-2"] [data-ad="t-reject"]');
    await page.click('#adm-main [data-tx-item="atx-2"] [data-ad="t-reject"]'); await confirmSheet(page, 'Montant non justifié');
    assert.equal(await page.evaluate(() => window.__txAdm[1].status), 'REJECTED');
    assert.equal(await page.evaluate(() => window.__txMails['atx-2'] || 0), 0);
  });
  await ok('DY : historique lisible (archives), aucun interrupteur, aucun appel de changement', async () => {
    await tab(page, 'logs'); await page.waitForSelector('#adm-main .dy-hist li');
    assert.equal(await page.locator('#dy-control #dy-switch, #dy-control [data-dy="toggle"]').count(), 0);
    assert.equal(await page.locator('#adm-main .dy-hist li').count(), 1);
    assert.equal((await calls(page, 'admin_dy_set')).length, 0);
  });
  await ok('retrait bancaire : refus sans motif impossible, puis approuver -> payé avec la référence', async () => {
    await tab(page, 'wdBank'); await page.waitForSelector('#adm-main [data-ad="b-approve"]');
    await page.click('#adm-main [data-ad="b-reject"]'); await confirmSheet(page, 'x');
    assert.match(await page.locator('#ad-err').innerText(), /reason|motif/i);
    assert.equal((await calls(page, 'admin_withdrawal_decide')).length, 0, 'a refusal without a reason is not sent');
    await page.click('#ad-no'); await wait(400);
    await page.click('#adm-main [data-ad="b-approve"]'); await confirmSheet(page);
    assert.deepEqual((await calls(page, 'admin_withdrawal_decide'))[0].args.p_approve, true);
    await page.waitForSelector('#adm-main [data-ad="b-paid"]');
    await page.click('#adm-main [data-ad="b-paid"]'); await confirmSheet(page, 'MCT-2026-11-22-0042');
    assert.equal((await calls(page, 'admin_withdrawal_mark_paid'))[0].args.p_bank_ref, 'MCT-2026-11-22-0042');
    assert.equal(await page.evaluate(() => window.__wd.bank[0].status), 'PAID');
  });
  await ok('retrait crypto : traitement, puis un hash invalide est refusé, un hash valide confirme', async () => {
    await tab(page, 'wdCrypto'); await page.waitForSelector('#adm-main [data-ad="c-process"]');
    await page.click('#adm-main [data-ad="c-process"]'); await confirmSheet(page);
    await page.waitForSelector('#adm-main [data-ad="c-complete"]');
    await page.click('#adm-main [data-ad="c-complete"]'); await confirmSheet(page, 'not-a-real-hash-not-a-real-hash-xx');
    assert.match(await page.locator('#ad-err').innerText(), /hash/i);
    assert.equal(await page.evaluate(() => window.__wd.crypto[0].status), 'PROCESSING', 'nothing changed');
    const h = 'a'.repeat(64);
    await page.fill('#ad-in', h); await page.click('#ad-go'); await wait(800);
    assert.equal(await page.evaluate(() => window.__wd.crypto[0].status), 'COMPLETED');
    await page.click('#dy-control [data-ad-f="crypto:all"]'); await wait(300);
    assert.match(await page.locator('#adm-main').innerText(), /aaaaaaaa/);
  });
  await ok('paramètres : l’interrupteur des retraits envoie un vrai booléen', async () => {
    await tab(page, 'settings'); await page.waitForSelector('#adm-main [data-ad="wd-toggle"]');
    await page.click('#adm-main [data-ad="wd-toggle"]'); await confirmSheet(page);
    const c = await calls(page, 'admin_set_setting'); assert.deepEqual(c[0].args, { p_key: 'withdraw_enabled', p_value: false });
  });
  await ok('actifs et réseaux : contrats vérifiés affichés, dépôts « non configurés »', async () => {
    await tab(page, 'assets'); await page.waitForSelector('#adm-main .omx-net'); await wait(300);
    const txt = await page.locator('#adm-main').innerText();
    assert.match(txt, /0xdAC17F958D2ee523a2206206994597C13D831ec7/); assert.match(txt, /Not configured|Non configurée/);
  });
  await ok('utilisateurs : liste puis recherche', async () => {
    await tab(page, 'users'); await page.waitForSelector('#adm-main .ad-user');
    await page.fill('#ad-q', 'zz-nobody'); await wait(900);
    assert.equal(await page.locator('#adm-main .ad-user').count(), 0);
    await page.fill('#ad-q', 'amira'); await wait(900);
    assert.equal(await page.locator('#adm-main .ad-user').count(), 1);
  });
  await ok('no page errors', async () => { if (logs.length) console.log(logs.join('\n')); assert.deepEqual(logs, []); });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
