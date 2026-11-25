/* Transfert de crédit — e-mails (14.10.0). La fonction Edge send-email est compilée avec un FAUX client Supabase (aucun réseau, aucune base) :
   - le message de confirmation est EXACTEMENT celui du propriétaire en arabe (vrai montant, vrai numéro, TID), et son équivalent fr / en ;
   - l'e-mail de confirmation n'est jamais construit tant que l'opération n'est pas CONFIRMED ET débitée au grand livre, ni pour une autre personne ;
   - l'e-mail de l'administrateur porte l'opérateur et le numéro, avec les trois boutons ; un transfert ordinaire garde son e-mail d'avant.
   usage : node tests/ux/topup-email.test.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const esbuild = createRequire(path.join(root, 'tools') + '/')('esbuild');
let failed = 0;
const ok = async (name, fn) => { try { await fn(); console.log('  ok  ', name); } catch (e) { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 5).join(' | ')); } };

/* ---- the pure part ---- */
const T = await import(pathToFileURL(path.join(root, 'supabase/functions/send-email/topup.ts')).href);
const OWNER = 'تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: 872499275195989578).';
console.log('\n[message]');
await ok('arabic: exactly the owner\'s message (amount with 3 decimals, number with 968, TID)', async () => {
  assert.equal(T.topupMessage('ar', 1, '96892888435', '872499275195989578'), OWNER);
  assert.equal(T.topupMessage('ar', '1', '+968 9288 8435', ' 872499275195989578 '), OWNER, 'typed variants give the same text');
  assert.equal(T.topupMessage('ar', 12.5, '96871234567', '216935522390325280'), 'تمت عملية تحويل مبلغ 12.500 ريال بنجاح إلى الرقم 96871234567. (TID: 216935522390325280).');
});
await ok('arabic with isolates (e-mail display): the same visible text', async () => {
  assert.equal(T.topupMessage('ar', 1, '96892888435', '872499275195989578', true).replace(/[⁦⁩]/g, ''), OWNER);
});
await ok('french and english carry the same three values', async () => {
  assert.equal(T.topupMessage('fr', 1, '96892888435', '872499275195989578'), 'Le transfert de crédit de 1,000 OMR vers le numéro 96892888435 a été effectué avec succès. (TID : 872499275195989578).');
  assert.equal(T.topupMessage('en', 2.5, '96892888435', '872499275195989578'), 'The credit transfer of OMR 2.500 to number 96892888435 was completed successfully. (TID: 872499275195989578).');
});
await ok('display helpers', async () => {
  assert.equal(T.fmtOmanPhone('96892888435'), '+968 9288 8435');
  assert.equal(T.fmtOmanPhone('12345'), '12345');
  assert.equal(T.operatorName('OOREDOO'), 'Ooredoo'); assert.equal(T.operatorName('omantel'), 'Omantel'); assert.equal(T.operatorName('VODAFONE'), 'Vodafone');
  assert.equal(T.omr3(0.5), '0.500'); assert.equal(T.omr3('20'), '20.000');
});

