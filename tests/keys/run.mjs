/* Deposit-address derivation tests. The Deno source (npm: specifiers) is copied with plain package names, then checked against PUBLIC vectors:
   Ethereum / Bitcoin / TRON for private key 1, the XRP zero account, and 1 600 generated addresses (unique, valid format, key -> address round trip).
   A wrong derivation would send customers' deposits to addresses nobody can spend from, so this must stay green. */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '../../supabase/functions/wallet-addresses/derive.ts'), 'utf8')
  .replace(/"npm:(@[^/]+\/[^@"]+|[^@"/]+)@[0-9.]+(\/[^"]*)?"/g, '"$1$2"');
const file = path.join(here, '.derive.generated.mts'); fs.writeFileSync(file, src);
const { derive, addressFromKey, NETWORKS, addressOk, _test } = await import(file);
const { secp256k1 } = await import('@noble/curves/secp256k1'); const { bech32 } = await import('@scure/base'); const { bytesToHex, hexToBytes } = await import('@noble/hashes/utils');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const one = new Uint8Array(32); one[31] = 1;
ok(addressFromKey('ethereum', one) === '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf', 'ethereum / EIP-55 vector (private key 1)');
ok(addressFromKey('bitcoin', one) === 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', 'bitcoin bech32 vector (private key 1)');
ok(addressFromKey('tron', one) === 'TMVQGm1qAQYVdetCeGRRkTWYYrLXuHK2HC', 'tron vector (private key 1)');
const zero = _test.remap(_test.b58check.encode(new Uint8Array([0, ...new Uint8Array(20)])), 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');
ok(zero === 'rrrrrrrrrrrrrrrrrrrrrhoLvTp', 'xrp ACCOUNT_ZERO encoding');
ok(addressFromKey('litecoin', one).startsWith('ltc1q') && bech32.decode(addressFromKey('litecoin', one)).prefix === 'ltc', 'litecoin bech32 (ltc prefix, valid checksum)');
const seen = new Set();
for (let i = 0; i < 200; i++) for (const n of NETWORKS) {
  const d = derive(n);
  if (!addressOk(n, d.address)) ok(false, `format ${n} ${d.address}`);
  if (seen.has(d.address)) ok(false, 'duplicate ' + d.address); seen.add(d.address);
  if (addressFromKey(n, hexToBytes(d.privateKeyHex)) !== d.address) ok(false, `key -> address mismatch (${n})`);
}
ok(seen.size === 200 * NETWORKS.length, `${seen.size} addresses: all unique, all valid, every key gives back its address`);
fs.unlinkSync(file);
console.log(fails ? `FAILED ${fails}` : 'ALL PASS'); process.exit(fails ? 1 : 0);
