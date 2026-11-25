/* Faux client Supabase pour le banc d'essai (tests/ux). Il remplace le script du CDN dans le navigateur de test UNIQUEMENT.
   Il ne contacte aucun serveur : toutes les données ci-dessous sont fictives. */
(function(){
  var FX = window.__FX || {};
  var NOW = Date.now(), H = 3600e3, D = 24 * H;
  var uid = '00000000-0000-4000-8000-000000000001';
  var profile = { id: uid, user_id: 'USR-TEST0001', yor_id: 'YOR-A1B2C3', email: 'amira.test@example.com', role: 'user', first_name: 'Amira', last_name: 'Al Said',
    phone: '+96891234567', country: 'OM', photo: null, kyc: { status: 'VERIFIED', level: 1, verifiedAt: NOW - 30 * D }, created_at: new Date(NOW - 90 * D).toISOString() };
  if (FX.admin) profile.role = 'admin';
  var payouts = [
    { id: '11111111-1111-4111-8111-111111111111', reference: 'YOR-PAYOUT1', status: 'PROCESSING', created_at: new Date(NOW - 2 * H).toISOString(), user_id: uid, yor_id: 'YOR-A1B2C3', full_name: 'Amira Al Said', phone: '+96891234567', amount: 25, dest_amount: 37300, dest_currency: 'XOF', rate: 1492, beneficiary_name: 'Aminata Traoré', beneficiary_phone: '+22376123456', provider: 'Orange Money', paid_ref: null, paid_at: null, reject_reason: null, notice_status: null, notice_error: null },
    { id: '22222222-2222-4222-8222-222222222222', reference: 'YOR-PAYOUT2', status: 'COMPLETED', created_at: new Date(NOW - 30 * H).toISOString(), user_id: uid, yor_id: 'YOR-A1B2C3', full_name: 'Amira Al Said', phone: '+96891234567', amount: 10, dest_amount: 14920, dest_currency: 'XOF', rate: 1492, beneficiary_name: 'Moussa Diallo', beneficiary_phone: '+22370112233', provider: 'Orange Money', paid_ref: 'MP221118.1205.C12345', paid_at: new Date(NOW - 29 * H).toISOString(), reject_reason: null, notice_status: 'FAILED', notice_error: 'sms_credits_missing: insufficient credit' }
  ];
  var quotes = {}, qn = 0;
  var tx = function(i, o){ return Object.assign({ id: 'tx-' + i, reference: 'YOR-TX' + (100000 + i), kind: 'FIAT_TRANSFER', direction: 'OUT', status: 'CONFIRMED', asset: 'OMR', amount: 10, fee: 0, total: 10,
    network: null, note: null, created_at: new Date(NOW - i * 7 * H).toISOString(), counterparty_name: 'Salim Al Harthy', counterparty_yor_id: 'YOR-ZZ1122', meta: {} }, o || {}); };
  var txs = FX.emptyTx ? [] : [
    tx(1, { direction: 'OUT', amount: 25.5, total: 25.5, counterparty_name: 'Salim Al Harthy' }),
    tx(2, { direction: 'IN', kind: 'ADMIN_DEPOSIT', amount: 300, total: 300, counterparty_name: 'Friendly Pay' }),
    tx(3, { direction: 'OUT', amount: 8.2, total: 8.2, counterparty_name: 'Maryam Al Balushi', status: 'PENDING' }),
    tx(4, { direction: 'IN', amount: 120, total: 120, counterparty_name: 'Khalid Al Rawahi' }),
    tx(5, { direction: 'OUT', amount: 64, total: 64, counterparty_name: 'Noor Al Lawati', status: 'FAILED' }),
    tx(6, { direction: 'OUT', amount: 15, total: 15, counterparty_name: 'Hamad Al Siyabi' }),
    tx(7, { direction: 'IN', amount: 45.75, total: 45.75, counterparty_name: 'Fatma Al Kindi' })
  ];
  var tables = {
    profiles: [profile],
    accounts: [{ id: 'acc-1', type: 'MAIN', name: 'Main OMR', currency: 'OMR', balance: FX.emptyTx ? 0 : 1284.5, available_balance: FX.emptyTx ? 0 : 1284.5, reserved_balance: 0, status: 'ACTIVE', country: 'OM', created_at: new Date(NOW - 90 * D).toISOString() },
      /* the retired CFA wallet: still in the database, never shown */
      { id: 'acc-xof', type: 'WEST_AFRICA', name: 'West Africa XOF', currency: 'XOF', balance: 850000, available_balance: 850000, reserved_balance: 0, status: 'ACTIVE', country: 'ML', created_at: new Date(NOW - 90 * D).toISOString() }],
    crypto_wallets: FX.emptyTx ? [] : [
      { id: 'w-btc', user_id: uid, asset: 'BTC', network: 'bitcoin', address: 'bc1qinternaltestaddress0000000000000000', balance: 0.01, available_balance: 0.01, locked_balance: 0 },
      { id: 'w-usdt', user_id: uid, asset: 'USDT', network: 'tron', address: 'TInternalTestAddress00000000000000', balance: 250, available_balance: 250, locked_balance: 0 }
    ],
    notifications: FX.emptyTx ? [] : [
      { id: 'n-1', type: 'TRANSFER_RECEIVED', title: 'Money received', message: 'You received OMR 120.000 from Khalid Al Rawahi', read: false, transaction_id: 'tx-4', data: { amount: 120, currency: 'OMR', from: 'Khalid Al Rawahi' }, created_at: new Date(NOW - 2 * H).toISOString() },
      { id: 'n-2', type: 'TRANSFER_SENT', title: 'Transfer sent', message: 'OMR 25.500 sent to Salim Al Harthy', read: true, transaction_id: 'tx-1', data: { amount: 25.5, currency: 'OMR', to: 'Salim Al Harthy' }, created_at: new Date(NOW - 9 * H).toISOString() }
    ],
    user_docs: [
      { user_id: uid, doc_name: 'preferences', data: { language: FX.lang || 'en', theme: FX.theme === 'none' ? undefined : (FX.theme || 'light'), notifications: true, hideBalances: false, vibration: true } },
      { user_id: uid, doc_name: 'security', data: {} }
    ],
    user_items: FX.emptyTx ? [] : [
      { user_id: uid, collection: 'cards', item_id: 'c1', data: { label: 'Everyday', number: '4242424242424242', holder: 'AMIRA AL SAID', expiry: '08/29', cvv: '123', theme: 'midnight', frozen: false } },
      { user_id: uid, collection: 'cards', item_id: 'c2', data: { label: 'Travel', number: '5555555555554444', holder: 'AMIRA AL SAID', expiry: '03/28', cvv: '456', theme: 'violet', frozen: true } },
      { user_id: uid, collection: 'contacts', item_id: 'ct1', data: { fullName: 'Salim Al Harthy', number: '+96899112233', digits: '99112233' } },
      { user_id: uid, collection: 'contacts', item_id: 'ct2', data: { fullName: 'Maryam Al Balushi', number: '+96898445566', digits: '98445566' } }
    ]
  };
  function Q(table){
    var rows = (tables[table] || []).slice(), single = false, mode = 'select';
    var api = {
      select: function(){ return api; },
      eq: function(k, v){ rows = rows.filter(function(r){ return r[k] === v || (k === 'collection' && r.collection === v) || k === 'id' && r.id === v || k === 'user_id'; }); return api; },
      order: function(){ return api; }, limit: function(){ return api; },
      maybeSingle: function(){ single = true; return api; }, single: function(){ single = true; return api; },
      upsert: function(){ mode = 'write'; return api; }, update: function(){ mode = 'write'; return api; }, delete: function(){ mode = 'write'; return api; }, insert: function(){ mode = 'write'; return api; },
      then: function(res, rej){
        var out = mode === 'write' ? { data: null, error: null } : { data: single ? (rows[0] || null) : rows, error: null };
        return Promise.resolve(out).then(res, rej);
      }
    };
    return api;
  }
  /* un filtre « doc_name » doit aussi s'appliquer */
  var origQ = Q;
  Q = function(table){
    var api = origQ(table), eq0 = api.eq;
    var rows = null;
    api.eq = function(k, v){
      if (k === 'doc_name' || k === 'item_id'){ var cur = api; cur.__f = (cur.__f || []); cur.__f.push([k, v]); return api; }
      return eq0(k, v);
    };
    var th = api.then;
    api.then = function(res, rej){
      return th.call(api, function(out){
        if (api.__f && out && out.data){
          var arr = Array.isArray(out.data) ? out.data : [out.data];
          arr = arr.filter(function(r){ return api.__f.every(function(f){ return r[f[0]] === f[1]; }); });
          out = { data: Array.isArray(out.data) ? arr : (arr[0] || null), error: null };
        }
        return res ? res(out) : out;
      }, rej);
    };
    return api;
  };
  var session = FX.signedOut ? null : { access_token: 'x', user: { id: uid, email: profile.email } };
  var listeners = [];
  /* DY (13.2.0) — behaves like the database functions: the guard answers BEFORE the PIN grant is looked at, records nothing, debits nothing */
  var dyS = { enabled: !!FX.dy, updatedAt: new Date(NOW - 5 * H).toISOString(), updatedBy: FX.dy ? 'Admin Test' : null, history: FX.dy ? [{ at: new Date(NOW - 5 * H).toISOString(), enabled: true, by: 'Admin Test' }] : [], blocked: 0 };
  var dyOverview = function(){ return { enabled: dyS.enabled, updatedAt: dyS.updatedAt, updatedBy: dyS.updatedBy, blocked24h: dyS.blocked, blockedTotal: dyS.blocked, history: dyS.history.slice() }; };
  var dyBlock = function(){ dyS.blocked++; return { ok: false, error: 'TRANSFER_UNAVAILABLE', blocked_by: 'DY' }; };
  window.__dyState = dyS;
  var wdB = [], wdC = [], wdEnabled = true;
  var acc = function(){ return tables.accounts[0]; };
  var adm = function(){ if (!FX.admin) throw { message: 'forbidden', code: '42501' }; };
  window.__wd = { bank: wdB, crypto: wdC };
  /* 14.1.0 — transactions waiting for the administrator (like admin_tx_list / admin_tx_confirm: one credit, one e-mail, never twice) */
  var txAdm = [
    { id: 'atx-1', reference: 'OMT48213999', kind: 'FIAT_TRANSFER', asset: 'OMR', network: null, amount: 12.5, status: 'PENDING', created_at: new Date(NOW - 20 * 60e3).toISOString(), confirmed_at: null,
      sender: { name: 'Salim Al Harthy', yor_id: 'YOR-ZZ1122', phone: '+96899112233' }, receiver: { name: 'Maryam Al Balushi', yor_id: 'YOR-MM3344', phone: '+96898445566', has_email: true }, email: null },
    { id: 'atx-2', reference: 'OMT48214001', kind: 'CRYPTO_TRANSFER', asset: 'USDT', network: 'tron', amount: 40, status: 'PENDING', created_at: new Date(NOW - 5 * 60e3).toISOString(), confirmed_at: null,
      sender: { name: 'Khalid Al Rawahi', yor_id: 'YOR-KK5566', phone: null }, receiver: { name: 'Noor Al Lawati', yor_id: 'YOR-NN7788', phone: null, has_email: false }, email: null }
  ];
  window.__txAdm = txAdm; window.__txs = function(){ return txs; }; window.__txCredits = {}; window.__txMails = {};
  var rpcs = {
    dy_status: function(){ return { enabled: dyS.enabled, updatedAt: dyS.updatedAt }; },
    admin_console_stats: function(){ if (!FX.admin) throw { message: 'forbidden', code: '42501' }; return { users: 21, transfers_total: 220, transactions_today: 2, balance_omr: 1284.5 }; },
    admin_dy_overview: function(){ if (!FX.admin) throw { message: 'forbidden', code: '42501' }; return dyOverview(); },
    admin_dy_set: function(a){ if (!FX.admin) throw { message: 'forbidden', code: '42501' }; if (typeof a.p_enabled !== 'boolean') throw { message: 'invalid_value', code: '22023' };
      if (dyS.enabled !== a.p_enabled){ dyS.enabled = a.p_enabled; dyS.updatedAt = new Date().toISOString(); dyS.updatedBy = 'Amira Al Said'; dyS.history.unshift({ at: dyS.updatedAt, enabled: a.p_enabled, by: 'Amira Al Said' }); }
      return dyOverview(); },
    beneficiary_lookup: function(a){ return FX.dyName && a.p_phone === '+96898765432' ? { found: true, name: FX.dyName } : { found: false }; },
    my_transactions: function(){ return txs; },
    pin_status: function(){ return { has_pin: true, locked: false }; },
    verify_pin: function(){ if (window.__dyFlipOnPin) dyS.enabled = true; return { ok: true, grant: 'grant-1' }; },
    set_pin: function(){ return { ok: true }; },
    find_user_by_yor_id: function(a){ return String(a && a.p_yor_id || '').toUpperCase() === 'YOR-ZZ1122' ? [{ yor_id: 'YOR-ZZ1122', display_name: 'Salim Al Harthy', country: 'OM', photo: null }] : []; },
    /* 14.5 — swap / Spot market order: the quote is used once, the amount paid is held, the operation is PENDING; nothing is credited */
    swap_execute: function(a){
      if (FX.swapOff) throw { message: 'Could not find the function public.swap_execute', code: 'PGRST202' };
      if (!a.p_pin_grant) throw { message: 'pin_required', code: '42501' };
      var q = quotes[a.p_quote]; if (!q) throw { message: 'quote_not_found', code: 'P0002' };
      if (q.used) throw { message: 'quote_used', code: '22023' };
      if (Date.parse(q.expires_at) <= Date.now()) throw { message: 'quote_expired', code: '22023' };
      var w = tables.crypto_wallets.filter(function(x){ return x.asset === q.from_asset && x.network === q.from_network; })[0];
      if (!w || w.available_balance < q.from_amount) throw { message: 'insufficient_balance', code: '23514' };
      w.available_balance -= q.from_amount; w.locked_balance = (w.locked_balance || 0) + q.from_amount; q.used = true;
      txs.unshift(tx(0, { id: 'tx-sw' + q.id, reference: 'OMT4821' + (7000 + qn), kind: 'CRYPTO_SWAP', direction: 'OUT', status: 'PENDING', asset: q.from_asset, network: q.from_network, amount: q.from_amount, total: q.from_amount,
        counterparty_name: null, created_at: new Date().toISOString(), meta: { confirm: 'ADMIN', swap: { to_asset: q.to_asset, to_network: q.to_network, to_amount: q.to_amount, price: q.price } } }));
      return { ok: true, transaction_id: 'tx-sw' + q.id, reference: 'OMT4821' + (7000 + qn), status: 'PENDING', from_asset: q.from_asset, from_amount: q.from_amount, to_asset: q.to_asset, to_amount: q.to_amount, price: q.price };
    },
    /* 15.0 — credit transfer, administrator only: confirmed right away, no wallet movement, the SMS is sent by the server */
    admin_topup_send: function(a){
      if (!FX.admin) throw { message: 'forbidden', code: '42501' };
      (window.__topupCalls = window.__topupCalls || []).push(a);
      if (FX.topup === 'dup') throw { message: 'tid_in_use', code: '22023' };
      var n = window.__topupCalls.length, tid = a.p_tid || ('84032260219923' + (1000 + n)), ref = 'OMT0141' + (7000 + n), amt = Number(a.p_amount);
      txs.unshift(tx(0, { id: 'tx-tp' + n, reference: ref, kind: 'CREDIT_TOPUP', direction: 'OUT', status: 'CONFIRMED', asset: 'OMR', amount: amt, total: amt, counterparty_name: null, counterparty_yor_id: null, created_at: new Date().toISOString(),
        meta: { confirm: 'DIRECT', topup: { operator: a.p_operator, operatorName: a.p_operator === 'OOREDOO' ? 'Ooredoo' : a.p_operator === 'OMANTEL' ? 'Omantel' : 'Vodafone', phone: a.p_phone, tid: tid } } }));
      return { ok: true, transaction_id: 'tx-tp' + n, reference: ref, status: 'CONFIRMED', operator: a.p_operator, phone: a.p_phone, amount: amt, tid: tid };
    },
    /* 14.2 — internal crypto send: recorded PENDING (amount reserved), credited only when the administrator confirms */
    transfer_crypto: function(a){
      if (!a.p_pin_grant) throw { message: 'pin_required', code: '42501' };
      if (String(a.p_to_yor_id).toUpperCase() !== 'YOR-ZZ1122') throw { message: 'recipient_not_found', code: 'P0002' };
      var w = tables.crypto_wallets.filter(function(x){ return x.asset === a.p_asset && x.network === a.p_network; })[0];
      if (!w || w.available_balance < Number(a.p_amount)) throw { message: 'insufficient_balance', code: '23514' };
      w.available_balance -= Number(a.p_amount); w.locked_balance = (w.locked_balance || 0) + Number(a.p_amount);
      txs.unshift(tx(0, { id: 'tx-si1', reference: 'OMT48215555', kind: 'CRYPTO_TRANSFER', direction: 'OUT', status: 'PENDING', asset: a.p_asset, network: a.p_network, amount: Number(a.p_amount), total: Number(a.p_amount), counterparty_name: 'Salim Al Harthy', meta: { confirm: 'ADMIN' } }));
      return { ok: true, transaction_id: 'tx-si1', reference: 'OMT48215555', status: 'PENDING', amount: Number(a.p_amount), asset: a.p_asset, network: a.p_network, receiver: { yor_id: 'YOR-ZZ1122', name: 'Salim Al Harthy' } }; },
    transfer_fiat: function(){ if (dyS.enabled) return dyBlock(); return { ok: true }; },
    fiat_send_external: function(a){
      if (dyS.enabled) return dyBlock();
      if (!a.p_pin_grant) throw { message: 'pin_required' };
      var RATES = { OMR: 1, XOF: 1492 }, r = RATES[a.p_dest_currency] || 1, amt = Number(a.p_amount);
      var res = { ok: true, transaction_id: 'tx-new', reference: 'YOR-TXNEW01', status: 'CONFIRMED', amount: amt, fee: 0, vat: 0, total: amt, exchange_rate: r, destination_amount: amt * r, destination_currency: a.p_dest_currency };
      txs.unshift(tx(0, { id: 'tx-new', reference: 'YOR-TXNEW01', kind: 'FIAT_EXTERNAL', amount: amt, total: amt, counterparty_name: a.p_beneficiary && a.p_beneficiary.phone,
        meta: { provider: a.p_provider, destinationCurrency: a.p_dest_currency, destinationAmount: amt * r, rate: r, beneficiary: a.p_beneficiary } }));
      return res;
    },
    intl_send: function(a){
      if (dyS.enabled) return dyBlock();
      if (!a.p_pin_grant) throw { message: 'pin_required' };
      var b = a.p_beneficiary || {};
      if (!b.firstName || !b.lastName) throw { message: 'missing_field:first_name', code: 'P0001' };
      if (!/^\+[0-9]{8,15}$/.test(b.phone || '')) throw { message: 'invalid_phone', code: 'P0001' };
      if (Number(a.p_amount) < 0.5) throw { message: 'invalid_amount', code: 'P0001' };
      var rate = 1492, amt = Number(a.p_amount), dest = Math.floor(amt * rate);
      txs.unshift(tx(0, { id: 'tx-intl', reference: 'YOR-TXINTL1', kind: 'FIAT_EXTERNAL', status: 'PROCESSING', amount: amt, total: amt, counterparty_name: b.firstName + ' ' + b.lastName,
        meta: { provider: a.p_provider, payout: 'MANUAL', destinationCurrency: 'XOF', destinationAmount: dest, rate: rate, beneficiary: { name: b.firstName + ' ' + b.lastName, phone: b.phone, country: a.p_country } } }));
      return { ok: true, transaction_id: 'tx-intl', reference: 'YOR-TXINTL1', status: 'PROCESSING', amount: amt, currency: 'OMR', flow: 'INTL_TRANSFER', destination_currency: 'XOF', destination_amount: dest, payout: 'MANUAL' };
    },
    admin_payout_list: function(a){ if (!FX.admin) throw { message: 'forbidden', code: '42501' };
      var out = payouts.map(function(p){ var c = Object.assign({}, p); if (p._q) { p._q--; if (!p._q) p.notice_status = 'SENT'; } return c; }); return out; },
    admin_payout_confirm: function(a){ if (!FX.admin) throw { message: 'forbidden', code: '42501' };
      var p = payouts.filter(function(x){ return x.id === a.p_tx; })[0]; if (!p) throw { message: 'not_found', code: 'P0002' };
      var ref = String(a.p_paid_ref || '').trim(); if (ref.length < 4 || ref.length > 60) throw { message: 'payout_reference_required', code: '22023' };
      if (p.status !== 'PENDING' && p.status !== 'PROCESSING') throw { message: 'invalid_state', code: '22023' };
      p.status = 'COMPLETED'; p.paid_ref = ref; p.paid_at = new Date().toISOString(); p.notice_status = 'QUEUED'; p._q = 2; return { ok: true, reference: p.reference }; },
    admin_payout_resend_notice: function(a){ if (!FX.admin) throw { message: 'forbidden', code: '42501' };
      var p = payouts.filter(function(x){ return x.id === a.p_tx; })[0]; if (!p || p.status !== 'COMPLETED') throw { message: 'invalid_state', code: '22023' };
      p.notice_status = 'QUEUED'; p.notice_error = null; p._q = 2; return { ok: true }; },
    get_recipient_notice_status: function(){ return []; },
    /* 14.0.0 — withdrawals, behaving like the database functions */
    /* 14.3 — each account has its own real address per network (created by the server) + its saved QR code */
    get_receive_address: function(a){
      if (window.__noAddr) throw { message: 'deposit_address_unavailable', code: '22023' };
      if (window.__addrPending && !window.__addrCreated) throw { message: 'address_pending', code: '22023' };
      var m = { tron: 'TZ2nw5y4azp1wkY89kPTBqUPtRhCguWhjY', ethereum: '0x4d47e11a28A91C2F10da1d598EB1aA68E4a091E9', bsc: '0xa23b10Fb739c2840bbfb46BfAE32f899ACD5305c', polygon: '0x934Eb559c2D6A30988d71E9da900B178Fc4FBcbD', bitcoin: 'bc1qtnelzndaatzx2xna7a0jkzpcd852c0x2hej5s3', solana: 'E3ULfuYpNzLa6bKcBGCBH3fyxHSbRYHJAPFRqDfsyy4J', xrp: 'raKSBh4eAB42hQaUs5pGiG1eQQpNhGNtaC', litecoin: 'ltc1qjkr585rnlm9zydgkw699a2fc748gl99vpes2y7' };
      return m[a.p_network] || null; },
    my_deposit_addresses: function(){ return [{ network: 'tron', address: 'TZ2nw5y4azp1wkY89kPTBqUPtRhCguWhjY', qr_svg: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="100%" height="100%" fill="white"/><rect x="2" y="2" width="6" height="6" fill="black"/></svg>' }]; },
    admin_tx_pause: function(a){ adm(); var x = txAdm.filter(function(t){ return t.id === a.p_tx; })[0]; if (!x) throw { message: 'not_found' }; if (x.status !== 'PENDING') throw { message: 'invalid_state' };
      if (x.paused) return { ok: true, already: true, status: 'PENDING', paused: true }; x.paused = true; window.__txPauses = (window.__txPauses || 0) + 1; return { ok: true, status: 'PENDING', paused: true }; },
    withdraw_overview: function(){ return { items: wdB.slice(), banks: [{ code: 'BMCT', en: 'Bank Muscat', fr: 'Bank Muscat', ar: 'بنك مسقط' }, { code: 'NBO', en: 'National Bank of Oman', fr: 'National Bank of Oman', ar: 'البنك الوطني العماني' }],
      available: acc().available_balance, reserved: acc().reserved_balance, min: 10, enabled: wdEnabled }; },
    withdraw_request: function(a){
      if (!a.p_key || a.p_key.length < 8) throw { message: 'idempotency_key_required' };
      var ex = wdB.filter(function(w){ return w._idem === a.p_key; })[0]; if (ex) return { ok: true, id: ex.id, reference: ex.reference, replayed: true };
      if (!wdEnabled) throw { message: 'withdraw_disabled' };
      var amt = Math.round(Number(a.p_amount) * 1000) / 1000; if (!(amt >= 10)) throw { message: 'amount_out_of_range' };
      if (amt > acc().available_balance) throw { message: 'insufficient_balance' };
      acc().available_balance -= amt; acc().reserved_balance += amt;
      var w = { id: 'wdb-' + (wdB.length + 1), reference: 'WD-TEST000' + (wdB.length + 1), amount: amt, holder: a.p_holder, bank_code: a.p_bank_code, bank_name: 'Bank Muscat', account_number: a.p_account, iban: a.p_iban || null, status: 'PENDING', admin_note: null, paid_ref: null, created_at: new Date().toISOString(), decided_at: null, paid_at: null, _idem: a.p_key };
      wdB.unshift(w); return { ok: true, id: w.id, reference: w.reference }; },
    withdraw_cancel: function(a){ var w = wdB.filter(function(x){ return x.id === a.p_id; })[0]; if (!w) throw { message: 'not_found' }; if (w.status !== 'PENDING') throw { message: 'invalid_state' };
      w.status = 'CANCELLED'; acc().available_balance += w.amount; acc().reserved_balance -= w.amount; return { ok: true }; },
    crypto_withdraw_overview: function(){ var bal = {}; tables.crypto_wallets.forEach(function(w){ bal[w.asset] = (bal[w.asset] || 0) + w.available_balance; });
      return { enabled: wdEnabled, kyc_required: false, networks: [{ asset: 'BTC', network: 'bitcoin', fee: 0.0002 }, { asset: 'ETH', network: 'ethereum', fee: 0.002 }, { asset: 'USDT', network: 'ethereum', fee: 0 }, { asset: 'USDT', network: 'tron', fee: 0 }, { asset: 'USDT', network: 'bsc', fee: 0 }, { asset: 'XRP', network: 'xrp', fee: 0.2 }],
        balances: bal, items: wdC.slice() }; },
    crypto_withdraw_request: function(a){
      var ex = wdC.filter(function(w){ return w._idem === a.p_idempotency_key; })[0]; if (ex) return { ok: true, id: ex.id, reference: ex.reference, status: ex.status, replayed: true };
      if (!a.p_pin_grant) throw { message: 'pin_required', code: '42501' };
      if (!wdEnabled) throw { message: 'withdraw_disabled' };
      if (a.p_network === 'tron' && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a.p_address)) throw { message: 'invalid_address' };
      if (/^TInternal/.test(a.p_address)) throw { message: 'internal_address_not_allowed' };
      var fee = a.p_asset === 'BTC' ? 0.0002 : 0, w0 = tables.crypto_wallets.filter(function(w){ return w.asset === a.p_asset; })[0];
      if (!w0 || w0.available_balance < Number(a.p_amount) + fee) throw { message: 'insufficient_balance' };
      w0.available_balance -= Number(a.p_amount) + fee; w0.balance -= Number(a.p_amount) + fee;
      var w = { id: 'wdc-' + (wdC.length + 1), reference: 'OMT' + String(48213570 + wdC.length), asset: a.p_asset, network: a.p_network, address: a.p_address, memo: a.p_memo, amount: Number(a.p_amount), fee: fee, status: 'PENDING', tx_hash: null, admin_note: null, transaction_id: 'tx-wd' + wdC.length, created_at: new Date().toISOString(), _idem: a.p_idempotency_key };
      wdC.unshift(w); return { ok: true, id: w.id, reference: w.reference, status: 'PENDING', transaction_id: w.transaction_id, amount: w.amount, fee: fee, total: w.amount + fee, asset: w.asset, network: w.network }; },
    crypto_withdraw_cancel: function(a){ var w = wdC.filter(function(x){ return x.id === a.p_id; })[0]; if (!w) throw { message: 'not_found' }; if (w.status !== 'PENDING') throw { message: 'invalid_state' };
      w.status = 'CANCELLED'; var w0 = tables.crypto_wallets.filter(function(x){ return x.asset === w.asset; })[0]; w0.available_balance += w.amount + w.fee; w0.balance += w.amount + w.fee; return { ok: true }; },
    admin_withdrawal_list: function(){ adm(); return wdB.map(function(w){ return Object.assign({ user_id: uid, yor_id: 'YOR-A1B2C3', full_name: 'Amira Al Said', phone: '+96891234567' }, w); }); },
    admin_withdrawal_decide: function(a){ adm(); var w = wdB.filter(function(x){ return x.id === a.p_id; })[0]; if (!w || w.status !== 'PENDING') throw { message: 'invalid_state' };
      if (!a.p_approve && String(a.p_note || '').trim().length < 3) throw { message: 'reason_required' }; w.status = a.p_approve ? 'APPROVED' : 'REJECTED'; w.admin_note = a.p_note || null; return { ok: true }; },
    admin_withdrawal_mark_paid: function(a){ adm(); var w = wdB.filter(function(x){ return x.id === a.p_id; })[0]; if (!w || w.status !== 'APPROVED') throw { message: 'invalid_state' }; w.status = 'PAID'; w.paid_ref = a.p_bank_ref; return { ok: true }; },
    admin_crypto_withdrawal_list: function(){ adm(); return wdC.map(function(w){ return Object.assign({ user_id: uid, yor_id: 'YOR-A1B2C3', full_name: 'Amira Al Said', phone: '+96891234567' }, w); }); },
    admin_crypto_withdrawal_process: function(a){ adm(); var w = wdC.filter(function(x){ return x.id === a.p_id; })[0]; if (!w || w.status !== 'PENDING') throw { message: 'invalid_state' }; w.status = 'PROCESSING'; return { ok: true }; },
    admin_crypto_withdrawal_complete: function(a){ adm(); var w = wdC.filter(function(x){ return x.id === a.p_id; })[0]; if (!w || (w.status !== 'PENDING' && w.status !== 'PROCESSING')) throw { message: 'invalid_state' };
      if (w.network === 'tron' && !/^[0-9a-fA-F]{64}$/.test(a.p_tx_hash)) throw { message: 'invalid_tx_hash' }; w.status = 'COMPLETED'; w.tx_hash = a.p_tx_hash; return { ok: true }; },
    admin_crypto_withdrawal_reject: function(a){ adm(); var w = wdC.filter(function(x){ return x.id === a.p_id; })[0]; if (!w) throw { message: 'not_found' }; if (String(a.p_reason || '').trim().length < 3) throw { message: 'reason_required' }; w.status = 'REJECTED'; w.admin_note = a.p_reason; return { ok: true }; },
    admin_tx_list: function(a){ adm(); var st = a && a.p_status; return txAdm.filter(function(x){ return !st || x.status === st; }).map(function(x){ return JSON.parse(JSON.stringify(x)); }); },
    admin_tx_confirm: function(a){ adm(); var x = txAdm.filter(function(t){ return t.id === a.p_tx; })[0]; if (!x) throw { message: 'not_found' };
      if (x.status === 'CONFIRMED') return { ok: true, already: true, reference: x.reference, confirmed_at: x.confirmed_at };
      if (x.status !== 'PENDING') throw { message: 'invalid_state' };
      x.status = 'CONFIRMED'; x.confirmed_at = new Date().toISOString(); window.__txCredits[x.id] = (window.__txCredits[x.id] || 0) + x.amount;
      if (x.receiver.has_email){ window.__txMails[x.id] = (window.__txMails[x.id] || 0) + 1; x.email = { status: 'PENDING', sent_at: null }; }
      return { ok: true, id: x.id, reference: x.reference, amount: x.amount, asset: x.asset, status: 'CONFIRMED', confirmed_at: x.confirmed_at }; },
    admin_tx_reject: function(a){ adm(); if (String(a.p_reason || '').trim().length < 3) throw { message: 'reason_required' }; var x = txAdm.filter(function(t){ return t.id === a.p_tx; })[0];
      if (!x || x.status !== 'PENDING') throw { message: 'invalid_state' }; x.status = 'REJECTED'; return { ok: true, status: 'REJECTED' }; },
    admin_recent_users: function(){ adm(); return [{ yor_id: 'YOR-A1B2C3', first_name: 'Amira', last_name: 'Al Said', email: profile.email, phone: profile.phone, country: 'OM', status: 'active', role: profile.role, created_at: profile.created_at, email_confirmed: true }]; },
    admin_search_users: function(a){ adm(); return /amira/i.test(a.p_query || '') ? rpcs.admin_recent_users() : []; },
    admin_set_setting: function(a){ adm(); if (a.p_key === 'withdraw_enabled'){ if (typeof a.p_value !== 'boolean') throw { message: 'invalid_value' }; wdEnabled = a.p_value; } return {}; },
    get_tx_balance_after: function(){ return null; }
  };
  var client = {
    auth: {
      onAuthStateChange: function(cb){ listeners.push(cb); setTimeout(function(){ cb(session ? 'INITIAL_SESSION' : 'INITIAL_SESSION', session); }, 30); return { data: { subscription: { unsubscribe: function(){} } } }; },
      getSession: function(){ return Promise.resolve({ data: { session: session }, error: null }); },
      getUser: function(){ return Promise.resolve({ data: { user: session && session.user }, error: null }); },
      signInWithPassword: function(){ session = { access_token: 'x', user: { id: uid, email: profile.email } }; listeners.forEach(function(l){ l('SIGNED_IN', session); }); return Promise.resolve({ data: { session: session }, error: null }); },
      signUp: function(){ return Promise.resolve({ data: { session: null }, error: null }); },
      signOut: function(){ session = null; listeners.forEach(function(l){ l('SIGNED_OUT', null); }); return Promise.resolve({ error: null }); },
      resetPasswordForEmail: function(){ return Promise.resolve({ data: {}, error: null }); },
      updateUser: function(){ return Promise.resolve({ data: {}, error: null }); }
    },
    from: Q,
    rpc: function(name, args){
      var f = rpcs[name];
      (window.__rpcLog = window.__rpcLog || []).push({ name: name, args: args });
      try { return Promise.resolve({ data: f ? f(args) : null, error: null }); }
      catch (e) { return Promise.resolve({ data: null, error: e }); }
    },
    functions: { invoke: function(name, o){
      /* 14.5 — crypto-swap: a server-fixed quote (fixed test prices, 30 s), like the Edge function; FX.swapOff: the function is not deployed */
      if (name === 'crypto-swap'){
        if (FX.swapOff) return Promise.resolve({ data: null, error: { message: 'Function not found', context: { status: 404 } } });
        var b = (o && o.body) || {}, PX = { BTC: 97000, ETH: 3500, USDT: 1, USDC: 1.0002, BNB: 690, SOL: 210, XRP: 2.4, LTC: 110 };
        var w = tables.crypto_wallets.filter(function(x){ return x.asset === b.from_asset && x.network === b.from_network; })[0];
        if (!w) return Promise.resolve({ data: { ok: false, error: 'sender_wallet_missing' }, error: null });
        if (w.available_balance < Number(b.from_amount)) return Promise.resolve({ data: { ok: false, error: 'insufficient_balance' }, error: null });
        var price = PX[b.from_asset] / PX[b.to_asset], q = { id: 'q-' + (++qn), from_asset: b.from_asset, from_network: b.from_network, to_asset: b.to_asset, to_network: b.to_network,
          from_amount: Number(b.from_amount), to_amount: Math.floor(Number(b.from_amount) * price * 1e8) / 1e8, price: price, px_from_usdt: PX[b.from_asset], px_to_usdt: PX[b.to_asset],
          source: 'binance:data-api.binance.vision', side: b.side || null, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + (FX.quoteTtl || 30) * 1000).toISOString() };
        quotes[q.id] = q; (window.__quotes = window.__quotes || []).push(q);
        return Promise.resolve({ data: { ok: true, fee: 0, ttl_s: 30, quote: q }, error: null });
      }
      return Promise.resolve({ data: { ok: true }, error: null }); } },
    channel: function(){ var c = { on: function(){ return c; }, subscribe: function(){ return c; } }; return c; },
    removeChannel: function(){}
  };
  window.supabase = { createClient: function(){ return client; } };
})();
