require("dotenv").config();
const {
    SushiswapPair,
    ChainId,
    TradeContext,
    SushiswapPairSettings,
} = require("simple-sushiswap-sdk");
const {ethers, BigNumber} = require("ethers");

const SushiMultiHops = async (tokenA, tokenB) => {
    const sushiswapPair = new SushiswapPair({
        fromTokenContractAddress: tokenA.address,
        toTokenContractAddress: tokenB.address,
        ethereumAddress: "0xB1E6079212888f0bE0cf55874B2EB9d7a5e02cD9",
        providerUrl: process.env.INFURA_URL,
        chainId: ChainId.MAINNET,
        settings: new SushiswapPairSettings({
            slippage: process.env.SLIPPAGE_TOLERANCE / 100,
            deadlineMinutes: process.env.TRANSACTION_DEADLINE,
            disableMultihops: false,
        }),
    });

    const sushiswapPairFactory = await sushiswapPair.createFactory();
    const trade = await sushiswapPairFactory.trade(process.env.AMOUNT_IN);

    let msg = {DEX: "Sushi swap - multi hop (auto)"};
    msg.timestamp = new Date().toString();
    msg["Expected Output"] = parseFloat(trade.expectedConvertQuote);
    msg["Minimum amount after slippage"] = parseFloat(trade.minAmountConvertQuote);
    msg["Liquidity Provider Fee"] = parseFloat(trade.liquidityProviderFee) * 100;
    msg["Route Path"] = trade.routeText;
    try {
        const gasUsed = await global.provider.estimateGas({
            to: trade.transaction.to,
            data: trade.transaction.data,
            value: trade.transaction.value,
        });
        msg["Gas Used"] = parseFloat(BigNumber.from(gasUsed).toString());

        let gasFeeInGwei = BigNumber.from(global.feeData.lastBaseFeePerGas).add(
            BigNumber.from(global.feeData.maxPriorityFeePerGas)
        );
        gasFeeInGwei = parseFloat(ethers.utils.formatUnits(gasFeeInGwei, "gwei"));
        msg["Gas Price"] = gasFeeInGwei;
        const gasFeeInETH = (gasFeeInGwei * gasUsed) / 10 ** 9;
        msg["Gas Fee in ETH"] = gasFeeInETH;
        msg["Gas Fee in USD"] = global.currentETHUSDPrice * gasFeeInETH;
    } catch (error) {}

    return msg;
};

module.exports = {SushiMultiHops};
