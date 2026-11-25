/* Crédit téléphonique (service Edge credit-topup) — règles pures : message exact du propriétaire, lecture de la réponse du fournisseur,
   nom d'expéditeur, erreurs, adresse Infobip. Aucune réponse inconnue ne doit jamais valoir « réussi ». */
import assert from 'node:assert/strict';
import { buildSmsText, formatAmount, infobipResult, infobipUrl, mapDbError, normalizeOperator, parseProvider, senderName } from '../../supabase/functions/credit-topup/lib.ts';
let failed = 0;
const ok = (n, f) => { try { f(); console.log('  ok  ', n); } catch (e) { failed++; console.log('  FAIL', n, '\n      ', String(e.message).split('\n').slice(0, 3).join(' | ')); } };

ok('le message du propriétaire, mot pour mot', () => {
  assert.equal(buildSmsText(1, '96892888435', '872499275195989578'), 'تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: 872499275195989578).');
  assert.equal(buildSmsText('2.5', '96871234567', 'AB-1234'), 'تمت عملية تحويل مبلغ 2.500 ريال بنجاح إلى الرقم 96871234567. (TID: AB-1234).');
});
ok('pas de message sur un numéro ou un TID invalide', () => {
  assert.throws(() => buildSmsText(1, '12345', '872499275195989578'));
  assert.throws(() => buildSmsText(1, '96892888435', ''));
  assert.throws(() => buildSmsText(0, '96892888435', '872499275195989578'));
  assert.throws(() => formatAmount('abc'));
});
ok('réponse « réussi » du fournisseur : TID réel exigé', () => {
  assert.deepEqual(parseProvider(200, { status: 'SUCCESS', tid: '872499275195989578' }), { kind: 'success', tid: '872499275195989578', ref: '' });
  assert.equal(parseProvider(200, { status: 'completed', transactionId: 'TX-99881' }).kind, 'success');
  assert.equal(parseProvider(201, { status: 'OK', transaction_id: 123456789 }).kind, 'success');
  assert.equal(parseProvider(200, { status: 'SUCCESS' }).kind, 'unknown');                      // réussi SANS TID : jamais confirmé
  assert.equal(parseProvider(200, { status: 'SUCCESS', tid: 'x' }).kind, 'unknown');             // TID inutilisable
  assert.equal(parseProvider(200, { status: 'SUCCESS', tid: 'a b c d' }).kind, 'unknown');
});
ok('refus net seulement quand le fournisseur refuse vraiment', () => {
  assert.equal(parseProvider(200, { status: 'FAILED' }).kind, 'failed');
  assert.equal(parseProvider(200, { status: 'rejected' }).kind, 'failed');
  assert.equal(parseProvider(400, {}).kind, 'failed');
  assert.equal(parseProvider(422, null).kind, 'failed');
});
ok('tout le reste est « incertain » : jamais confirmé, jamais rendu à l\'aveugle', () => {
  for (const [h, b] of [[500, {}], [502, null], [503, { status: 'SUCCESS', tid: '872499275195989578' }], [408, {}], [429, {}], [200, {}], [200, null], [200, { status: 'PENDING' }], [301, {}]])
    assert.equal(parseProvider(h, b).kind, 'unknown', `${h} ${JSON.stringify(b)}`);
});
ok('opérateurs : seulement Omantel, Ooredoo, Vodafone', () => {
  assert.equal(normalizeOperator('ooredoo'), 'OOREDOO'); assert.equal(normalizeOperator(' Omantel '), 'OMANTEL'); assert.equal(normalizeOperator('vodafone'), 'VODAFONE');
  assert.equal(normalizeOperator('zain'), null); assert.equal(normalizeOperator(''), null); assert.equal(normalizeOperator(undefined), null);
});
ok('nom d\'expéditeur : jamais « OM Wallet », ni un opérateur, ni une banque', () => {
  assert.equal(senderName(undefined), 'TBAUTH'); assert.equal(senderName('Omanbaking'), 'Omanbaking'); assert.equal(senderName('OMPAY'), 'OMPAY'); assert.equal(senderName('MonNom'), 'MonNom');
  for (const bad of ['OMWallet', 'omwallet', 'Ooredoo', 'OMANTEL', 'Vodafone', 'BankMuscat', 'OM Wallet', 'TropLongNomExp', 'a-b', '']) assert.equal(senderName(bad), null, bad);
});
ok('erreurs de la base : codes connus seulement, jamais le message brut', () => {
  assert.equal(mapDbError('ERROR: insufficient_balance'), 'insufficient_balance'); assert.equal(mapDbError('limit_daily'), 'limit_daily'); assert.equal(mapDbError('pin_required'), 'pin_required');
  assert.equal(mapDbError('relation "x" does not exist'), 'server_error'); assert.equal(mapDbError(null), 'server_error');
});
ok('Infobip : seulement https://<compte>.api.infobip.com', () => {
  assert.equal(infobipUrl('abc12.api.infobip.com'), 'https://abc12.api.infobip.com/sms/2/text/advanced');
  for (const bad of ['http://abc.api.infobip.com', 'https://evil.example.com', 'https://abc.api.infobip.com.evil.com', 'https://abc.api.infobip.com/x', 'https://u:p@abc.api.infobip.com', '', null]) assert.equal(infobipUrl(bad), null, String(bad));
});
ok('SMS : « accepté » seulement si Infobip l\'a vraiment accepté', () => {
  assert.deepEqual(infobipResult(true, { messages: [{ messageId: 'm1', status: { groupName: 'PENDING' } }] }), { status: 'accepted', id: 'm1' });
  assert.equal(infobipResult(true, { messages: [{ messageId: 'm1', status: { groupName: 'REJECTED' } }] }).status, 'failed');
  assert.equal(infobipResult(false, null).status, 'failed');
  assert.equal(infobipResult(true, {}).status, 'processing');
});
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
