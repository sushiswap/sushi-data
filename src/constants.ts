export const graphAPIEndpoints = {
    masterchef: 'https://api.thegraph.com/subgraphs/name/sushiswap/master-chef',
    bar: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-bar',
    timelock: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-timelock',
    maker: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-maker',
    exchange: {
        1: 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange',
        137: 'https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange'
    },
    exchange_v1: 'https://api.thegraph.com/subgraphs/name/jiro-ono/sushiswap-v1-exchange',
    blocklytics: {
        1: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
        137: 'https://api.thegraph.com/subgraphs/name/lufycz/blocklytics-matic'
    },
    lockup: 'https://api.thegraph.com/subgraphs/name/matthewlilley/lockup',
    bentobox: 'https://api.thegraph.com/subgraphs/name/jiro-ono/bento',
    vesting: {
        "direct": 'https://api.thegraph.com/subgraphs/name/sushiswap/vesting',
        "protocol": "https://api.thegraph.com/subgraphs/name/sushiswap/vesting"
    }
};

export const graphWSEndpoints = {
    bar: 'wss://api.thegraph.com/subgraphs/name/sushiswap/sushi-bar',
    exchange: {
        1: 'wss://api.thegraph.com/subgraphs/name/sushiswap/exchange',
        137: 'wss://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange'
    },
    blocklytics: {
        1: 'wss://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
        137: 'wss://api.thegraph.com/subgraphs/name/lufycz/blocklytics-matic',
    }
};

export const barAddress = "0x8798249c2e607446efb7ad49ec89dd1865ff4272";
export const makerAddress = {
    1: "0xe11fc0b43ab98eb91e9836129d1ee7c3bc95df50",
    137: "0xcc159bcb6a466da442d254ad934125f05dab66b5"
}
export const chefAddress = "0xc2edad668740f1aa35e4d8f227fb8e17dca888cd";
export const sushiAddress = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2";
export const factoryAddress = "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac";

export const TWENTY_FOUR_HOURS = 86400;