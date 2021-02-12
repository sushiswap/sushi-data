const pageResults = require('graph-results-pager');

const ws = require('isomorphic-ws');
const { SubscriptionClient } = require('subscriptions-transport-ws'); 

const { request, gql } = require('graphql-request');

const { graphAPIEndpoints, graphWSEndpoints, factoryAddress, TWENTY_FOUR_HOURS } = require('./../constants')
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

    async token24h({block = undefined, timestamp = undefined, token_address = undefined} = {}) {
        if(!token_address) { throw new Error("sushi-data: Token address undefined"); }

        let timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
        timestamp24ago = timestampNow - TWENTY_FOUR_HOURS;
        timestamp48ago = timestamp24ago - TWENTY_FOUR_HOURS;

        block = timestamp ? await timestampToBlock(timestamp) : block;
        block24ago = await timestampToBlock(timestamp24ago);
        block48ago = await timestampToBlock(timestamp48ago);

        const result = await module.exports.token({block: block, token_address});
        const result24ago = await module.exports.token({block: block24ago, token_address});
        const result48ago = await module.exports.token({block: block48ago, token_address});

        const ethPriceUSD = await module.exports.ethPrice({block: block});
        const ethPriceUSD24ago = await module.exports.ethPrice({block: block24ago});

        return tokens.callback24h([result], [result24ago], [result48ago], ethPriceUSD, ethPriceUSD24ago)[0];
    },

    async tokenDayData({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, token_address = undefined} = {}) {
        if(!token_address) { throw new Error("sushi-data: Token address undefined"); }
        
        return pageResults({
            api: graphAPIEndpoints.exchange,
            query: {
                entity: 'tokenDayDatas',
                selection: {
                    orderBy: 'date', 
                    orderDirection: 'asc',
                    where: {
                        token: `\\"${token_address.toLowerCase()}\\"`,
                        date_gte: minTimestamp || (minBlock ? await blockToTimestamp(minBlock) : undefined),
                        date_lte: maxTimestamp || (maxBlock ? await blockToTimestamp(maxBlock) : undefined),
                    },
                },
                properties: tokens.propertiesDayData
            }
        })
            .then(results => tokens.callbackDayData(results))
            .catch(err => console.log(err));
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

    async tokens({block = undefined, timestamp = undefined, max = undefined} = {}) {
        return pageResults({
            api: graphAPIEndpoints.exchange,
            query: {
                entity: 'tokens',
                selection: {
                    orderBy: 'volumeUSD',
                    orderDirection: 'desc',
                    block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
                },
                properties: tokens.properties
            },
            max
        })
            .then(results => tokens.callback(results))
            .catch(err => console.log(err));
    },

    async tokens24h({block = undefined, timestamp = undefined, max = undefined} = {}) {
        let timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
        timestamp24ago = timestampNow - TWENTY_FOUR_HOURS;
        timestamp48ago = timestamp24ago - TWENTY_FOUR_HOURS;

        block = timestamp ? await timestampToBlock(timestamp) : block;
        block24ago = await timestampToBlock(timestamp24ago);
        block48ago = await timestampToBlock(timestamp48ago);

        const results = await module.exports.tokens({block: block, max});
        const results24ago = await module.exports.tokens({block: block24ago, max});
        const results48ago = await module.exports.tokens({block: block48ago, max});

        const ethPriceUSD = await module.exports.ethPrice({block: block});
        const ethPriceUSD24ago = await module.exports.ethPrice({block: block24ago});

        return tokens.callback24h(results, results24ago, results48ago, ethPriceUSD, ethPriceUSD24ago);
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

    async pair24h({block = undefined, timestamp = undefined, pair_address = undefined} = {}) {
        if(!pair_address) { throw new Error("sushi-data: Pair address undefined"); }
        
        let timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
        timestamp24ago = timestampNow - TWENTY_FOUR_HOURS;
        timestamp48ago = timestamp24ago - TWENTY_FOUR_HOURS;

        block = timestamp ? await timestampToBlock(timestamp) : block;
        block24ago = await timestampToBlock(timestamp24ago);
        block48ago = await timestampToBlock(timestamp48ago);

        const result = await module.exports.pair({block: block, pair_address});
        const result24ago = await module.exports.pair({block: block24ago, pair_address});
        const result48ago = await module.exports.pair({block: block48ago, pair_address});

        const ethPriceUSD = await module.exports.ethPrice({block: block});
        const ethPriceUSD24ago = await module.exports.ethPrice({block: block24ago});

        return pairs.callback24h([result], [result24ago], [result48ago], ethPriceUSD, ethPriceUSD24ago)[0];
    },

    async pairDayData({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, pair_address = undefined} = {}) {
        if(!pair_address) { throw new Error("sushi-data: Pair address undefined"); }
        
        return pageResults({
            api: graphAPIEndpoints.exchange,
            query: {
                entity: 'pairDayDatas',
                selection: {
                    orderBy: 'date', 
                    orderDirection: 'asc',
                    where: {
                        pair: `\\"${pair_address.toLowerCase()}\\"`,
                        date_gte: minTimestamp || (minBlock ? await blockToTimestamp(minBlock) : undefined),
                        date_lte: maxTimestamp || (maxBlock ? await blockToTimestamp(maxBlock) : undefined),
                    },
                },
                properties: pairs.propertiesDayData
            }
        })
            .then(results => pairs.callbackDayData(results))
            .catch(err => console.log(err));
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

    async pairs({block = undefined, timestamp = undefined, max = undefined} = {}) {
        return pageResults({
            api: graphAPIEndpoints.exchange,
            query: {
                entity: 'pairs',
                selection: {
                    orderBy: 'reserveUSD',
                    orderDirection: 'desc',
                    block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
                },
                properties: pairs.properties
            },
            max
        })
            .then(results => pairs.callback(results))
            .catch(err => console.log(err));
    },

    async pairs24h({block = undefined, timestamp = undefined, max = undefined} = {}) {
        let timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
        timestamp24ago = timestampNow - TWENTY_FOUR_HOURS;
        timestamp48ago = timestamp24ago - TWENTY_FOUR_HOURS;

        block = timestamp ? await timestampToBlock(timestamp) : block;
        block24ago = await timestampToBlock(timestamp24ago);
        block48ago = await timestampToBlock(timestamp48ago);

        const results = await module.exports.pairs({block: block, max});
        const results24ago = await module.exports.pairs({block: block24ago, max});
        const results48ago = await module.exports.pairs({block: block48ago, max});

        const ethPriceUSD = await module.exports.ethPrice({block: block});
        const ethPriceUSD24ago = await module.exports.ethPrice({block: block24ago});

        return pairs.callback24h(results, results24ago, results48ago, ethPriceUSD, ethPriceUSD24ago);
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
                    factory(id: "${factoryAddress}", ${block}) {
                        ${factory.properties.toString()}
                    }
                }`
        );

        return factory.callback(result.factory);
    },

    observeFactory() {
        const query = gql`
            subscription {
                factory(id: "${factoryAddress}") {
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
                    orderDirection: 'asc',
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

    async twentyFourHourData({block = undefined, timestamp = undefined} = {}) {
        timestamp = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Date.now() / 1000)
        timestamp24ago = timestamp - TWENTY_FOUR_HOURS;

        block = await timestampToBlock(timestamp);
        block24ago = await timestampToBlock(timestamp24ago);

        block = `block: { number: ${block} }`;
        block24ago = `block: { number: ${block24ago} }`;

        const result = await request(graphAPIEndpoints.exchange,
            gql`{
                    factory(id: "${factoryAddress}", ${block}) {
                        ${twentyFourHourData.properties.toString()}
                    }
                }`
        );

        const result24ago = await request(graphAPIEndpoints.exchange,
            gql`{
                    factory(id: "${factoryAddress}", ${block24ago}) {
                        ${twentyFourHourData.properties.toString()}
                    }
                }`
        );

        return twentyFourHourData.callback(result.factory, result24ago.factory);
    } 
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
        'untrackedVolumeUSD',
        'txCount',
        'liquidity',
        'derivedETH'
    ],

    callback(results) {
        return results.map(({ id, symbol, name, decimals, totalSupply, volume, volumeUSD, untrackedVolumeUSD, txCount, liquidity, derivedETH }) => ({
            id: id,
            symbol: symbol,
            name: name,
            decimals: Number(decimals),
            totalSupply: Number(totalSupply),
            volume: Number(volume),
            volumeUSD: Number(volumeUSD),
            untrackedVolumeUSD: Number(untrackedVolumeUSD),
            txCount: Number(txCount),
            liquidity: Number(liquidity),
            derivedETH: Number(derivedETH)
        }));
    },

    callback24h(results, results24h, results48h, ethPriceUSD, ethPriceUSD24ago) {
        return results.map(result => {
            const result24h = results24h.find(e => e.id === result.id) || result;
            const result48h = results48h.find(e => e.id === result.id) || result;

            return ({
                ...result,
                
                priceUSD: result.derivedETH * ethPriceUSD,
                priceUSDChange: (result.derivedETH * ethPriceUSD) / (result24h.derivedETH * ethPriceUSD24ago) * 100 - 100,
                priceUSDChangeCount: (result.derivedETH * ethPriceUSD) - (result24h.derivedETH * ethPriceUSD24ago),
                
                liquidityUSD: result.liquidity * result.derivedETH * ethPriceUSD,
                liquidityUSDChange: (result.liquidity * result.derivedETH * ethPriceUSD) / (result24h.liquidity * result24h.derivedETH * ethPriceUSD24ago) * 100 - 100,
                liquidityUSDChangeCount: result.liquidity * result.derivedETH * ethPriceUSD - result24h.liquidity * result24h.derivedETH * ethPriceUSD24ago,
                
                liquidityETH: result.liquidity * result.derivedETH,
                liquidityETHChange: (result.liquidity * result.derivedETH) / (result24h.liquidity * result24h.derivedETH) * 100 - 100,
                liquidityETHChangeCount: result.liquidity * result.derivedETH - result24h.liquidity * result24h.derivedETH,
                
                volumeUSDOneDay: result.volumeUSD - result24h.volumeUSD,
                volumeUSDChange: (result.volumeUSD - result24h.volumeUSD) / (result24h.volumeUSD - result48h.volumeUSD) * 100 - 100,
                volumeUSDChangeCount: (result.volumeUSD - result24h.volumeUSD) - (result24h.volumeUSD - result48h.volumeUSD),
                
                untrackedVolumeUSDOneDay: result.untrackedVolumeUSD - result24h.untrackedVolumeUSD,
                untrackedVolumeUSDChange: (result.untrackedVolumeUSD - result24h.untrackedVolumeUSD) / (result24h.untrackedVolumeUSD - result48h.untrackedVolumeUSD) * 100 - 100,
                untrackedVolumeUSDChangeCount: (result.untrackedVolumeUSD - result24h.untrackedVolumeUSD) - (result24h.untrackedVolumeUSD - result48h.untrackedVolumeUSD),
                
                txCountOneDay: result.txCount - result24h.txCount,
                txCountChange: (result.txCount - result24h.txCount) / (result24h.txCount - result48h.txCount) * 100 - 100,
                txCountChangeCount: (result.txCount - result24h.txCount) - (result24h.txCount - result48h.txCount),
        })});
    },

    propertiesDayData: [
        'id',
        'date',
        'volume',
        'volumeETH',
        'volumeUSD',
        'liquidity',
        'liquidityETH',
        'liquidityUSD',
        'priceUSD',
        'txCount'
    ],

    callbackDayData(results) {
        return results.map(result => ({
            id: result.id,
            date: new Date(result.date * 1000),
            timestamp: Number(result.date),
            volume: Number(result.volume),
            volumeETH: Number(result.volumeETH),
            volumeUSD: Number(result.volumeUSD),
            liquidity: Number(result.liquidity),
            liquidityETH: Number(result.liquidityETH),
            liquidityUSD: Number(result.liquidityUSD),
            priceUSD: Number(result.priceUSD),
            txCount: Number(result.txCount)
        }));
    }
};

const pairs = {
    properties: [
        'id',
        'token0 { id, name, symbol, totalSupply, derivedETH }',
        'token1 { id, name, symbol, totalSupply, derivedETH }',
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
        return results.map(entry => ({
            id: entry.id,
            token0: { 
                id: entry.token0.id,
                name: entry.token0.name,
                symbol: entry.token0.symbol,
                totalSupply: Number(entry.token0.totalSupply),
                derivedETH: Number(entry.token0.derivedETH),
            },
            token1: { 
                id: entry.token1.id,
                name: entry.token1.name,
                symbol: entry.token1.symbol,
                totalSupply: Number(entry.token1.totalSupply),
                derivedETH: Number(entry.token1.derivedETH),
            },
            reserve0: Number(entry.reserve0),
            reserve1: Number(entry.reserve1),
            totalSupply: Number(entry.totalSupply),
            reserveETH: Number(entry.reserveETH),
            reserveUSD: Number(entry.reserveUSD),
            trackedReserveETH: Number(entry.trackedReserveETH),
            token0Price: Number(entry.token0Price),
            token1Price: Number(entry.token1Price),
            volumeToken0: Number(entry.volumeToken0),
            volumeToken1: Number(entry.volumeToken1),
            volumeUSD: Number(entry.volumeUSD),
            untrackedVolumeUSD: Number(entry.untrackedVolumeUSD),
            txCount: Number(entry.txCount),
        }));
    },

    callback24h(results, results24h, results48h, ethPriceUSD, ethPriceUSD24ago) {
        return results.map(result => {
            const result24h = results24h.find(e => e.id === result.id) || result;
            const result48h = results48h.find(e => e.id === result.id) || result;

            return ({
                ...result,
                
                trackedReserveUSD: result.trackedReserveETH * ethPriceUSD,
                trackedReserveUSDChange: (result.trackedReserveETH * ethPriceUSD) / (result24h.trackedReserveETH * ethPriceUSD24ago) * 100 - 100,
                trackedReserveUSDChangeCount: result.trackedReserveETH * ethPriceUSD - result24h.trackedReserveETH* ethPriceUSD24ago,

                trackedReserveETHChange: (result.trackedReserveETH / result24h.trackedReserveETH) * 100 - 100,
                trackedReserveETHChangeCount: result.trackedReserveETH - result24h.trackedReserveETH,

                volumeUSDOneDay: result.volumeUSD - result24h.volumeUSD,
                volumeUSDChange: (result.volumeUSD - result24h.volumeUSD) / (result24h.volumeUSD - result48h.volumeUSD) * 100 - 100,
                volumeUSDChangeCount: (result.volumeUSD - result24h.volumeUSD) - (result24h.volumeUSD - result48h.volumeUSD),
                
                untrackedVolumeUSDOneDay: result.untrackedVolumeUSD - result24h.untrackedVolumeUSD,
                untrackedVolumeUSDChange: (result.untrackedVolumeUSD - result24h.untrackedVolumeUSD) / (result24h.untrackedVolumeUSD - result48h.untrackedVolumeUSD) * 100 - 100,
                untrackedVolumeUSDChangeCount: (result.untrackedVolumeUSD - result24h.untrackedVolumeUSD) - (result24h.untrackedVolumeUSD - result48h.untrackedVolumeUSD),

                txCountOneDay: result.txCount - result24h.txCount,
                txCountChange: (result.txCount - result24h.txCount) / (result24h.txCount - result48h.txCount) * 100 - 100,
                txCountChangeCount: (result.txCount - result24h.txCount) - (result24h.txCount - result48h.txCount),
            })});
    },

    propertiesDayData: [
        'id',
        'date',
        'volumeUSD',
        'volumeToken0',
        'volumeToken1',
        'reserveUSD',
        'txCount'
    ],

    callbackDayData(results) {
        return results.map(result => ({
            id: result.id,
            date: new Date(result.date * 1000),
            timestamp: Number(result.date),
            volumeUSD: Number(result.volumeUSD),
            volumeToken0: Number(result.volumeToken0),
            volumeToken1: Number(result.volumeToken1),
            liquidityUSD: Number(result.reserveUSD),
            txCount: Number(result.txCount)
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

const twentyFourHourData = {
    properties: [
        'id',
        'volumeUSD',
        'volumeETH',
        'untrackedVolumeUSD',
        'liquidityUSD',
        'liquidityETH',
        'txCount',
        'pairCount'
    ],

    callback(results, results24ago) {
        return ({
            id: results.id,
            volumeUSD: Number(results.volumeUSD) - Number(results24ago.volumeUSD),
            volumeETH: Number(results.volumeETH) - Number(results24ago.volumeETH),
            untrackedVolumeUSD: Number(results.untrackedVolumeUSD) - Number(results24ago.untrackedVolumeUSD),
            liquidityETH: Number(results.liquidityETH) - Number(results24ago.liquidityETH),
            liquidityUSD: Number(results.liquidityUSD) - Number(results24ago.liquidityUSD),
            txCount: Number(results.txCount) - Number(results24ago.txCount),
            pairCount: Number(results.pairCount) - Number(results24ago.pairCount)
        })
    }
}