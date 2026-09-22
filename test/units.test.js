import assert from "node:assert/strict";
import test from "node:test";
import { formatUnits, isChecksumAddress, keccak256, parseUnits, toChecksumAddress } from "../src/index.js";

test("keccak256 of empty input", () => {
  const hash = [...keccak256(new Uint8Array())]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  assert.equal(hash, "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
});

test("EIP-55 mixed-case vectors", () => {
  const vectors = [
    "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
    "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
    "0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB",
    "0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb",
  ];
  for (const address of vectors) {
    assert.equal(toChecksumAddress(address.toLowerCase()), address);
    assert.equal(isChecksumAddress(address), true);
  }
  assert.equal(isChecksumAddress("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"), false);
});

test("wei conversion does not use floating point", () => {
  assert.equal(parseUnits("1.5", 18), 1500000000000000000n);
  assert.equal(formatUnits(1500000000000000000n, 18), "1.5");
  assert.equal(formatUnits(1n, 18), "0.000000000000000001");
  assert.throws(() => parseUnits("1.234", 2), /decimal places/);
});
