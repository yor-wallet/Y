/* DYT 14 — crypto and withdrawals, against fixed local market data (Binance format) and the fake Supabase client:
   - home: balance hidden first; the total is the real holdings x market price + the OMR account (pegged), nothing invented;
   - market down: no price is invented, the state says so and offers Retry;
   - markets: the 13 assets, live state + last sync, search, favourites saved in the preferences;
   - asset: chart from klines with the period asked, networks with the verified contracts;
   - deposit: the server is asked, it has no real address -> clear "no address" message, no address, no QR;
   - exchange: says it is not connected;
   - crypto withdrawal: client checks, PIN grant sent, tracking from the REAL status, cancel refunds;
   - bank withdrawal: minimum and IBAN checks, request sent with an idempotency key, tracking. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const calls = (page, n) => page.evaluate(n => (window.__rpcLog || []).filter(c => c.name === n), n);
async function pin(page){ await page.waitForSelector('.ps #ps-dots', { timeout: 8000 }); await wait(300); for (const k of '482913') await page.keyboard.press(k); }

{
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900 });
  console.log('\n[accueil, marchés, actif, dépôt, échange]');
  await ok('accueil : solde masqué, puis total réel = 0.01 BTC + 250 USDT + 1 284,500 OMR (indexé)', async () => {
    assert.match(await page.locator('#home [data-omx-total]').innerText(), /^[•\s]+$/);
    await page.click('#home [data-action="toggle-balance"]'); await wait(900);
    const expect = 0.01 * 97000 + 250 * (1 / 1.0002) + 1284.5 * 2.6008;
    const shown = Number((await page.locator('#home [data-omx-total]').innerText()).replace(/[$,]/g, ''));
    assert.ok(Math.abs(shown - expect) < 0.02, shown + ' vs ' + expect);
    assert.deepEqual(await page.$$eval('#home .omx-acts .omx-act', b => b.map(x => x.getAttribute('data-nav'))), ['deposit', 'exchange', 'withdraw', 'send-internal']);   /* 14.7.0: three round actions (reference image) */
    /* 14.7.0: the holdings are on the Wallet tab (reference image « My Assets »), with the same real quantities */
    await page.evaluate(() => R.go('wallet', { force: true })); await wait(800);
    assert.match(await page.locator('#wallet').innerText(), /Bitcoin[\s\S]*0\.01 BTC/);
    await page.evaluate(() => R.go('home', { force: true })); await wait(600);
  });
  await ok('marchés : 13 actifs, état et heure de synchro, recherche, favori enregistré', async () => {
    await page.evaluate(() => R.go('markets')); await wait(700);
    assert.equal(await page.locator('#markets .omx-row').count(), 13);
    assert.match(await page.locator('#markets .omx-status').innerText(), /Actualisé toutes les 20 s|En direct/);
    assert.match(await page.locator('#markets .omx-status').innerText(), /Dernière synchro \d{2}:\d{2}:\d{2}/);
    assert.match(await page.locator('#markets [data-omx-v="BTC"]').innerText(), /\$97,000\.00/);
    await page.fill('#omx-q', 'sol'); await wait(300);
    assert.equal(await page.locator('#markets .omx-row').count(), 1);
    await page.fill('#omx-q', ''); await page.dispatchEvent('#omx-q', 'input'); await wait(200);
    await page.click('#markets [data-omx-asset="ETH"]'); await page.waitForSelector('#asset.active .omx-chart svg', { timeout: 6000 });
    await page.click('#asset [data-omx="fav"]'); await wait(300);
    assert.deepEqual(await page.evaluate(() => Runtime.settings.omxFavorites), ['ETH']);
  });
  await ok('actif : graphique des vraies bougies, période 1W -> intervalle 1h, réseaux et contrat vérifié', async () => {
    const before = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /klines/.test(e.name)).length);
    await page.click('#asset [data-omx-per="1W"]'); await wait(700);
    const k = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /klines/.test(e.name)).map(e => e.name));
    assert.ok(k.length > before && /symbol=ETHUSDT&interval=1h&limit=168/.test(k[k.length - 1]), k[k.length - 1]);
    assert.match(await page.locator('#asset .omx-nets').innerText(), /Ethereum/);
    await page.evaluate(() => { OMX.state.cur = 'USDT'; R.go('asset', { force: true }); }); await wait(900);
    assert.match(await page.locator('#asset .omx-nets').innerText(), /0xdAC17F…831ec7/);
  });
  await ok('dépôt : l’adresse personnelle du compte et son QR enregistré s’affichent (image, jamais du balisage)', async () => {
    await page.evaluate(() => { OMX.state.dep = { asset: null, net: null }; R.go('deposit'); }); await wait(800);
    await page.click('#deposit [data-dep-asset="USDT"]'); await wait(400);
    await page.click('#deposit [data-omx="dep-net"]'); await page.waitForSelector('.omx-sheet [data-net="tron"]');
    await page.click('.omx-sheet [data-net="tron"]'); await wait(900);
    assert.deepEqual((await calls(page, 'get_receive_address')).pop().args, { p_asset: 'USDT', p_network: 'tron' });
    const txt = await page.locator('#omx-dep-res').innerText();
    assert.match(txt, /TZ2nw5y4azp1wkY89kPTBqUPtRhCguWhjY/);
    assert.equal(await page.locator('#omx-dep-res img.omx-qrsvg[src^="data:image/svg+xml"]').count(), 1);
    assert.equal(await page.locator('#omx-dep-res .omx-qr svg').count(), 0);
  });
  await ok('dépôt : si le serveur n’a pas d’adresse -> message clair, aucune adresse, aucun QR', async () => {
    await page.evaluate(() => { window.__noAddr = true; OMX.state.dep = { asset: null, net: null }; R.go('deposit', { force: true }); }); await wait(800);
    await page.click('#deposit [data-dep-asset="USDT"]'); await wait(400);
    await page.click('#deposit [data-omx="dep-net"]'); await page.waitForSelector('.omx-sheet [data-net="tron"]');
    await page.click('.omx-sheet [data-net="tron"]'); await wait(900);
    assert.deepEqual((await calls(page, 'get_receive_address')).pop().args, { p_asset: 'USDT', p_network: 'tron' });
    const txt = await page.locator('#omx-dep-res').innerText();
    assert.match(txt, /Aucune adresse de dépôt/); assert.match(txt, /N’envoyez AUCUN fonds/);
    assert.equal(await page.locator('#deposit .omx-qr, #deposit .omx-addr').count(), 0);
    await page.evaluate(() => { window.__noAddr = false; });
  });
  /* 14.5.0: the exchange is now a real Swap (server-fixed price, PIN, administrator's confirmation) — tested in detail in trade.test.mjs */
  await ok('échange (Swap) : formulaire réel, prix fixé par le serveur, frais affichés', async () => {
    await page.evaluate(() => R.go('exchange')); await wait(500);
    assert.equal(await page.locator('#exchange #sw-amt').count(), 1);
    assert.match(await page.locator('#exchange .tr-det').innerText(), /fixé au moment de la demande/);
  });
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'en', settle: 900, market: 'down' });
  console.log('\n[données de marché indisponibles]');
  await ok('aucun cours inventé : « — », état « indisponible » et bouton Réessayer', async () => {
    await page.click('#home [data-action="toggle-balance"]'); await wait(700);
    assert.equal((await page.locator('#home [data-omx-total]').innerText()).trim(), '—');
    await page.evaluate(() => R.go('markets')); await wait(600);
    assert.match(await page.locator('#markets .omx-status').innerText(), /Market data unavailable/);
    assert.equal(await page.locator('#markets [data-omx="retry"]').count(), 1);
    assert.equal((await page.locator('#markets [data-omx-v="BTC"]').innerText()).trim(), '—');
  });
  await ok('no page errors', async () => assert.deepEqual(logs.filter(l => !/503|Failed to load resource/.test(l)), []));
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900 });
  console.log('\n[retraits]');
  await ok('retrait crypto : contrôles (réseau, adresse, solde) avant tout envoi', async () => {
    await page.evaluate(() => R.go('withdraw')); await wait(800);
    await page.click('#withdraw [data-wd="crypto"]'); await page.waitForSelector('#withdraw-crypto.active #wc-next');
    await page.click('[data-wd-asset="USDT"]'); await wait(400);
    await page.click('#wc-next');
    assert.match(await page.locator('#wc-e-net').innerText(), /réseau/);
    await page.click('[data-wd="net"]'); await page.waitForSelector('.omx-sheet [data-net="tron"]');
    assert.equal(await page.locator('.omx-sheet [data-net="solana"][disabled]').count(), 1, 'a network without withdrawals cannot be picked');
    await page.click('.omx-sheet [data-net="tron"]'); await wait(600);
    await page.fill('#wc-addr', '0x1234'); await page.fill('#wc-amt', '999'); await page.click('#wc-next');
    assert.match(await page.locator('#wc-e-addr').innerText(), /adresse TRON valide/);
    assert.match(await page.locator('#wc-e-amt').innerText(), /dépassent/);
    assert.equal((await calls(page, 'crypto_withdraw_request')).length, 0);
  });
  await ok('retrait crypto : récapitulatif, case à cocher, code PIN, demande envoyée avec le jeton', async () => {
    await page.fill('#wc-addr', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'); await page.fill('#wc-amt', '50'); await page.dispatchEvent('#wc-amt', 'input');
    assert.match(await page.locator('#wc-total').innerText(), /50 USDT/);
    await wait(900);                                       /* the error scroll has finished (a tap during a scroll is ignored, as on iOS) */
    await page.click('#wc-next'); await page.waitForSelector('#withdraw-confirm.active #wr-go');
    assert.ok(await page.locator('#wr-go').isDisabled(), 'the address check box comes first');
    await page.check('#wr-ok'); await page.click('#wr-go'); await pin(page);
    await page.waitForSelector('#withdraw-track.active .wd-steps', { timeout: 8000 }); await wait(800);
    const c = (await calls(page, 'crypto_withdraw_request'))[0].args;
    assert.equal(c.p_pin_grant, 'grant-1'); assert.equal(c.p_amount, 50); assert.equal(c.p_network, 'tron'); assert.ok(c.p_idempotency_key && c.p_idempotency_key.length >= 16);
  });
  await ok('suivi : l’utilisateur voit seulement « En cours » (animé), rien sur l’administrateur, rien de « confirmé »', async () => {
    const txt = await page.locator('#withdraw-track').innerText();
    assert.match(txt, /En cours/); assert.doesNotMatch(txt, /Confirmé sur la blockchain|vérification|administrateur|équipe/i); assert.equal(await page.locator('#withdraw-track .omx-prog i').count(), 3);
    assert.equal(await page.locator('#withdraw-track .wd-step.now').count(), 1);
    assert.equal(await page.locator('#withdraw-track .wd-step.ok').count(), 1);
    assert.equal(await page.locator('#withdraw-track .wd-anim.k-wait').count(), 1);
  });
  await ok('annulation : confirmation, statut annulé, solde rendu', async () => {
    await page.click('#withdraw-track [data-wd="cancel"]'); await page.waitForSelector('.wd-ask [data-ask="yes"]');
    await page.click('.wd-ask [data-ask="yes"]'); await wait(1200);
    assert.match(await page.locator('#withdraw-track').innerText(), /Annulé/);
    assert.equal(await page.locator('#withdraw-track .wd-anim.k-cancel').count(), 1);
    assert.equal(await page.evaluate(() => Runtime.wallets.find(w => w.asset === 'USDT').availableBalance), 250);
  });
  await ok('retrait bancaire : minimum et IBAN vérifiés, puis demande envoyée et suivie', async () => {
    await page.evaluate(() => R.go('withdraw-bank')); await page.waitForSelector('#withdraw-bank.active #wb-next');
    await page.fill('#wb-amt', '5'); await page.dispatchEvent('#wb-amt', 'input'); await page.click('#wb-next');
    assert.match(await page.locator('#wb-e-amt').innerText(), /minimum/i);
    assert.match(await page.locator('#wb-e-bank').innerText(), /banque/);
    await page.fill('#wb-amt', '25'); await page.selectOption('#wb-bank', 'BMCT'); await page.fill('#wb-acc', '0123456789'); await page.fill('#wb-iban', 'OM81 0180 0000 0123 4567 891');
    await page.dispatchEvent('#wb-amt', 'input'); await page.dispatchEvent('#wb-acc', 'input'); await page.dispatchEvent('#wb-iban', 'input'); await wait(900); await page.click('#wb-next');
    assert.match(await page.locator('#wb-e-iban').innerText(), /IBAN/);
    await page.fill('#wb-iban', ''); await page.dispatchEvent('#wb-iban', 'input'); await wait(900); await page.click('#wb-next');
    await page.waitForSelector('#withdraw-confirm.active #wr-go'); await page.check('#wr-ok'); await page.click('#wr-go'); await page.waitForTimeout(500);
    assert.equal(await page.locator('.ps #ps-dots').count(), 0, '16.4.0 : 25 OMR (~65 USD) — aucun code sous 500 USD');
    await page.waitForSelector('#withdraw-track.active .wd-steps', { timeout: 8000 }); await wait(800);
    const a = (await calls(page, 'withdraw_request'))[0].args;
    assert.equal(a.p_amount, 25); assert.equal(a.p_bank_code, 'BMCT'); assert.equal(a.p_iban, null); assert.ok(a.p_key.length >= 16);
    assert.match(await page.locator('#withdraw-track').innerText(), /WD-TEST0001/);
  });
  await ok('IBAN : contrôle mod-97 (valide accepté, faux refusé)', async () => {
    assert.equal(await page.evaluate(() => OMXWithdraw.ibanOk('GB82 WEST 1234 5698 7654 32')), true);
    assert.equal(await page.evaluate(() => OMXWithdraw.ibanOk('GB82 WEST 1234 5698 7654 33')), false);
  });
  await ok('la liste des retraits montre les deux demandes avec leur vrai statut', async () => {
    await page.evaluate(() => R.go('withdraw', { force: true })); await wait(1200);
    assert.equal(await page.locator('#withdraw .wd-item').count(), 2);
    assert.match(await page.locator('#withdraw').innerText(), /Annulé[\s\S]*|En attente/);
  });
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900 });
  console.log('\n[envoi interne — confirmé par l’administrateur]');
  await ok('envoi : destinataire trouvé par le serveur, contrôles, code PIN, enregistré EN ATTENTE (jamais « crédité »)', async () => {
    await page.evaluate(() => R.go('wallet')); await wait(700);
    await page.click('#wallet [data-nav="send-internal"]'); await page.waitForSelector('#send-internal.active #si-to');
    await page.fill('#si-to', 'FRD-NOBODY'); await page.dispatchEvent('#si-to', 'blur'); await wait(700);
    assert.match(await page.locator('#si-e-to').innerText(), /Aucun compte DYT/);
    await page.fill('#si-to', 'FRD-ZZ1122'); await page.dispatchEvent('#si-to', 'blur'); await wait(700);
    assert.match(await page.locator('#si-who').innerText(), /Salim Al Harthy/);
    await page.click('[data-si-src="USDT/tron"]'); await wait(500);
    await page.fill('#si-to', 'FRD-ZZ1122'); await page.dispatchEvent('#si-to', 'blur'); await wait(600);
    await page.fill('#si-amt', '300'); await page.click('#si-next'); await wait(500);
    assert.match(await page.locator('#si-e-amt').innerText(), /dépassent/);
    await page.fill('#si-amt', '10'); await wait(900); await page.click('#si-next');
    await page.waitForSelector('#send-internal-review.active #si-go');
    assert.match(await page.locator('#send-internal-review').innerText(), /Salim Al Harthy[\s\S]*FRD-ZZ1122/);
    await page.click('#si-go'); await pin(page);
    await page.waitForSelector('#send-internal-done.active .si-steps', { timeout: 8000 }); await wait(700);
    const c = (await calls(page, 'transfer_crypto'))[0].args;
    assert.equal(c.p_to_yor_id, 'YOR-ZZ1122'); assert.equal(c.p_asset, 'USDT'); assert.equal(c.p_network, 'tron'); assert.equal(c.p_amount, 10); assert.equal(c.p_pin_grant, 'grant-1'); assert.ok(c.p_idempotency_key.length >= 16);
    const txt = await page.locator('#send-internal-done').innerText();
    assert.match(txt, /En cours/); assert.match(txt, /OMT48215555/); assert.doesNotMatch(txt, /Transfert confirmé|Crédité|confirmation|administrateur|DYT confirme/i); assert.equal(await page.locator('#send-internal-done .omx-prog i').count(), 3);
  });
  await ok('quand l’administrateur confirme : l’écran et l’historique passent à « Transfert confirmé »', async () => {
    await page.evaluate(async () => { window.__txs()[0].status = 'CONFIRMED'; await AuthEngine.hydrateRuntime(); R.go('send-internal-done', { force: true }); }); await wait(600);
    assert.match(await page.locator('#send-internal-done').innerText(), /Transfert confirmé/); assert.equal(await page.locator('#send-internal-done .omx-prog').count(), 0);
    await page.evaluate(() => R.go('history', { force: true })); await wait(700);
    assert.match(await page.locator('#history').innerText(), /Salim Al Harthy/);
  });
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
