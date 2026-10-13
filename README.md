# evm-units

Checksum an Ethereum address and convert between decimal amounts and wei. It does not talk to a node, hold a key, or send a transaction.

```js
import { toChecksumAddress, isChecksumAddress, parseUnits, formatUnits } from "evm-units";

toChecksumAddress("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed");
// 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed

parseUnits("1.5", 18);   // 1500000000000000000n
formatUnits(1n, 18);     // "0.000000000000000001"
```

`parseUnits` rejects extra decimal places instead of rounding. `parseUnits("1.234", 2)` throws. `isChecksumAddress` is false for an all-lowercase address. The checksum follows EIP-55.

```bash
npm test
```

## License

MIT © Song Xiangrong
