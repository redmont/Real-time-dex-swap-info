const {ethers} = require("ethers");
const {TradeType, CurrencyAmount, Token, Percent} = require("@uniswap/sdk-core");
const {AlphaRouter} = require("@uniswap/smart-order-router");
const {getTokenFromSymbol} = require("./Utility.js");
require("dotenv").config();
const JSBI = require("jsbi");

const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);
const router = new AlphaRouter({chainId: 1, provider: provider});

const token0info = getTokenFromSymbol(process.env.TOKEN0);
const token1info = getTokenFromSymbol(process.env.TOKEN1);

const amountIn = ethers.utils.parseUnits(process.env.AMOUNT_IN, token0info.decimals);

const UniswapV3AutoRouter = async (token0, token1) => {
    const token0Amount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(amountIn));
    const route = await router.route(token0Amount, token1, TradeType.EXACT_INPUT, {
        type: 0,
        slippageTolerance: new Percent(parseInt(process.env.SLIPPAGE_TOLERANCE), 100),
        deadline: Math.floor(Date.now() / 1000 + parseInt(process.env.TRANSACTION_DEADLINE)),
    });

    let msg = {DEX: "Uniswap V3 - Auto Router (multipool route)"};

    msg.timestamp = new Date().toString();
    msg[`Quote Exact`] = parseFloat(route.quote.toFixed(6));
    msg[`Minimum amount out after slippage`] = parseFloat(
        route.trade
            .minimumAmountOut(new Percent(parseInt(process.env.SLIPPAGE_TOLERANCE), 100))
            .toFixed()
    );
    msg[`Gas Adjusted Quote`] = parseFloat(route.quoteGasAdjusted.toFixed(6));
    msg[`Price Impact`] = parseFloat(route.trade.priceImpact.toFixed(6));
    msg[`Gas Used`] = parseFloat(route.estimatedGasUsed.toString());
    msg[`Gas Price`] = parseFloat(ethers.utils.formatUnits(route.gasPriceWei, "gwei"));

    const gasFeeInGwei = ethers.utils.formatUnits(route.gasPriceWei, "gwei");
    msg["Gas Fee in ETH"] = (gasFeeInGwei * route.estimatedGasUsed) / 10 ** 9;
    msg[`Gas Used USD`] = parseFloat(route.estimatedGasUsedUSD.toFixed(6));

    //msg[`Execution Price`] = parseFloat(route.trade.executionPrice.toFixed(6));

    return msg;
    //await timeout(1000);
    //count++;
    //await init(token0, token1);
};

module.exports = {UniswapV3AutoRouter};
