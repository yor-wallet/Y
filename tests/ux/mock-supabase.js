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
    accounts: [{ id: 'acc-1', type: 'MAIN', name: 'Main OMR', currency: 'OMR', balance: FX.emptyTx ? 0 : 1284.5, available_balance: FX.emptyTx ? 0 : 1284.5, reserved_balance: 0, status: 'ACTIVE', country: 'OM', created_at: new Date(NOW - 90 * D).toISOString() }],
    crypto_wallets: [],
    notifications: FX.emptyTx ? [] : [
      { id: 'n-1', type: 'TRANSFER_RECEIVED', title: 'Money received', message: 'You received OMR 120.000 from Khalid Al Rawahi', read: false, transaction_id: 'tx-4', data: {}, created_at: new Date(NOW - 2 * H).toISOString() },
      { id: 'n-2', type: 'TRANSFER_SENT', title: 'Transfer sent', message: 'OMR 25.500 sent to Salim Al Harthy', read: true, transaction_id: 'tx-1', data: {}, created_at: new Date(NOW - 9 * H).toISOString() }
    ],
    user_docs: [
      { user_id: uid, doc_name: 'preferences', data: { language: FX.lang || 'en', theme: FX.theme || 'light', notifications: true, hideBalances: false, vibration: true } },
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
  var rpcs = {
    dy_status: function(){ return { enabled: dyS.enabled, updatedAt: dyS.updatedAt }; },
    admin_dy_overview: function(){ if (!FX.admin) throw { message: 'forbidden', code: '42501' }; return dyOverview(); },
    admin_dy_set: function(a){ if (!FX.admin) throw { message: 'forbidden', code: '42501' }; if (typeof a.p_enabled !== 'boolean') throw { message: 'invalid_value', code: '22023' };
      if (dyS.enabled !== a.p_enabled){ dyS.enabled = a.p_enabled; dyS.updatedAt = new Date().toISOString(); dyS.updatedBy = 'Amira Al Said'; dyS.history.unshift({ at: dyS.updatedAt, enabled: a.p_enabled, by: 'Amira Al Said' }); }
      return dyOverview(); },
    beneficiary_lookup: function(a){ return FX.dyName && a.p_phone === '+96898765432' ? { found: true, name: FX.dyName } : { found: false }; },
    my_transactions: function(){ return txs; },
    pin_status: function(){ return { has_pin: true, locked: false }; },
    verify_pin: function(){ if (window.__dyFlipOnPin) dyS.enabled = true; return { ok: true, grant: 'grant-1' }; },
    set_pin: function(){ return { ok: true }; },
    find_user_by_yor_id: function(){ return [{ yor_id: 'YOR-ZZ1122', display_name: 'Salim Al Harthy', country: 'OM', photo: null }]; },
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
    functions: { invoke: function(){ return Promise.resolve({ data: { ok: true }, error: null }); } },
    channel: function(){ var c = { on: function(){ return c; }, subscribe: function(){ return c; } }; return c; },
    removeChannel: function(){}
  };
  window.supabase = { createClient: function(){ return client; } };
})();
