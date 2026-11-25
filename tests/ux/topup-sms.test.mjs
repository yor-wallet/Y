/* Transfert de crédit — SMS Infobip (14.10.0). La fonction Edge topup-notice est compilée avec un FAUX client Supabase et un FAUX réseau :
   - aucun SMS sans jeton interne valide, ni pour une opération non confirmée, ni deux fois pour la même ;
   - l'expéditeur reçoit le message exact du propriétaire (dans sa langue), le numéro crédité le même en arabe ;
   - le nom d'expéditeur n'est jamais un nom de banque ; refusé par la route → un second essai avec le nom par défaut du compte ;
   - le résultat est écrit sans aucun numéro de téléphone ; un échec ne lève rien.
   usage : node tests/ux/topup-sms.test.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const esbuild = createRequire(path.join(root, 'tools') + '/')('esbuild');
let failed = 0;
const ok = async (name, fn) => { try { await fn(); console.log('  ok  ', name); } catch (e) { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 6).join(' | ')); } };
const OWNER = 'تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: 872499275195989578).';

/* ---- pure helpers ---- */
const S = await import(pathToFileURL(path.join(root, 'supabase/functions/topup-notice/sms.ts')).href);
console.log('\n[helpers]');
await ok('numbers: +968, 00968, 8 local digits; anything else refused', async () => {
  assert.equal(S.e164Digits('+96892888435'), '96892888435'); assert.equal(S.e164Digits('0096892888435'), '96892888435'); assert.equal(S.e164Digits('92888435'), '96892888435');
  assert.equal(S.e164Digits('+223 76 12 34 56'), '22376123456'); assert.equal(S.e164Digits('abc'), null); assert.equal(S.e164Digits(''), null); assert.equal(S.e164Digits('1234'), null); assert.equal(S.e164Digits(null), null);
});
await ok('sender name: default OMWallet; a bank name or a bad value is never used', async () => {
  assert.equal(S.topupSender(undefined), 'OMWallet'); assert.equal(S.topupSender('OMWallet'), 'OMWallet'); assert.equal(S.topupSender('MyBrand'), 'MyBrand');
  for (const bad of ['Omanbaking', 'Bank Muscat', 'BankMuscat', 'mtqbanking', 'NBO', 'Visa', 'x', 'way too long name', 'a b c']) assert.equal(S.topupSender(bad), 'OMWallet', bad);
});
await ok('infobip request: v3 endpoint, key and host checked, sender optional', async () => {
  const r = S.infobipRequest({ key: 'abcdef0123456789abcdef', base: 'https://abc123.api.infobip.com/' }, '96892888435', 'x', 'OMWallet');
  assert.equal(r.url, 'https://abc123.api.infobip.com/sms/3/messages'); assert.match(r.headers.Authorization, /^App abcdef/);
  assert.deepEqual(JSON.parse(r.body), { messages: [{ destinations: [{ to: '96892888435' }], content: { text: 'x' }, sender: 'OMWallet' }] });
  assert.ok(!('sender' in JSON.parse(S.infobipRequest({ key: 'abcdef0123456789abcdef', base: 'https://abc123.api.infobip.com' }, '96892888435', 'x').body).messages[0]));
  assert.match(S.infobipRequest({ key: '', base: 'https://a.api.infobip.com' }, '96892888435', 'x').error, /missing/);
  assert.match(S.infobipRequest({ key: 'curl -H whatever', base: 'https://a.api.infobip.com' }, '96892888435', 'x').error, /not a valid key/);
  assert.match(S.infobipRequest({ key: 'abcdef0123456789abcdef', base: 'https://evil.example.com' }, '96892888435', 'x').error, /INFOBIP_BASE_URL/, 'the key never goes to another host');
  assert.equal(S.infobipRequest({ key: 'abcdef0123456789abcdef', base: 'https://a.api.infobip.com' }, '123', 'x').error, 'invalid_phone');
});
await ok('provider answers: accepted / delivered = sent; credits, auth, sender, rejection are told apart', async () => {
  assert.deepEqual(S.classify(200, JSON.stringify({ messages: [{ messageId: 'm1', status: { groupId: 1 } }] })), { kind: 'sent', messageId: 'm1' });
  assert.equal(S.classify(200, JSON.stringify({ messages: [{ messageId: 'm2', status: { groupId: 3 } }] })).kind, 'sent');
  assert.equal(S.classify(200, JSON.stringify({ messages: [{ status: { groupId: 5, name: 'REJECTED_SENDER', description: 'sender not registered' } }] })).kind, 'sender');
  assert.match(S.classify(200, JSON.stringify({ messages: [{ status: { groupId: 5, name: 'REJECTED', description: 'insufficient balance' } }] })).reason, /sms_credits_missing/);
  assert.match(S.classify(401, JSON.stringify({ requestError: { serviceException: { text: 'Invalid login details' } } })).reason, /provider_auth/);
  assert.equal(S.classify(400, JSON.stringify({ requestError: { serviceException: { text: 'sender not allowed' } } })).kind, 'sender');
  assert.match(S.classify(500, 'oops').reason, /infobip 500/);
});

