import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================================
// OM Wallet — admin-action (14.3)
// JSON API behind the three buttons of the administrator's e-mail (Confirm / Refuse / Pause). The page that calls it is admin-action.html.
//   { op: "info",  token }            -> what the link is for (no change)
//   { op: "apply", token, reason? }   -> performs the action ONCE, through admin_tx_confirm / admin_tx_reject / admin_tx_pause (same checks, same idempotence)
// Authentication = the personal 256-bit token of the link (stored hashed, 72 h, bound to one administrator, one transaction, one action).
// Nothing happens when a link is merely opened: only the click on the confirmation page sends "apply" (mail scanners and previews cannot act).
// ============================================================
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, authorization, apikey, x-client-info", "access-control-allow-methods": "POST, OPTIONS" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const token = typeof b.token === "string" ? b.token : "";
  if (!/^[0-9a-f]{64}$/.test(token)) return json({ error: "invalid_link" }, 200);
  if (b.op === "info") {
    const { data, error } = await sb.rpc("admin_link_info", { p_token: token });
    return error ? json({ error: "server_error" }, 500) : json(data);
  }
  if (b.op === "apply") {
    const reason = typeof b.reason === "string" ? b.reason.slice(0, 300) : null;
    const { data, error } = await sb.rpc("admin_link_apply", { p_token: token, p_reason: reason });
    if (error) { console.error("admin-action", String(error.message).slice(0, 200)); return json({ ok: false, error: "server_error" }, 500); }
    return json(data);
  }
  return json({ error: "bad_request" }, 400);
});
