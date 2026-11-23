import { createClient } from "npm:@supabase/supabase-js@2";
import qrcode from "npm:qrcode-generator@1.4.4";
import { derive, addressFromKey, NETWORKS, addressOk, type Network } from "./derive.ts";

// ============================================================
// OM Wallet — wallet-addresses (14.3)
// Creates, for one account, the REAL deposit address of every supported network (one different address per network, each from its own
// freshly generated private key) and the QR code of each address, and saves them. Idempotent: an address that exists is never replaced.
// The private key is encrypted (AES-256-GCM, master key in Supabase Vault) and stored in the SAME database transaction as the address
// (public.store_wallet_address): there is never an address without its key. No key is ever returned or logged.
// Callers: the signed-in user (their own addresses only) · the database trigger on a new profile (shared secret).
// ============================================================
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type, x-client-info, x-webhook-secret", "access-control-allow-methods": "POST, OPTIONS" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", ...CORS } });

const b64 = (b: Uint8Array) => { let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
const hex2 = (h: string) => Uint8Array.from(h.match(/.{2}/g)!.map((x) => parseInt(x, 16)));
function safeEqual(a: string, b: string): boolean { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

let masterKey: CryptoKey | null = null;
async function master(): Promise<CryptoKey> {
  if (masterKey) return masterKey;
  const { data, error } = await sb.rpc("get_wallet_master_key");
  if (error || !data || String(data).length !== 64) throw new Error("master_key_unavailable");
  masterKey = await crypto.subtle.importKey("raw", hex2(String(data)), "AES-GCM", false, ["encrypt", "decrypt"]);
  return masterKey;
}
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
// integrity audit (internal calls only): decrypts each stored key IN MEMORY and checks that it gives back the stored address.
// Returns booleans only — a key is never returned, logged or written anywhere.
async function audit(userId: string): Promise<Record<string, boolean>> {
  const { data: addrs } = await sb.from("wallet_addresses").select("network, address").eq("user_id", userId);
  const { data: keys } = await sb.from("wallet_keys").select("network, ciphertext").eq("user_id", userId);
  const out: Record<string, boolean> = {};
  for (const a of (addrs ?? []) as { network: string; address: string }[]) {
    const k = (keys ?? []).find((x: { network: string }) => x.network === a.network) as { ciphertext: string } | undefined;
    if (!k) { out[a.network] = false; continue; }
    try {
      const raw = unb64(k.ciphertext);
      const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(0, 12) }, await master(), raw.slice(12)));
      out[a.network] = addressFromKey(a.network as Network, plain) === a.address;
    } catch { out[a.network] = false; }
  }
  return out;
}
async function seal(plainHex: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await master(), hex2(plainHex)));
  const out = new Uint8Array(iv.length + ct.length); out.set(iv); out.set(ct, iv.length);
  return b64(out);
}
function qrSvg(address: string): string {
  const q = qrcode(0, "M"); q.addData(address); q.make();
  return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function ensure(userId: string): Promise<{ rows: { network: string; address: string; qr_svg: string }[]; failed: string[] }> {
  const { data: prof } = await sb.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!prof) throw new Error("profile_not_found");
  const { data: have } = await sb.from("wallet_addresses").select("network").eq("user_id", userId);
  const haveSet = new Set((have ?? []).map((r: { network: string }) => r.network));
  const failed: string[] = [];
  for (const n of NETWORKS.filter((x) => !haveSet.has(x))) {
    // one network failing never blocks the others: what could be created is kept, the failed networks are reported
    try {
      const d = derive(n as Network);
      if (!addressOk(n as Network, d.address)) throw new Error("derived_address_invalid");       // never stored
      const { error } = await sb.rpc("store_wallet_address", { p_user: userId, p_network: n, p_address: d.address, p_qr: qrSvg(d.address), p_cipher: await seal(d.privateKeyHex), p_format: d.format });
      if (error) throw new Error("store_failed:" + error.message);                               // a concurrent request may have won: store_wallet_address returns the existing row
    } catch (e) { failed.push(n); console.error("wallet-addresses", n, String((e as Error).message).slice(0, 160)); }
  }
  const { data: rows } = await sb.from("wallet_addresses").select("network, address, qr_svg").eq("user_id", userId).order("network");
  return { rows: (rows ?? []) as { network: string; address: string; qr_svg: string }[], failed };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { if ((req.headers.get("content-length") ?? "0") !== "0") return json({ error: "bad_request" }, 400); }
  let userId: string | null = null;
  const given = req.headers.get("x-webhook-secret") ?? "";
  if (given) {                                                   // internal call (database trigger / backfill)
    const { data: secret } = await sb.rpc("get_webhook_secret");
    if (!secret || !safeEqual(given, String(secret))) return json({ error: "unauthorized" }, 401);
    userId = typeof body.user_id === "string" && UUID.test(body.user_id) ? body.user_id : null;
    if (!userId) return json({ error: "user_required" }, 400);
    if (body.audit) return json({ ok: true, audit: await audit(userId) });
  } else {                                                       // the signed-in user: their own addresses only
    const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data, error } = await sb.auth.getUser(jwt);
    if (error || !data?.user) return json({ error: "unauthorized" }, 401);
    userId = data.user.id;
  }
  if (!userId) return json({ error: "user_required" }, 400);
  try {
    const { rows, failed } = await ensure(userId);
    if (failed.length && !rows.length) return json({ error: "address_creation_failed" }, 500);
    return json(given ? { ok: !failed.length, count: rows.length, failed } : { ok: !failed.length, addresses: rows, failed });
  } catch (e) {
    console.error("wallet-addresses", String((e as Error).message).slice(0, 200));
    return json({ error: "address_creation_failed" }, 500);
  }
});
