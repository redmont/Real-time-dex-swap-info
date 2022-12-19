require("dotenv").config();
const {
    Token,
    ChainId,
    Pair,
    CurrencyAmount,
    Route,
    Trade,
    TradeType,
    Percent,
} = require(`@sushiswap/sdk`);
const ethers = require(`ethers`);
const uniswapV2Pair = require("@uniswap/v2-core/build/IUniswapV2Pair.json");
const JSBI = require("jsbi");
const {getTokenInfo} = require("erc20-token-list");
const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);

function decimalize(amount, decimals) {
    return JSBI.multiply(
        JSBI.BigInt(amount),
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))
    );
}
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

const pairAddress = Pair.getAddress(token0, token1);
const uniV2PairContract = new ethers.Contract(pairAddress, uniswapV2Pair.abi, provider);

const SushiDirect = async (tokenA, tokenB) => {
    const reserves = await uniV2PairContract.getReserves();
    const token0Address = await uniV2PairContract.token0();
    const token1Address = await uniV2PairContract.token1();
    const token0 = [tokenA, tokenB].find((token) => token.address === token0Address);
    const token1 = [tokenA, tokenB].find((token) => token.address === token1Address);
    const pair = new Pair(
        CurrencyAmount.fromRawAmount(token0, reserves.reserve0.toString()),
        CurrencyAmount.fromRawAmount(token1, reserves.reserve1.toString())
    );

    const amountIn = ethers.utils.parseUnits(process.env.AMOUNT_IN, token0info.decimals);
    const inputAmount = CurrencyAmount.fromRawAmount(token0, amountIn);
    const trade = Trade.bestTradeExactIn([pair], inputAmount, tokenB, {
        maxHops: 3,
        maxNumResults: 1,
    });
    let msg = {DEX: "Sushi swap - Single pool swap"};
    msg.timestamp = new Date().toString();
    msg[`Expected Output`] = trade[0].outputAmount.toFixed(6);
    msg[`Minimum amount after slippage`] = trade[0]
        .minimumAmountOut(new Percent(parseInt(process.env.SLIPPAGE_TOLERANCE), 100))
        .toFixed(6);
    msg[`Price Impact`] = trade[0].priceImpact.toFixed(6);
    msg[`Execution Price`] = trade[0].executionPrice.toFixed(6);

    return msg;
};

module.exports = {SushiDirect};
