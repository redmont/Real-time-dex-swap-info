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
const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);

const SushiDirect = async (tokenA, tokenB) => {
    const pairAddress = Pair.getAddress(tokenA, tokenB);
    const uniV2PairContract = new ethers.Contract(pairAddress, uniswapV2Pair.abi, provider);

    const reserves = await uniV2PairContract.getReserves();
    const token0Address = await uniV2PairContract.token0();
    const token1Address = await uniV2PairContract.token1();

    const token0 = [tokenA, tokenB].find((token) => token.address === token0Address);
    const token1 = [tokenA, tokenB].find((token) => token.address === token1Address);
    const pair = new Pair(
        CurrencyAmount.fromRawAmount(token0, reserves.reserve0.toString()),
        CurrencyAmount.fromRawAmount(token1, reserves.reserve1.toString())
    );

    const amountIn = ethers.utils.parseUnits(process.env.AMOUNT_IN, tokenA.decimals);
    const inputAmount = CurrencyAmount.fromRawAmount(token0, amountIn);
    const trade = Trade.bestTradeExactIn([pair], inputAmount, tokenB, {
        maxHops: 3,
        maxNumResults: 1,
    });
    let msg = {DEX: "Sushi swap - Single pool swap"};
    msg.timestamp = new Date().toString();
    if (!trade[0]) return msg;

    msg[`Expected Output`] = parseFloat(trade[0].outputAmount.toFixed(6));
    msg[`Minimum amount after slippage`] = parseFloat(
        trade[0]
            .minimumAmountOut(new Percent(parseInt(process.env.SLIPPAGE_TOLERANCE), 100))
            .toFixed(6)
    );
    msg[`Price Impact`] = parseFloat(trade[0].priceImpact.toFixed(6));
    msg["Liquidity Provider Fee"] = 0.3;
    msg[`Execution Price`] = parseFloat(trade[0].executionPrice.toFixed(6));

    return msg;
};

module.exports = {SushiDirect};
