# Orange Money Côte d'Ivoire — what the server needs before `FEATURES.orangeMoneyCI` is turned on

**Status: proposal. Nothing here has been applied to any database.** Review it in a Supabase branch first.

## Why the app keeps Côte d'Ivoire switched off
The app sends Orange Money transfers through `public.intl_send` → `public._intl_send_impl`. Reading that function on the live project (`gebjmguoauvutiqvoswl`) shows:

- **Orange Money Mali** has a real payout path: when `app_private.orange_mali_manual = 'on'` (it is, `orange_mali_mode()` returns `MANUAL`), the transfer is recorded as `PROCESSING` / `AWAITING_PAYOUT` with `meta.payout = 'MANUAL'`. An administrator pays the recipient and confirms with `admin_payout_confirm(tx, paid_ref)`; the transfer becomes `COMPLETED`, the sender and the recipient are notified, and `admin_payout_list` shows the queue (it lists only `meta.payout = 'MANUAL'`).
- **Every other country (Côte d'Ivoire included)** takes the other branch: `meta.demo = true`, no `payout = 'MANUAL'`, and the demonstration engine (`bank_job_start` trigger) simulates the progress. The sender is debited, but **nothing is queued for a real payout** and `admin_payout_list` does not show it.

Turning Côte d'Ivoire on in the app today would therefore debit real money for transfers that are never paid. That is why `FEATURES.orangeMoneyCI` is `false`.

## Server change to review (same mechanism as Mali)
1. A switch, off by default:
   ```sql
   insert into public.app_private (key, value) values ('orange_ci_manual', 'off') on conflict (key) do nothing;
   ```
2. In `_intl_send_impl`, generalise the manual-payout test (today it is hard-wired to Mali):
   ```sql
   v_manual := (v_m = 'MOBILE_MONEY' and lower(v_prov) = 'orange money' and (
                  (v_cc = 'ML' and coalesce((select value from public.app_private where key = 'orange_mali_manual'), 'off') = 'on')
               or (v_cc = 'CI' and coalesce((select value from public.app_private where key = 'orange_ci_manual'),   'off') = 'on')));
   ```
   and the number check for the manual case:
   ```sql
   if v_manual and not ((v_cc = 'ML' and v_phone ~ '^\+223[0-9]{8}$') or (v_cc = 'CI' and v_phone ~ '^\+225[0-9]{10}$')) then
     raise exception 'invalid_phone' using errcode = '22023';
   end if;
   ```
   and `'service', case when v_manual then 'ORANGE_MONEY_' || v_cc end` in the metadata.
3. `admin_payout_confirm` / reject notifications currently say `· Orange Money Mali`; use the country (`t.meta ->> 'country'`).
4. A getter next to `orange_mali_mode()` (`orange_ci_mode()`), and an admin screen toggle if you have one.
5. Test on a branch: one transfer with each country, confirm it appears in `admin_payout_list`, pay it with `admin_payout_confirm`, check the sender notification and the recipient notice.

Only after that: set `orange_ci_manual = 'on'` and `orangeMoneyCI: true` in `js/data/reference-data.js`.

## Other observations from the read-only audit (nothing changed)
- Supabase security advisor: *Leaked password protection is disabled* (Auth settings), 3 functions with a mutable `search_path` (`_bn_clean_name`, `_bn_json`, `bm_agent_log_append_only`), and 84 `SECURITY DEFINER` functions callable by signed-in users (the `admin_*` ones check `is_admin()` inside; worth a periodic review).
- `fiat_send_external` (used for Oman) does not check that country, provider and currency fit together and queues no payout; it is only appropriate for the Oman mobile-number flow it was written for.
