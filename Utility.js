const {getTokenInfo} = require("erc20-token-list");
const {Token} = require("@uniswap/sdk-core");

module.exports = {
    getTokenFromSymbol: (symbol) => {
        const tokenInfo = getTokenInfo(symbol);
        return new Token(
            Number(process.env.CHAIN_ID),
            tokenInfo.address,
            tokenInfo.decimals,
            tokenInfo.symbol,
            tokenInfo.name
        );
    },
    addresses: {
        UniswapV3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    },
};
