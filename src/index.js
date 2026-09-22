/** Address checksum and base-unit conversion. Keccak-256 only, no network. */

const RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
  0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
  0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
  0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ROTC = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44];
const PILN = [10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1];

export function keccak256(bytes) {
  const state = new BigUint64Array(25);
  const rate = 136;
  const data = toBytes(bytes);
  const padded = new Uint8Array(Math.ceil((data.length + 1) / rate) * rate);
  padded.set(data);
  padded[data.length] = 0x01;
  padded[padded.length - 1] |= 0x80;
  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let i = 0; i < rate / 8; i += 1) {
      state[i] ^= readLane(padded, offset + i * 8);
    }
    permute(state);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i += 1) writeLane(out, i * 8, state[i]);
  return out;
}

export function toChecksumAddress(address) {
  const hex = String(address).trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{40}$/.test(hex)) throw new Error("invalid address");
  const hash = [...keccak256(new TextEncoder().encode(hex))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  let out = "0x";
  for (let i = 0; i < hex.length; i += 1) {
    out += parseInt(hash[i], 16) >= 8 ? hex[i].toUpperCase() : hex[i];
  }
  return out;
}

export function isChecksumAddress(address) {
  try {
    return toChecksumAddress(address) === address;
  } catch {
    return false;
  }
}

export function parseUnits(value, decimals = 18) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 77) {
    throw new Error("invalid decimals");
  }
  const text = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(text)) throw new Error("invalid amount");
  const [whole, frac = ""] = text.split(".");
  if (frac.length > decimals) throw new Error("too many decimal places");
  return BigInt(whole + frac.padEnd(decimals, "0"));
}

export function formatUnits(value, decimals = 18) {
  if (!Number.isInteger(decimals) || decimals < 0) throw new Error("invalid decimals");
  const negative = BigInt(value) < 0n;
  const amount = negative ? -BigInt(value) : BigInt(value);
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const frac = (amount % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  const text = frac ? `${whole}.${frac}` : String(whole);
  return negative ? `-${text}` : text;
}

function toBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") return new TextEncoder().encode(value);
  throw new Error("expected bytes or a string");
}

function readLane(bytes, offset) {
  let lane = 0n;
  for (let i = 0; i < 8; i += 1) lane |= BigInt(bytes[offset + i]) << BigInt(8 * i);
  return lane;
}

function writeLane(bytes, offset, lane) {
  for (let i = 0; i < 8; i += 1) bytes[offset + i] = Number((lane >> BigInt(8 * i)) & 0xffn);
}

function rotl(value, bits) {
  return ((value << BigInt(bits)) | (value >> BigInt(64 - bits))) & 0xffffffffffffffffn;
}

function permute(state) {
  for (let round = 0; round < 24; round += 1) {
    const c = new BigUint64Array(5);
    for (let x = 0; x < 5; x += 1) {
      c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    for (let x = 0; x < 5; x += 1) {
      const t = c[(x + 4) % 5] ^ rotl(c[(x + 1) % 5], 1);
      for (let y = 0; y < 25; y += 5) state[y + x] ^= t;
    }
    let t = state[1];
    for (let i = 0; i < 24; i += 1) {
      const j = PILN[i];
      const next = state[j];
      state[j] = rotl(t, ROTC[i]);
      t = next;
    }
    for (let y = 0; y < 25; y += 5) {
      const row = state.slice(y, y + 5);
      for (let x = 0; x < 5; x += 1) {
        state[y + x] = row[x] ^ ((~row[(x + 1) % 5]) & row[(x + 2) % 5]);
      }
    }
    state[0] ^= RC[round];
  }
}
