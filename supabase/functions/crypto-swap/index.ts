import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================================
// OM Wallet 14.5 — crypto-swap : PRICE QUOTE for a swap or a Spot market order.
// The price is read HERE, on the server, from Binance's public market data (data-api.binance.vision, then api*.binance.com), never
// from the app. The quote (amount sold, amount received, price, source, time) is saved in public.swap_quotes with the service role,
// lives 30 seconds and can be used once by public.swap_execute (PIN + idempotency). Nothing is debited or credited here.
// Fees: 0. Minimum: 1 USD of value. The administrator confirms every swap (admin_tx_confirm), as for every other operation.
// ============================================================
const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const sb = createClient(SUPA_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type, x-client-info", "access-control-allow-methods": "POST, OPTIONS" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", ...CORS } });

const HOSTS = ["https://data-api.binance.vision", "https://api.binance.com", "https://api1.binance.com", "https://api2.binance.com", "https://api3.binance.com"];
const ASSETS = new Set(["BTC", "ETH", "USDT", "USDC", "BNB", "SOL", "XRP", "LTC"]);
const TTL_S = 30, MIN_USD = 1, MAX_PER_MIN = 20;
const floor8 = (n: number) => Math.floor(n * 1e8 + 1e-6) / 1e8;

async function pxUsdt(sym: string): Promise<{ px: number; src: string }> {
  if (sym === "USDT") return { px: 1, src: "USDT=1" };
  for (const h of HOSTS) {
    try {
      const r = await fetch(`${h}/api/v3/ticker/price?symbol=${sym}USDT`, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) continue;
      const j = await r.json();
      const p = Number(j && j.price);
      if (p > 0 && isFinite(p)) return { px: p, src: new URL(h).host };
    } catch { /* next host */ }
  }
  throw new Error("price_unavailable");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ ok: false, error: "unauthenticated" }, 401);
  const { data: who, error: ue } = await sb.auth.getUser(jwt);
  if (ue || !who?.user) return json({ ok: false, error: "unauthenticated" }, 401);
  const uid = who.user.id;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ ok: false, error: "bad_request" }, 400); }
  const fa = String(b.from_asset || "").toUpperCase(), fn = String(b.from_network || "").toLowerCase();
  const ta = String(b.to_asset || "").toUpperCase(), tn = String(b.to_network || "").toLowerCase();
  const side = b.side === "BUY" || b.side === "SELL" ? String(b.side) : null;
  const amt = floor8(Number(b.from_amount));
  if (!ASSETS.has(fa) || !ASSETS.has(ta) || fa === ta) return json({ ok: false, error: "unsupported_pair" }, 400);
  if (!(amt > 0) || amt > 1e12) return json({ ok: false, error: "invalid_amount" }, 400);

  const { data: nets } = await sb.from("asset_networks").select("asset, network").in("asset", [fa, ta]);
  const has = (a: string, n: string) => (nets ?? []).some((x: { asset: string; network: string }) => x.asset === a && x.network === n);
  if (!has(fa, fn) || !has(ta, tn)) return json({ ok: false, error: "unsupported_asset_network" }, 400);

  const { data: prof } = await sb.from("profiles").select("status").eq("id", uid).maybeSingle();
  if (!prof || prof.status !== "ACTIVE") return json({ ok: false, error: "sender_inactive" }, 403);
  const { data: w } = await sb.from("crypto_wallets").select("available_balance").eq("user_id", uid).eq("asset", fa).eq("network", fn).maybeSingle();
  if (!w) return json({ ok: false, error: "sender_wallet_missing" }, 400);
  if (Number(w.available_balance) < amt) return json({ ok: false, error: "insufficient_balance" }, 400);

  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await sb.from("swap_quotes").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_MIN) return json({ ok: false, error: "too_many_requests" }, 429);

  let pf: { px: number; src: string }, pt: { px: number; src: string };
  try { [pf, pt] = await Promise.all([pxUsdt(fa), pxUsdt(ta)]); } catch { return json({ ok: false, error: "price_unavailable" }, 503); }
  const usd = amt * pf.px;
  if (usd < MIN_USD) return json({ ok: false, error: "min_amount", min_usd: MIN_USD }, 400);
  const price = pf.px / pt.px;
  const toAmt = floor8(amt * price);
  if (!(toAmt > 0)) return json({ ok: false, error: "amount_too_small" }, 400);

  const src = "binance:" + (pf.src === "USDT=1" ? pt.src : pf.src);
  const expires = new Date(Date.now() + TTL_S * 1000).toISOString();
  const { data: q, error: qe } = await sb.from("swap_quotes").insert({
    user_id: uid, from_asset: fa, from_network: fn, to_asset: ta, to_network: tn, from_amount: amt, to_amount: toAmt, price,
    px_from_usdt: pf.px, px_to_usdt: pt.px, usd_value: Math.round(usd * 100) / 100, source: src, side, expires_at: expires,
  }).select("id, from_asset, from_network, to_asset, to_network, from_amount, to_amount, price, px_from_usdt, px_to_usdt, usd_value, source, side, created_at, expires_at").single();
  if (qe || !q) return json({ ok: false, error: "quote_failed" }, 500);
  return json({ ok: true, fee: 0, ttl_s: TTL_S, quote: q });
});