/* ---- the whole function, with a fake database ---- */
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'send-email-')), 'fn.mjs');
await esbuild.build({
  entryPoints: [path.join(root, 'supabase/functions/send-email/index.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
  plugins: [{ name: 'stub', setup(b) {
    b.onResolve({ filter: /^npm:@supabase\/supabase-js/ }, () => ({ path: 'supabase-stub', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const createClient = () => globalThis.__sb;', loader: 'js' }));
  } }],
  banner: { js: 'globalThis.Deno = { env: { get: (k) => (k === "SUPABASE_URL" ? "http://localhost" : k === "SUPABASE_SERVICE_ROLE_KEY" ? "x" : undefined) }, serve: () => {} };' },
  footer: { js: 'globalThis.__fn = { build, T };' },
});
const DB = { transactions: [], ledger_entries: [] };
const chain = (table) => { let rows = DB[table] || []; const q = { select: () => q, eq: (k, v) => { rows = rows.filter(r => r[k] === v); return q; }, maybeSingle: async () => ({ data: rows[0] ?? null }), then: (res) => res({ data: rows }) }; return q; };
globalThis.__sb = { from: chain, rpc: async (name) => name === 'issue_admin_action_links' ? { data: { confirm: 'tok-c', reject: 'tok-r', pause: 'tok-p' }, error: null } : { data: null, error: null } };
await import(pathToFileURL(out).href);
const { build } = globalThis.__fn;

const U = 'user-1', TX = 'tx-1';
const tx = (over = {}) => ({ id: TX, reference: 'OMT01031008', kind: 'CREDIT_TOPUP', amount: 1, asset: 'OMR', status: 'CONFIRMED', confirmed_at: '2026-11-27T10:15:30Z', sender_id: U,
  meta: { confirm: 'ADMIN', topup: { operator: 'OOREDOO', phone: '96892888435', tid: '872499275195989578', tidSource: 'OPERATOR' } }, ...over });
const confirmedLog = { id: 'l1', email_type: 'CREDIT_TOPUP_CONFIRMED', user_id: U, transaction_id: TX, recipient_email: 'a@example.invalid', created_at: '2026-11-27T10:15:31Z', attempts: 0, payload: {} };

console.log('\n[e-mail de confirmation]');
for (const lang of ['ar', 'fr', 'en']) {
  await ok(lang + ': the confirmation e-mail carries the message, the operator, the number, the TID, the amount', async () => {
    DB.transactions = [tx()]; DB.ledger_entries = [{ transaction_id: TX, user_id: U, delta: -1 }];
    const b = await build(confirmedLog, lang);
    assert.ok(!('skip' in b), JSON.stringify(b));
    const plain = b.html.replace(/<[^>]+>/g, ' ').replace(/[⁦⁩]/g, '').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
    const msg = T.topupMessage(lang, 1, '96892888435', '872499275195989578');
    assert.ok(plain.includes(msg), 'message missing: ' + msg + '\n' + plain.slice(0, 600));
    for (const v of ['Ooredoo', '+968 9288 8435', '872499275195989578', lang === 'fr' ? '1,000' : '1.000', 'OMT01031008']) assert.ok(plain.includes(v), v + ' missing');
    assert.match(b.html, lang === 'ar' ? /dir="rtl"/ : /dir="ltr"/);
    assert.ok(b.subject.includes('OMT01031008') && /OM Wallet/.test(b.subject));
    assert.ok(b.text.includes(msg), 'plain-text part has the message');
  });
}
await ok('arabic subject and title', async () => {
  DB.transactions = [tx()]; DB.ledger_entries = [{ transaction_id: TX, user_id: U, delta: -1 }];
  const b = await build(confirmedLog, 'ar'); assert.match(b.subject, /تم تحويل الرصيد/);
});
await ok('never before the confirmation: pending is retried, rejected is skipped', async () => {
  DB.ledger_entries = [];
  DB.transactions = [tx({ status: 'PENDING', confirmed_at: null })]; let b = await build(confirmedLog, 'fr'); assert.equal(b.skip, 'not_confirmed_PENDING'); assert.equal(b.retry, true);
  DB.transactions = [tx({ status: 'REJECTED', confirmed_at: null })]; b = await build(confirmedLog, 'fr'); assert.equal(b.skip, 'not_confirmed_REJECTED'); assert.ok(!b.retry);
});
await ok('never before the debit is on the ledger', async () => {
  DB.transactions = [tx()]; DB.ledger_entries = [];
  const b = await build(confirmedLog, 'fr'); assert.equal(b.skip, 'ledger_missing'); assert.equal(b.retry, true);
});
await ok('only to the person who sent it; only for a credit transfer; no TID, no e-mail', async () => {
  DB.ledger_entries = [{ transaction_id: TX, user_id: U, delta: -1 }];
  DB.transactions = [tx()]; let b = await build({ ...confirmedLog, user_id: 'someone-else' }, 'fr'); assert.equal(b.skip, 'not_the_owner');
  DB.transactions = [tx({ kind: 'FIAT_TRANSFER' })]; b = await build(confirmedLog, 'fr'); assert.equal(b.skip, 'not_a_credit_transfer');
  DB.transactions = [tx({ meta: { confirm: 'ADMIN', topup: { operator: 'OOREDOO', phone: '96892888435' } } })]; b = await build(confirmedLog, 'fr'); assert.equal(b.skip, 'details_missing');
});

console.log('\n[e-mail de l\'administrateur]');
const actLog = (payload) => ({ id: 'l2', email_type: 'ADMIN_TX_ACTION', user_id: 'admin-1', transaction_id: TX, recipient_email: 'admin@example.invalid', created_at: '2026-11-27T10:00:00Z', attempts: 0,
  payload: { reference: 'OMT01031008', kind: 'CREDIT_TOPUP', amount: 1, asset: 'OMR', network: null, note: 'Credit transfer Ooredoo 96892888435', sender: 'Amina Test', receiver: 'Amina Test', created_at: '2026-11-27T10:00:00Z',
    topup: { operator: 'OOREDOO', phone: '96892888435' }, ...payload } });
for (const lang of ['ar', 'fr', 'en']) {
  await ok(lang + ': the administrator sees the operator and the number, and the three buttons', async () => {
    const b = await build(actLog({}), lang);
    assert.ok(!('skip' in b), JSON.stringify(b));
    const plain = b.html.replace(/<[^>]+>/g, ' ').replace(/[⁦⁩]/g, '').replace(/\s+/g, ' ');
    for (const v of ['Ooredoo', '+968 9288 8435', lang === 'fr' ? '1,000' : '1.000', 'Amina Test']) assert.ok(plain.includes(v), v + ' missing: ' + plain.slice(0, 500));
    assert.equal((b.html.match(/admin-action#t=tok-/g) || []).length, 3, 'three personal buttons');
    assert.ok(/credit|crédit|رصيد/i.test(b.subject + plain), 'it says it is a credit transfer');
    assert.ok(!plain.includes('Network') && !plain.includes('Réseau'), 'no crypto rows');
  });
}
await ok('an ordinary transfer keeps its e-mail (From / To rows, no operator)', async () => {
  const b = await build(actLog({ kind: 'FIAT_TRANSFER', topup: undefined, receiver: 'Salim Test', note: 'merci' }), 'en');
  const plain = b.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.ok(plain.includes('Salim Test') && plain.includes('merci') && !plain.includes('Operator'), plain.slice(0, 400));
  assert.match(b.subject, /Transfer to review/);
});
await ok('a closed transaction gets no buttons (already decided)', async () => {
  const saved = globalThis.__sb.rpc; globalThis.__sb.rpc = async () => ({ data: null, error: null });
  try { const b = await build(actLog({}), 'fr'); assert.equal(b.skip, 'already_decided_or_not_admin'); } finally { globalThis.__sb.rpc = saved; }
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
