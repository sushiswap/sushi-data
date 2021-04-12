const pageResults = require('graph-results-pager');

// accessed by chainId
const ENDPOINTS = {
  1: 'https://api.thegraph.com/subgraphs/name/sushiswap/bentobox',
  250: 'https://api.thegraph.com/subgraphs/name/sushiswap/fantom-bentobox',
  56: 'https://api.thegraph.com/subgraphs/name/sushiswap/bsc-bentobox',
  137: 'https://api.thegraph.com/subgraphs/name/sushiswap/matic-bentobox',
  100: 'https://api.thegraph.com/subgraphs/name/sushiswap/xdai-bentobox',
}

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

}

const clones = {
  properties: [
    'id',
    'block',
    'timestamp'
  ],

  callback(results) {
    return results.map(({ id, block, timestamp }) => ({
      address: id,
      block: Number(block),
      timestamp: Number(timestamp)
    }));
  }
}
