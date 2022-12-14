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

const {
    abi: IUniswapV3PoolABI,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {
    abi: UniswapV3Factory,
} = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");

const {addresses} = require("./Utility.js");

const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);
const router = new AlphaRouter({chainId: 1, provider: provider});

const factoryContract = new ethers.Contract(addresses.UniswapV3Factory, UniswapV3Factory, provider);

const amountIn = ethers.utils.parseEther(process.env.AMOUNT_IN);

//const fees = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];
const fees = [FeeAmount.MEDIUM];

async function getPoolImmutables(poolContract) {
    const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] = await Promise.all([
        poolContract.factory(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.tickSpacing(),
        poolContract.maxLiquidityPerTick(),
    ]);
    return {
        factory,
        token0,
        token1,
        fee,
        tickSpacing,
        maxLiquidityPerTick,
    };
}

async function getPoolState(poolContract) {
    const [liquidity, slot] = await Promise.all([poolContract.liquidity(), poolContract.slot0()]);

    const PoolState = {
        liquidity,
        sqrtPriceX96: slot[0],
        tick: slot[1],
        observationIndex: slot[2],
        observationCardinality: slot[3],
        observationCardinalityNext: slot[4],
        feeProtocol: slot[5],
        unlocked: slot[6],
    };

    return PoolState;
}
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
    const wethAmount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(amountIn));
    const route1 = await router.route(wethAmount, token1, TradeType.EXACT_INPUT);

    console.log(`Quote Exact In: ${route1.quote.toFixed(2)}`);
    console.log(`Gas Adjusted Quote In: ${route1.quoteGasAdjusted.toFixed(2)}`);
    console.log(`Gas Used USD: ${route1.estimatedGasUsedUSD.toFixed(6)}`);
    console.log(`Price Impact: ${route1.trade.priceImpact.toFixed(2)}`);
    //console.log(JSON.stringify(route1, null, 2));
    //console.log(route1);
    return;
    console.log("INPUT " + token0.symbol + " : " + ethers.utils.formatUnits(amountIn, "ether"));

    const poolAddress = await factoryContract.getPool(token0.address, token1.address, fee);
    const poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider);

    const [immutables, state] = await Promise.all([
        getPoolImmutables(poolContract),
        getPoolState(poolContract),
    ]);

    const tickListDataProvider = new TickListDataProvider(
        [
            {
                index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[fee]),
                liquidityNet: state.liquidity.toString(),
                liquidityGross: state.liquidity.toString(),
            },
            {
                index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[fee]),
                liquidityNet: JSBI.multiply(
                    JSBI.BigInt(state.liquidity.toString()),
                    JSBI.BigInt(-1)
                ),

                liquidityGross: state.liquidity.toString(),
            },
        ],
        TICK_SPACINGS[fee]
    );

    const pool = new Pool(
        token0,
        token1,
        fee,
        state.sqrtPriceX96.toString(),
        state.liquidity.toString(),
        state.tick,
        tickListDataProvider
    );

    const route = new Route([pool], token0, token1);

    const trade = await Trade.fromRoute(
        route,
        CurrencyAmount.fromRawAmount(token0, amountIn),
        TradeType.EXACT_INPUT
    );
    console.log("Fee: " + fee);
    console.log(trade.outputAmount.toExact() + " " + token1.symbol);
    console.log("Price Impact: " + trade.priceImpact.toSignificant(3));
};

fees.forEach((fee) => {
    init(fee);
});
