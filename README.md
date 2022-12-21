# Real-time-dex-swap-info

To run

```
npm install
AMOUNT_IN=10 TOKEN0=WETH TOKEN1=USDT node index.js
```


Make sure to add a .env file at root and add these parameters

```
INFURA_URL=""
CHAIN_ID=1
SLIPPAGE_TOLERANCE=1
TRANSACTION_DEADLINE=1800
TIMEOUT=1000
```

Sample Output:
```
{
  DEX: 'Uniswap V3 - Auto Router (multipool route)',
  timestamp: 'Wed Dec 21 2022 14:34:25 GMT+0530 (India Standard Time)',
  'Quote Exact': 121450.126085,
  'Minimum amount out after slippage': 120247.649589,
  'Gas Adjusted Quote': 121444.835895,
  'Price Impact': 0.116357,
  'Gas Used': 368000,
  'Gas Price': 11.909415537,
  'Gas Fee in ETH': 0.004382664917615999,
  'Gas Used USD': 5.332562
}
{
  DEX: 'Sushi swap - multi hop (auto)',
  timestamp: 'Wed Dec 21 2022 14:34:19 GMT+0530 (India Standard Time)',
  'Expected Output': 119562.898735,
  'Minimum amount after slippage': 118367.269748,
  'Liquidity Provider Fee': 0.3,
  'Route Path': 'WETH > USDT',
  'Gas Used': 157339,
  'Gas Price': 12.829838794,
  'Gas Fee in ETH': 0.0020186340060091663,
  'Gas Fee in USD': 2.4523980812204162
}
```

Additional parameters

```
SLIPPAGE_TOLERANCE=1
TRANSACTION_DEADLINE=1800
TIMEOUT=1000 // ms between consecutive calls
```
