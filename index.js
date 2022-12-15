const {ethers} = require("ethers");
const {TradeType, CurrencyAmount, Token, Percent} = require("@uniswap/sdk-core");
const {AlphaRouter} = require("@uniswap/smart-order-router");

require("dotenv").config();
const JSBI = require("jsbi");
const {getTokenInfo} = require("erc20-token-list");

const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);
const router = new AlphaRouter({chainId: 1, provider: provider});

const [token0info, token1info] = [
    getTokenInfo(process.env.TOKEN0),
    getTokenInfo(process.env.TOKEN1),
];

const token0 = new Token(
    Number(process.env.CHAIN_ID),
    token0info.address,
    token0info.decimals,
    token0info.symbol,
    token0info.name
);

const token1 = new Token(
    Number(process.env.CHAIN_ID),
    token1info.address,
    token1info.decimals,
    token1info.symbol,
    token1info.name
);

const amountIn = ethers.utils.parseUnits(process.env.AMOUNT_IN, token0info.decimals);

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let count = 0;

const init = async (token0, token1) => {
    console.log(
        `[${count}] Fetching updated details for ${token0info.symbol}/${token1info.symbol} ...`
    );

    const token0Amount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(amountIn));
    const route = await router.route(token0Amount, token1, TradeType.EXACT_INPUT, {
        type: 0,
        slippageTolerance: new Percent(parseInt(process.env.SLIPPAGE_TOLERANCE), 100),
        deadline: Math.floor(Date.now() / 1000 + parseInt(process.env.TRANSACTION_DEADLINE)),
    });

    console.log(`=========================================`);
    console.log(`${new Date().toString()}\n`);
    console.log(`Quote Exact: ${route.quote.toFixed(2)} ${token1info.symbol}`);
    console.log(`Gas Adjusted Quote: ${route.quoteGasAdjusted.toFixed(2)} ${token1info.symbol}`);
    console.log(`Gas Used USD: ${route.estimatedGasUsedUSD.toFixed(6)}`);
    console.log(`Price Impact: ${route.trade.priceImpact.toFixed(2)}`);
    console.log(`\n`);
    console.log(`Gas Used: ${route.estimatedGasUsed}`);
    console.log(`Gas Price: ${ethers.utils.formatUnits(route.gasPriceWei, "gwei")} gwei`);
    console.log(`=========================================\n`);
    await timeout(1000);
    count++;
    await init(token0, token1);
};

console.log(`\n=========================================`);
console.log(`Pair: ${token0info.symbol}/${token1info.symbol}`);
console.log(`Input: ${process.env.AMOUNT_IN} ${token0info.symbol}`);
console.log(`SLIPPAGE TOLERANCE: ${process.env.SLIPPAGE_TOLERANCE}%`);
console.log(`TRANSACTION DEADLINE: ${process.env.TRANSACTION_DEADLINE} sec`);
console.log(`=========================================\n\n`);

init(token0, token1);
