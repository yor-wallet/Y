/* Faux client Supabase pour le banc d'essai (tests/ux). Il remplace le script du CDN dans le navigateur de test UNIQUEMENT.
   Il ne contacte aucun serveur : toutes les données ci-dessous sont fictives. */
(function(){
  var FX = window.__FX || {};
  var NOW = Date.now(), H = 3600e3, D = 24 * H;
  var uid = '00000000-0000-4000-8000-000000000001';
  var profile = { id: uid, user_id: 'USR-TEST0001', yor_id: 'YOR-A1B2C3', email: 'amira.test@example.com', role: 'user', first_name: 'Amira', last_name: 'Al Said',
    phone: '+96891234567', country: 'OM', photo: null, kyc: { status: 'VERIFIED', level: 1, verifiedAt: NOW - 30 * D }, created_at: new Date(NOW - 90 * D).toISOString() };
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
  var rpcs = {
    my_transactions: function(){ return txs; },
    pin_status: function(){ return { has_pin: true, locked: false }; },
    verify_pin: function(){ return { ok: true, grant: 'grant-1' }; },
    set_pin: function(){ return { ok: true }; },
    find_user_by_yor_id: function(){ return [{ yor_id: 'YOR-ZZ1122', display_name: 'Salim Al Harthy', country: 'OM', photo: null }]; },
    transfer_fiat: function(){ return { ok: true }; },
    fiat_send_external: function(a){
      if (!a.p_pin_grant) throw { message: 'pin_required' };
      var RATES = { OMR: 1, XOF: 1492 }, r = RATES[a.p_dest_currency] || 1, amt = Number(a.p_amount);
      var res = { ok: true, transaction_id: 'tx-new', reference: 'YOR-TXNEW01', status: 'CONFIRMED', amount: amt, fee: 0, vat: 0, total: amt, exchange_rate: r, destination_amount: amt * r, destination_currency: a.p_dest_currency };
      txs.unshift(tx(0, { id: 'tx-new', reference: 'YOR-TXNEW01', kind: 'FIAT_EXTERNAL', amount: amt, total: amt, counterparty_name: a.p_beneficiary && a.p_beneficiary.phone,
        meta: { provider: a.p_provider, destinationCurrency: a.p_dest_currency, destinationAmount: amt * r, rate: r, beneficiary: a.p_beneficiary } }));
      return res;
    },
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
