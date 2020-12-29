module.exports = {
    graphAPIEndpoints: {
        masterchef: 'https://api.thegraph.com/subgraphs/name/sushiswap/master-chef',
        bar: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-bar',
        timelock: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-timelock',
        maker: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-maker',
        exchange: 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange',
        blocklytics: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks'
    },

    graphWSEndpoints: {
        bar: 'wss://api.thegraph.com/subgraphs/name/sushiswap/sushi-bar',
        exchange: 'wss://api.thegraph.com/subgraphs/name/sushiswap/exchange',
        blocklytics: 'wss://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks'
    }
}