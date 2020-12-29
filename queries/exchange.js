const pageResults = require('graph-results-pager');

const ws = require('isomorphic-ws');
const { SubscriptionClient } = require('subscriptions-transport-ws'); 

const { request, gql } = require('graphql-request');

const { graphAPIEndpoints, graphWSEndpoints } = require('./../constants')
const { timestampToBlock, blockToTimestamp } = require('./../utils');

module.exports = {
    async token({block = undefined, timestamp = undefined, token_address = undefined} = {}) {
        if(!token_address) { throw new Error("sushi-data: Token address undefined"); }

        block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
        block = block ? `block: { number: ${block} }` : "";

        const result = await request(graphAPIEndpoints.exchange,
            gql`{
                    token(id: "${token_address.toLowerCase()}", ${block}) {
                        ${tokens.properties.toString()}
                    }
                }`
        );

        return tokens.callback([result.token])[0];
    },

    observeToken({token_address = undefined}) {
        if(!token_address) { throw new Error("sushi-data: Token address undefined"); }

        const query = gql`
            subscription {
                token(id: "${token_address.toLowerCase()}") {
                    ${tokens.properties.toString()}
                }
        }`;

        const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
        const observable = client.request({ query });

        return {
            subscribe({next, error, complete}) {
                return observable.subscribe({
                    next(results) {
                        next(tokens.callback([results.data.token])[0]);
                    },
                    error,
                    complete
                });
            }
        };
    },

    async tokens({block = undefined, timestamp = undefined} = {}) {
        return pageResults({
            api: graphAPIEndpoints.exchange,
            query: {
                entity: 'tokens',
                selection: {
                    orderBy: 'volumeUSD',
                    orderDirection: 'desc',
                },
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
                properties: tokens.properties
            }
        })
            .then(results => tokens.callback(results))
            .catch(err => console.log(err));
    },

    observeTokens() {
        const query = gql`
            subscription {
                tokens(first: 1000, orderBy: volumeUSD, orderDirection: desc) {
                    ${tokens.properties.toString()}
                }
        }`;

        const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
        const observable = client.request({ query });

        return {
            subscribe({next, error, complete}) {
                return observable.subscribe({
                    next(results) {
                        next(tokens.callback(results.data.tokens));
                    },
                    error,
                    complete
                });
            }
        };
    },

    async pair({block = undefined, timestamp = undefined, pair_address = undefined} = {}) {
        if(!pair_address) { throw new Error("sushi-data: Pair address undefined"); }

        block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
        block = block ? `block: { number: ${block} }` : "";

        const result = await request(graphAPIEndpoints.exchange,
            gql`{
                    pair(id: "${pair_address.toLowerCase()}", ${block}) {
                        ${pairs.properties.toString()}
                    }
                }`
        );

        return pairs.callback([result.pair])[0];
    },

    observePair({pair_address = undefined}) {
        if(!pair_address) { throw new Error("sushi-data: Pair address undefined"); }

        const query = gql`
            subscription {
                pair(id: "${pair_address.toLowerCase()}") {
                    ${pairs.properties.toString()}
                }
        }`;

        const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
        const observable = client.request({ query });

        return {
            subscribe({next, error, complete}) {
                return observable.subscribe({
                    next(results) {
                        next(pairs.callback([results.data.pair])[0]);
                    },
                    error,
                    complete
                });
            }
        };
    },

    async pairs({block = undefined, timestamp = undefined} = {}) {
        return pageResults({
            api: graphAPIEndpoints.exchange,
            query: {
                entity: 'pairs',
                selection: {
                    orderBy: 'reserveUSD',
                    orderDirection: 'desc',
                },
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
                properties: pairs.properties
            }
        })
            .then(results => pairs.callback(results))
            .catch(err => console.log(err));
    },

    observePairs() {
        const query = gql`
            subscription {
                pairs(first: 1000, orderBy: reserveUSD, orderDirection: desc) {
                    ${pairs.properties.toString()}
                }
        }`;

        const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
        const observable = client.request({ query });

        return {
            subscribe({next, error, complete}) {
                return observable.subscribe({
                    next(results) {
                        next(pairs.callback(results.data.pairs));
                    },
                    error,
                    complete
                });
            }
        };
    },

    async ethPrice({block = undefined, timestamp = undefined} = {}) {
        block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
        block = block ? `block: { number: ${block} }` : "";

        const result = await request(graphAPIEndpoints.exchange,
            gql`{
                    bundle(id: 1, ${block}) {
                        ${ethPrice.properties.toString()}
                    }
                }`
        );

        return ethPrice.callback(result.bundle);
    },

    observeEthPrice() {
        const query = gql`
            subscription {
                bundle(id: 1) {
                    ${ethPrice.properties.toString()}
                }
        }`;

        const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
        const observable = client.request({ query });

        return {
            subscribe({next, error, complete}) {
                return observable.subscribe({
                    next(results) {
                        next(ethPrice.callback(results.data.bundle));
                    },
                    error,
                    complete
                });
            }
        };
    },

    async factory({block = undefined, timestamp = undefined} = {}) {
        block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
        block = block ? `block: { number: ${block} }` : "";

        const result = await request(graphAPIEndpoints.exchange,
            gql`{
                    factory(id: "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac", ${block}) {
                        ${factory.properties.toString()}
                    }
                }`
        );

        return factory.callback(result.factory);
    },

    observeFactory() {
        const query = gql`
            subscription {
                factory(id: "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac") {
                    ${factory.properties.toString()}
                }
        }`;

        const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
        const observable = client.request({ query });

        return {
            subscribe({next, error, complete}) {
                return observable.subscribe({
                    next(results) {
                        next(factory.callback(results.data.factory));
                    },
                    error,
                    complete
                });
            }
        };
    },

    async dayData({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined} = {}) {
        return pageResults({
            api: graphAPIEndpoints.exchange,
            query: {
                entity: 'dayDatas',
                selection: {
                    orderBy: 'date', 
                    orderDirection: 'desc',
                    where: {
                        date_gte: minTimestamp || (minBlock ? await blockToTimestamp(minBlock) : undefined),
                        date_lte: maxTimestamp || (maxBlock ? await blockToTimestamp(maxBlock) : undefined),
                    },
                },
                properties: dayData.properties
            }
        })
        .then(results => dayData.callback(results))
        .catch(err => console.log(err));
    },
}

