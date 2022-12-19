require("dotenv").config();
const {ethers} = require("ethers");
const {getTokenFromSymbol} = require("./Utility.js");
const token0info = getTokenFromSymbol(process.env.TOKEN0);
const token1info = getTokenFromSymbol(process.env.TOKEN1);

const {UniswapV3AutoRouter} = require("./uniswapV3AutoRouter");
const {UniswapV3direct} = require("./uniswapV3direct.js");
const {SushiMultiHops} = require("./sushiMultiHops.js");
const {SushiDirect} = require("./sushiDirect.js");

global.provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let count = 0;

console.log(`\n=========================================`);
console.log(`Pair: ${token0info.symbol}/${token1info.symbol}`);
console.log(`Input: ${process.env.AMOUNT_IN} ${token0info.symbol}`);
console.log(`Slippage Tolerance: ${process.env.SLIPPAGE_TOLERANCE}%`);
console.log(`Transaction Deadline: ${process.env.TRANSACTION_DEADLINE} sec`);
console.log(`Call intervals: ${process.env.TIMEOUT}s`);
console.log(`=========================================\n\n`);

const init = async () => {
    console.log(
        `\n[${count}] Fetching updated details for ${token0info.symbol}/${token1info.symbol} ...\n`
    );

    global.feeData = await global.provider.getFeeData();
    console.log(`gasPrice: ${ethers.utils.formatUnits(global.feeData.gasPrice, "gwei")} gwei`);
    console.log(
        `lastBaseFeePerGas: ${ethers.utils.formatUnits(
            global.feeData.lastBaseFeePerGas,
            "gwei"
        )} gwei`
    );
    console.log(
        `maxPriorityFeePerGas: ${ethers.utils.formatUnits(
            global.feeData.maxPriorityFeePerGas,
            "gwei"
        )} gwei`
    );

    let [uniswapV3AutoRouter, uniswapV3direct, sushiMultiHops, sushiDirect] = await Promise.all([
        UniswapV3AutoRouter(token0info, token1info),
        SushiMultiHops(token0info, token1info),
        UniswapV3direct(token0info, token1info),
        SushiDirect(token0info, token1info),
    ]);

    console.log(uniswapV3AutoRouter);
    console.log(uniswapV3direct);
    console.log(sushiMultiHops);
    console.log(sushiDirect);

    await timeout(process.env.TIMEOUT || 1000);
    count++;
    await init();
};
init();