/* ---- the function, with a fake database and a fake network ---- */
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'topup-notice-')), 'fn.mjs');
await esbuild.build({
  entryPoints: [path.join(root, 'supabase/functions/topup-notice/index.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
  plugins: [{ name: 'stub', setup(b) { b.onResolve({ filter: /^npm:@supabase\/supabase-js/ }, () => ({ path: 'supabase-stub', namespace: 'stub' })); b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const createClient = () => globalThis.__sb;', loader: 'js' })); } }],
  banner: { js: 'globalThis.Deno = { env: { get: (k) => (globalThis.__env || {})[k] }, serve: (h) => { globalThis.__handler = h; } };' },
});
const TOKEN = 'internal-token-0123456789';
const DB = { cfg: { token: TOKEN }, tx: null, profile: { phone: '+96877986533' }, prefs: { language: 'fr' }, claim: true, done: [] };
globalThis.__env = { INFOBIP_API_KEY: 'abcdef0123456789abcdef', INFOBIP_BASE_URL: 'https://abc123.api.infobip.com' };
const chain = (table) => { const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: table === 'notice_dispatch_cfg' ? DB.cfg : table === 'transactions' ? DB.tx : table === 'profiles' ? DB.profile : table === 'user_docs' ? (DB.prefs ? { data: DB.prefs } : null) : null }) }; return q; };
globalThis.__sb = { from: chain, rpc: async (name, args) => { if (name === '_topup_sms_claim') { const c = DB.claim; DB.claim = false; return { data: c, error: null }; } if (name === '_topup_sms_done') { DB.done.push(args.p_patch); return { data: null, error: null }; } return { data: null, error: null }; } };
let calls = [], answer = () => ({ status: 200, text: JSON.stringify({ messages: [{ messageId: 'msg-' + calls.length, status: { groupId: 1 } }] }) });
globalThis.fetch = async (url, init) => { const body = JSON.parse(init.body); calls.push({ url, body, auth: init.headers.Authorization }); const a = answer(calls.length, body); return { status: a.status, text: async () => a.text }; };
await import(pathToFileURL(out).href);
const handler = globalThis.__handler;
const TX = '0b7f5b3a-3c1e-4d3a-8f55-111111111111';
const confirmedTx = (over = {}) => ({ id: TX, kind: 'CREDIT_TOPUP', status: 'CONFIRMED', sender_id: 'u1', amount: 1, meta: { topup: { operator: 'OOREDOO', phone: '96892888435', tid: '872499275195989578' } }, ...over });
const call = (headers = { 'x-notice-token': TOKEN }, body = { tx_id: TX }) => handler(new Request('http://x/functions/v1/topup-notice', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }));
const reset = (over = {}) => { calls = []; DB.done = []; DB.claim = true; DB.tx = confirmedTx(); DB.profile = { phone: '+96877986533' }; DB.prefs = { language: 'fr' }; answer = () => ({ status: 200, text: JSON.stringify({ messages: [{ messageId: 'msg-' + calls.length, status: { groupId: 1 } }] }) }); Object.assign(DB, over); };

console.log('\n[fonction]');
await ok('no token, a wrong token, or a bad id: nothing is sent', async () => {
  reset(); assert.equal((await call({})).status, 401); assert.equal((await call({ 'x-notice-token': 'nope' })).status, 401); assert.equal((await call({ 'x-notice-token': TOKEN }, { tx_id: 'zzz' })).status, 400);
  assert.equal(calls.length, 0); assert.equal(DB.done.length, 0);
});
await ok('only a CONFIRMED credit transfer with its TID: pending, refunded, other kinds and missing TID are skipped', async () => {
  for (const tx of [confirmedTx({ status: 'PENDING' }), confirmedTx({ status: 'REFUNDED' }), confirmedTx({ kind: 'FIAT_TRANSFER' }), confirmedTx({ meta: { topup: { operator: 'OOREDOO', phone: '96892888435' } } }), null]) {
    reset({ tx }); const r = await (await call()).json(); assert.equal(r.status, 'SKIPPED'); assert.equal(calls.length, 0);
  }
});
await ok('confirmed: the sender gets the message in French, the credited number the owner\'s Arabic message, from OMWallet, through Infobip v3', async () => {
  reset(); const r = await (await call()).json();
  assert.deepEqual(r, { ok: true, status: 'SENT' }); assert.equal(calls.length, 2);
  const to = Object.fromEntries(calls.map((c) => [c.body.messages[0].destinations[0].to, c]));
  assert.ok(to['96877986533'] && to['96892888435']);
  assert.equal(to['96877986533'].body.messages[0].content.text, 'Le transfert de crédit de 1,000 OMR vers le numéro 96892888435 a été effectué avec succès. (TID : 872499275195989578).');
  assert.equal(to['96892888435'].body.messages[0].content.text, OWNER);
  for (const c of calls) { assert.equal(c.url, 'https://abc123.api.infobip.com/sms/3/messages'); assert.equal(c.body.messages[0].sender, 'OMWallet'); assert.match(c.auth, /^App abcdef/); }
  const p = DB.done[0]; assert.equal(p.status, 'SENT'); assert.equal(p.sender.status, 'SENT'); assert.equal(p.recipient.status, 'SENT'); assert.equal(p.provider, 'infobip'); assert.equal(p.senderId, 'OMWallet');
  assert.ok(!/9689|9687|\+968/.test(JSON.stringify(p)), 'no phone number is written to the database');
});
await ok('an Arabic-speaking sender gets exactly the owner\'s message too', async () => {
  reset({ prefs: { language: 'ar' } }); await call();
  assert.ok(calls.every((c) => c.body.messages[0].content.text === OWNER));
});
await ok('the confirmation phone chosen in Settings is used before the profile phone; English is supported', async () => {
  reset({ prefs: { language: 'en', confirmPhone: '91234567' } }); await call();
  const sms = calls.find((c) => c.body.messages[0].destinations[0].to === '96891234567'); assert.ok(sms, 'sent to the chosen number');
  assert.equal(sms.body.messages[0].content.text, 'The credit transfer of OMR 1.000 to number 96892888435 was completed successfully. (TID: 872499275195989578).');
});
await ok('one send per transfer: a second call (retry, sweep) does nothing', async () => {
  reset(); await call(); const n = calls.length; const r = await (await call()).json();
  assert.equal(r.status, 'ALREADY_HANDLED'); assert.equal(calls.length, n);
});
await ok('the sender and the credited number are the same line: one SMS', async () => {
  reset({ profile: { phone: '+96892888435' } }); await call(); assert.equal(calls.length, 1); assert.equal(DB.done[0].recipient.error, 'same_as_sender'); assert.equal(DB.done[0].status, 'SENT');
});
await ok('no phone for the sender: the credited number is still told, the gap is recorded', async () => {
  reset({ profile: { phone: null } }); await call(); assert.equal(calls.length, 1); assert.equal(DB.done[0].sender.error, 'no_sender_phone'); assert.equal(DB.done[0].status, 'SENT');
});
await ok('sender name refused by the route: one more try with the account\'s default name, no sender field', async () => {
  reset(); answer = (n, body) => body.messages[0].sender ? { status: 200, text: JSON.stringify({ messages: [{ status: { groupId: 5, name: 'REJECTED', description: 'sender not registered' } }] }) } : { status: 200, text: JSON.stringify({ messages: [{ messageId: 'ok' + n, status: { groupId: 1 } }] }) };
  const r = await (await call()).json(); assert.equal(r.status, 'SENT'); assert.equal(calls.length, 4); assert.equal(calls.filter((c) => c.body.messages[0].sender).length, 2); assert.equal(calls.filter((c) => !c.body.messages[0].sender).length, 2);
});
await ok('provider down, credits missing, key refused: the answer says FAILED, the reason is recorded, nothing throws', async () => {
  reset(); answer = () => ({ status: 200, text: JSON.stringify({ messages: [{ status: { groupId: 5, name: 'REJECTED', description: 'insufficient balance' } }] }) });
  let r = await (await call()).json(); assert.equal(r.status, 'FAILED'); assert.match(DB.done[0].sender.error, /sms_credits_missing/);
  reset(); answer = () => ({ status: 401, text: JSON.stringify({ requestError: { serviceException: { text: 'Invalid login details' } } }) });
  r = await (await call()).json(); assert.equal(r.status, 'FAILED'); assert.match(DB.done[0].recipient.error, /provider_auth/);
  reset(); globalThis.fetch = async () => { throw new Error('boom'); }; r = await (await call()).json(); assert.equal(r.status, 'FAILED'); assert.match(DB.done[0].sender.error, /network/);
});
await ok('one of the two refused: PARTIAL', async () => {
  const f = globalThis.fetch; reset();
  globalThis.fetch = async (url, init) => { const body = JSON.parse(init.body); calls.push({ body }); const bad = body.messages[0].destinations[0].to === '96892888435'; return { status: 200, text: async () => JSON.stringify({ messages: [{ messageId: 'm', status: bad ? { groupId: 5, name: 'REJECTED', description: 'unreachable' } : { groupId: 1 } }] }) }; };
  const r = await (await call()).json(); assert.equal(r.status, 'PARTIAL'); assert.equal(DB.done[0].sender.status, 'SENT'); assert.equal(DB.done[0].recipient.status, 'FAILED'); globalThis.fetch = f;
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