const tokens = {
    properties: [
        'id',
        'symbol',
        'name',
        'decimals',
        'totalSupply',
        'volume',
        'volumeUSD',
        'txCount',
        'liquidity',
        'derivedETH'
    ],

    callback(results) {
        return results.map(({ id, symbol, name, decimals, totalSupply, volume, volumeUSD, txCount, liquidity, derivedETH }) => ({
            id: id,
            symbol: symbol,
            name: name,
            decimals: Number(decimals),
            totalSupply: Number(totalSupply),
            volume: Number(volume),
            volumeUSD: Number(volumeUSD),
            txCount: Number(txCount),
            liquidity: Number(liquidity),
            derivedETH: Number(derivedETH)
        }));
    }
};

const pairs = {
    properties: [
        'id',
        'token0 { id }',
        'token1 { id }',
        'reserve0',
        'reserve1',
        'totalSupply',
        'reserveETH',
        'reserveUSD',
        'trackedReserveETH',
        'token0Price',
        'token1Price',
        'volumeToken0',
        'volumeToken1',
        'volumeUSD',
        'untrackedVolumeUSD',
        'txCount',
    ],

    callback(results) {
        return results.map(({ id, token0, token1, reserve0, reserve1, totalSupply, reserveETH, reserveUSD, trackedReserveETH, token0Price, token1Price, volumeToken0, volumeToken1, volumeUSD, untrackedVolumeUSD, txCount }) => ({
            id: id,
            token0: token0.id,
            token1: token1.id,
            reserve0: Number(reserve0),
            reserve1: Number(reserve1),
            totalSupply: Number(totalSupply),
            reserveETH: Number(reserveETH),
            reserveUSD: Number(reserveUSD),
            trackedReserveETH: Number(trackedReserveETH),
            token0Price: Number(token0Price),
            token1Price: Number(token1Price),
            volumeToken0: Number(volumeToken0),
            volumeToken1: Number(volumeToken1),
            volumeUSD: Number(volumeUSD),
            untrackedVolumeUSD: Number(untrackedVolumeUSD),
            txCount: Number(txCount),
        }));
    }
}

const ethPrice = {
    properties: [
        'ethPrice'
    ],

    callback(results) {
        return Number(results.ethPrice);
    },
}

const factory = {
    properties: [
        'pairCount',
        'volumeUSD',
        'volumeETH',
        'untrackedVolumeUSD',
        'liquidityUSD',
        'liquidityETH',
        'txCount',
        'tokenCount',
        'userCount',
    ],

    callback(results) {
        return ({
            pairCount: Number(results.pairCount),
			volumeUSD: Number(results.volumeUSD),
			volumeETH: Number(results.volumeETH),
			untrackedVolumeUSD: Number(results.untrackedVolumeUSD),
			liquidityUSD: Number(results.liquidityUSD),
			liquidityETH: Number(results.liquidityETH),
			txCount: Number(results.txCount),
			tokenCount: Number(results.tokenCount),
			userCount: Number(results.userCount),
        });
    }
};

const dayData = {
    properties: [
        'id',
        'date',
        'volumeETH',
        'volumeUSD',
        'liquidityETH',
        'liquidityUSD',
        'txCount'
    ],

    callback(results) {
        return results.map(({ id, date, volumeETH, volumeUSD, liquidityETH, liquidityUSD, txCount }) => ({
            id: Number(id),
            date: new Date(date * 1000),
            volumeETH: Number(volumeETH),
            volumeUSD: Number(volumeUSD),
            liquidityETH: Number(liquidityETH),
            liquidityUSD: Number(liquidityUSD),
            txCount: Number(txCount),
        }));
    }
};