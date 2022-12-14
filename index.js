const {ethers} = require("ethers");
const {
    Route,
    Trade,
    FeeAmount,
    nearestUsableTick,
    Pool,
    TickMath,
    TickListDataProvider,
    Tick,
    TICK_SPACINGS,
} = require("@uniswap/v3-sdk");
const {TradeType, CurrencyAmount, Token, Percent} = require("@uniswap/sdk-core");
const {AlphaRouter} = require("@uniswap/smart-order-router");

require("dotenv").config();
const JSBI = require("jsbi");

const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);
const router = new AlphaRouter({chainId: 1, provider: provider});

const amountIn = ethers.utils.parseEther(process.env.AMOUNT_IN);

//const fees = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];
const fees = [FeeAmount.MEDIUM];

const token0 = new Token(
    Number(process.env.CHAIN_ID),
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    18,
    "WETH",
    "Wrapped Ether"
);

const token1 = new Token(
    Number(process.env.CHAIN_ID),
    "0x6b175474e89094c44da98b954eedeac495271d0f",
    18,
    "DAI",
    "Dai Stable Coin"
);

const init = async (fee) => {
    const token0Amount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(amountIn));
    const route1 = await router.route(token0Amount, token1, TradeType.EXACT_INPUT);

    console.log(`Quote Exact In: ${route1.quote.toFixed(2)}`);
    console.log(`Gas Adjusted Quote In: ${route1.quoteGasAdjusted.toFixed(2)}`);
    console.log(`Gas Used USD: ${route1.estimatedGasUsedUSD.toFixed(6)}`);
    console.log(`Price Impact: ${route1.trade.priceImpact.toFixed(2)}`);
    console.log(JSON.stringify(route1, null, 2));
};

fees.forEach((fee) => {
    init(fee);
});
