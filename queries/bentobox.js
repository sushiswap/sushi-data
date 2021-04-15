const pageResults = require('graph-results-pager')

const { request, gql } = require('graphql-request')

const { priceUSD: sushiPriceUSD } = require('./sushi')
const { token: tokenInfo } = require('./exchange')
const { ethPrice: ethPriceUSD } = require('./exchange')
const { info: masterChefInfo } = require('./masterchef')
const { pool: chefPool } = require('./masterchef')

// accessed by chainId
const ENDPOINTS = {
  1: 'https://api.thegraph.com/subgraphs/name/sushiswap/bentobox',
  250: 'https://api.thegraph.com/subgraphs/name/sushiswap/fantom-bentobox',
  56: 'https://api.thegraph.com/subgraphs/name/sushiswap/bsc-bentobox',
  137: 'https://api.thegraph.com/subgraphs/name/sushiswap/matic-bentobox',
  100: 'https://api.thegraph.com/subgraphs/name/sushiswap/xdai-bentobox',
}

const MASTER_CONTRACT = '0x2cba6ab6574646badc84f0544d05059e57a5dc42'

module.exports = {
  async clones({ masterAddress = undefined, chainId = undefined } = {}) {
    if(!masterAddress) { throw new Error("sushi-data: Master Address undefined"); }
    if(!chainId) { throw new Error("sushi-data: Chain Id undefined"); }

    return pageResults({
      api: ENDPOINTS[chainId],
      query: {
        entity: 'clones',
        selection: {
          where: {
            masterContract: `\\"${masterAddress.toLowerCase()}\\"`
          }
        },
        properties: clones.properties
      }
    })
      .then(results => clones.callback(results))
      .catch(err => console.log(err));
  },

  async kashiStakedInfo() {
    const result = await request(ENDPOINTS[1],
      gql`{
            kashiPairs(where: {masterContract: "${MASTER_CONTRACT}"}) {
              ${kashiStakedInfo.properties.toString()}
            }
          }`
    );

    result.sushiUSD = await sushiPriceUSD();
    result.ethUSD = await ethPriceUSD();
    let masterChef = await masterChefInfo();
    result.totalAP = masterChef.totalAllocPoint;
    result.sushiPerBlock = masterChef.sushiPerBlock;

    return kashiStakedInfo.callback(result)
  },

}

const clones = {
  properties: [
    'id',
    'data'
  ],

  callback(results) {
    return results.map(({ id, data, block, timestamp }) => ({
      address: id,
      data: data
    }));
  }
}

const kashiStakedInfo = {
  properties: [
    'id',
    'name',
    'symbol',
    'asset { id, symbol, decimals }',
    'collateral { id, symbol, decimals }',
    'totalAssetBase',
    'totalAssetElastic'
  ],

  async callback(results) {
    return await Promise.all(results.kashiPairs.map(async (result) => {
      let asset = await tokenInfo({ token_address: result.asset.id });
      let chefPool = await masterchef.pool({ pool_address: result.id });
      let stakedAmt = chefPool.slpBalance;
      let balanceUSD = (result.stakedAmt / (10 ** result.asset.decimals)) * asset.derivedETH * results.ethUSD;
      let rewardPerBlock = ((1 / results.totalAP) * results.sushiPerBlock);
      let roiPerBlock = (rewardPerBlock * results.sushiUSD) / balanceUSD;
      let roiPerYear = roiPerBlock * 6500 * 365

      return {
        id: result.id,
        name: result.name,
        symbol: result.symbol,
        asset: result.asset.id,
        assetSymbol: result.asset.symbol,
        assetDecimals: Number(result.asset.decimals),
        collateral: result.collateral.id,
        collateralSymbol: result.collateral.symbol,
        collateralDecimals: Number(result.collateral.decimals),
        totalAssetBase: Number(result.totalAssetBase),
        totalAssetElastic: Number(result.totalAssetElastic),
        assetDecimals: Number(result.asset.decimals),
        balanceUSD: balanceUSD,
        rewardPerBlock: rewardPerBlock,
        roiPerBlock: roiPerBlock,
        roiPerYear: roiPerYear
      }
    }));
  }
}
