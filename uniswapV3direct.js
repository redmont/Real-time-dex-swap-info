const {ethers, BigNumber} = require("ethers");
require("dotenv").config();
const JSBI = require("jsbi");
const {
    Pool,
    FeeAmount,
    TickMath,
    TickListDataProvider,
    nearestUsableTick,
    Tick,
    Trade,
    TICK_SPACINGS,
    Route,
} = require("@uniswap/v3-sdk");
const {CurrencyAmount, Percent, Token, TradeType} = require("@uniswap/sdk-core");
const {
    abi: IUniswapV3PoolABI,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {
    abi: UniswapV3Factory,
} = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");

const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);

const {addresses} = require("./Utility.js");

const factoryContract = new ethers.Contract(addresses.UniswapV3Factory, UniswapV3Factory, provider);

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
    // note that data here can be desynced if the call executes over the span of two or more blocks.
    const [liquidity, slot] = await Promise.all([poolContract.liquidity(), poolContract.slot0()]);
    return {
        liquidity,
        sqrtPriceX96: slot[0],
        tick: slot[1],
        observationIndex: slot[2],
        observationCardinality: slot[3],
        observationCardinalityNext: slot[4],
        feeProtocol: slot[5],
        unlocked: slot[6],
    };
}

async function getPool(tokenA, tokenB, fee) {
    const poolAddress = await factoryContract.getPool(tokenA.address, tokenB.address, fee);
    if (poolAddress === ethers.constants.AddressZero) return false;
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
        tokenA,
        tokenB,
        immutables.fee,
        state.sqrtPriceX96.toString(),
        state.liquidity.toString(),
        state.tick,
        tickListDataProvider
    );
    return pool;
}

const UniswapV3direct = async (tokenA, tokenB) => {
    const amountIn = ethers.utils.parseUnits(process.env.AMOUNT_IN, tokenA.decimals);
    let msg = {DEX: "Uniswap V3 - Single pool swap"};

    await Promise.all([
        getPool(tokenA, tokenB, FeeAmount.LOW),
        getPool(tokenA, tokenB, FeeAmount.MEDIUM),
        getPool(tokenA, tokenB, FeeAmount.HIGH),
    ]).then(async (pools) => {
        pools = pools.filter((pool) => {
            return pool !== false ? pool : false;
        });
        //const tradeObject = new Trade();

        const trade = await Trade.bestTradeExactIn(
            [pools[1]],
            CurrencyAmount.fromRawAmount(tokenA, amountIn),
            tokenB,
            {maxNumResults: 1, maxHops: pools.length}
        );

        //console.log(trade[0].swaps[0].route.pools);

        msg.timestamp = new Date().toString();
        msg[`Output Amount`] = parseFloat(trade[0].outputAmount.toFixed(6));
        msg[`Minimum amount out after slippage`] = parseFloat(
            trade[0]
                .minimumAmountOut(new Percent(parseInt(process.env.SLIPPAGE_TOLERANCE), 100))
                .toFixed()
        );
        //msg[`Execution Price`] = parseFloat(trade[0].executionPrice.toFixed(6));
        msg[`Price Impact`] = parseFloat(trade[0].priceImpact.toFixed(6));
        msg["Liquidity Provider Fee"] =
            parseFloat(trade[0]?.swaps[0]?.route?.pools[0]?.fee) / 10000;
    });
    return msg;
};

module.exports = {UniswapV3direct};
