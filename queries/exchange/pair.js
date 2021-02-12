const pageResults = require('graph-results-pager');

const ws = require('isomorphic-ws');
const { SubscriptionClient } = require('subscriptions-transport-ws'); 

const { request, gql } = require('graphql-request');

const { graphAPIEndpoints, graphWSEndpoints, TWENTY_FOUR_HOURS } = require('./../../constants')
const { timestampToBlock, blockToTimestamp } = require('./../../utils');

const { ethPrice } = require('./../exchange/eth');

module.exports = {
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

        const ethPriceUSD = await ethPrice({block: block});
        const ethPriceUSD24ago = await ethPrice({block: block24ago});

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

        const ethPriceUSD = await ethPrice({block: block});
        const ethPriceUSD24ago = await ethPrice({block: block24ago});

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