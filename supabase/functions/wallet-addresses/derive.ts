// OM Wallet — real deposit addresses. Each address comes from a freshly generated private key (never random text):
// funds sent to it can be recovered by the platform. Keys are produced here, encrypted by index.ts, and never leave the server.
import { secp256k1 } from "npm:@noble/curves@1.8.1/secp256k1";
import { ed25519 } from "npm:@noble/curves@1.8.1/ed25519";
import { sha256 } from "npm:@noble/hashes@1.7.1/sha256";
import { ripemd160 } from "npm:@noble/hashes@1.7.1/ripemd160";
import { keccak_256 } from "npm:@noble/hashes@1.7.1/sha3";
import { bytesToHex } from "npm:@noble/hashes@1.7.1/utils";
import { bech32, createBase58check } from "npm:@scure/base@1.2.4";

export const NETWORKS = ["bitcoin", "litecoin", "ethereum", "bsc", "polygon", "tron", "solana", "xrp"] as const;
export type Network = typeof NETWORKS[number];
export type Derived = { network: Network; address: string; privateKeyHex: string; format: string };

const b58check = createBase58check(sha256);
const RIPPLE = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";
const STD = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const hash160 = (b: Uint8Array) => ripemd160(sha256(b));
const concat = (...a: Uint8Array[]) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
// a valid secp256k1 private key from the system's secure random source (rejected only if outside the curve order: probability ~ 2^-128)
function secpKey(): Uint8Array { for (;;) { const k = crypto.getRandomValues(new Uint8Array(32)); try { secp256k1.getPublicKey(k); return k; } catch { /* retry */ } } }

function evmAddress(priv: Uint8Array): string {
  const pub = secp256k1.getPublicKey(priv, false).slice(1);
  const hex = bytesToHex(keccak_256(pub).slice(-20));
  const h = bytesToHex(keccak_256(new TextEncoder().encode(hex)));                    // EIP-55 mixed-case checksum
  return "0x" + [...hex].map((c, i) => (parseInt(h[i], 16) >= 8 ? c.toUpperCase() : c)).join("");
}
// re-encodes a base58 string written with the standard alphabet into another alphabet (same digits, different symbols)
const remap = (s: string, to: string) => [...s].map((c) => to[STD.indexOf(c)]).join("");

export function derive(network: Network): Derived {
  switch (network) {
    case "bitcoin": case "litecoin": {
      const priv = secpKey(), h = hash160(secp256k1.getPublicKey(priv, true));
      const hrp = network === "bitcoin" ? "bc" : "ltc";
      return { network, address: bech32.encode(hrp, [0, ...bech32.toWords(h)]), privateKeyHex: bytesToHex(priv), format: "secp256k1-hex" };
    }
    case "ethereum": case "bsc": case "polygon": {
      const priv = secpKey();
      return { network, address: evmAddress(priv), privateKeyHex: bytesToHex(priv), format: "secp256k1-hex" };
    }
    case "tron": {
      const priv = secpKey(), pub = secp256k1.getPublicKey(priv, false).slice(1);
      return { network, address: b58check.encode(concat(new Uint8Array([0x41]), keccak_256(pub).slice(-20))), privateKeyHex: bytesToHex(priv), format: "secp256k1-hex" };
    }
    case "xrp": {
      const priv = secpKey(), h = hash160(secp256k1.getPublicKey(priv, true));
      return { network, address: remap(b58check.encode(concat(new Uint8Array([0x00]), h)), RIPPLE), privateKeyHex: bytesToHex(priv), format: "secp256k1-hex" };
    }
    case "solana": {
      const seed = crypto.getRandomValues(new Uint8Array(32)), pub = ed25519.getPublicKey(seed);
      return { network, address: b58encode(pub), privateKeyHex: bytesToHex(seed), format: "ed25519-seed-hex" };
    }
  }
}
function b58encode(b: Uint8Array): string {
  let n = 0n; for (const x of b) n = (n << 8n) | BigInt(x);
  let s = ""; while (n > 0n) { s = STD[Number(n % 58n)] + s; n /= 58n; }
  for (const x of b) { if (x === 0) s = "1" + s; else break; }
  return s;
}
// the same formats the database accepts (public._crypto_address_ok) — an address that fails this is never stored
const OK: Record<Network, RegExp> = {
  bitcoin: /^bc1[02-9ac-hj-np-z]{11,71}$/, litecoin: /^ltc1[02-9ac-hj-np-z]{11,71}$/, ethereum: /^0x[0-9a-fA-F]{40}$/, bsc: /^0x[0-9a-fA-F]{40}$/, polygon: /^0x[0-9a-fA-F]{40}$/,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/, solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, xrp: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/,
};
export const addressOk = (n: Network, a: string) => OK[n].test(a);
// test hooks
export const _test = { evmAddress, hash160, b58check, remap, secpKey };
