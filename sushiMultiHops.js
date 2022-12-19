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
            slippage: process.env.SLIPPAGE_TOLERANCE,
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
        const gasPriceInETH = ethers.utils.formatUnits(
            BigNumber.from(global.feeData.gasPrice).toString(),
            "ether"
        );

        const gasFeeInGwei = ethers.utils.formatUnits(global.feeData.gasPrice, "gwei");

        msg["Gas Price"] = parseFloat(ethers.utils.formatUnits(global.feeData.gasPrice, "gwei"));
        msg["Gas Fee in ETH"] = (gasFeeInGwei * gasUsed) / 10 ** 9;
        // const gasFeeETH = BigNumber.from(gasUsed); //.mul();
        //console.log(gasFeeETH);
    } catch (error) {}

    /*const gasPrice = await global.provider.getGasPrice();

    msg[`Gas Price`] = parseFloat(
        BigNumber.from(gasPrice).div(BigNumber.from(10).pow(9)).toString()
    );*/

    return msg;
};

module.exports = {SushiMultiHops};
