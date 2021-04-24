import pageResults from 'graph-results-pager';

import ws from 'isomorphic-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws'; 

import { request, gql } from 'graphql-request';

import {
    getUnixTime,
    fromUnixTime
} from "date-fns";

import { graphAPIEndpoints, graphWSEndpoints, TWENTY_FOUR_HOURS } from '../../../constants';
import { timestampToBlock, timestampsToBlocks, blockToTimestamp } from '../../../utils';

import { ethPrice, ethPriceChart } from'./eth';

import type {
    Arg1,
    Arg2,
    Arg5,
    Awaited,
} from './../../../../types'

import { Pair } from '../../../../types/subgraphs/exchange';



export async function pair({block = undefined, timestamp = undefined, address}: (
    Arg1 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }

    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.exchange,
        gql`{
                pair(id: "${address.toLowerCase()}", ${blockString}) {
                    ${pair_properties.toString()}
                }
            }`
    );

    return pair_callback([result.pair])[0];
}



export async function pairChange({block = undefined, timestamp = undefined, spacing= TWENTY_FOUR_HOURS, address}: (
    Arg1 & {
        spacing?: number;
        address: string
    }
)) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }
    
    let timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
    const timestamp1ago = timestampNow - spacing;
    const timestamp2ago = timestamp1ago - spacing;

    block = timestamp ? await timestampToBlock(timestamp) : block;
    const [block1ago, block2ago] = await Promise.all([
        timestampToBlock(timestamp1ago),
        timestampToBlock(timestamp2ago)
    ]);

    const [result, result1ago, result2ago] = await Promise.all([
        pair({block: block, address}),
        pair({block: block1ago, address}),
        pair({block: block2ago, address})
    ])

    const [ethPriceUSD, ethPriceUSD1ago] = await Promise.all([
        ethPrice({block: block}),
        ethPrice({block: block1ago})
    ]);

    return pairChange_callback([result], [result1ago], [result2ago], ethPriceUSD, ethPriceUSD1ago)[0];
}



export async function pairChart({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, min = 10, max = undefined, spacing = TWENTY_FOUR_HOURS, address}: (
    Arg5 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }
    
    minTimestamp = minBlock ? await blockToTimestamp(minBlock) : minTimestamp;
    maxTimestamp = maxBlock ? await blockToTimestamp(maxBlock) : maxTimestamp;

    const endTime = maxTimestamp ? fromUnixTime(maxTimestamp) : new Date();
    let time = (minTimestamp ? minTimestamp : Math.floor(Date.now() / 1000) - spacing * min) - spacing * 2; // neccessary for some of the calcs, the two results will be cut off

    const timestamps: number[] = [];
    while (time <= getUnixTime(endTime) - spacing) {
        timestamps.push(time + spacing);
        time += spacing;
    }

    const blocks = await timestampsToBlocks(timestamps);

    const query = (
        gql`{
            ${blocks.map((block, i) => (gql`
                timestamp${timestamps[i]}: 
                    pair(id: "${address.toLowerCase()}", block: {number: ${block}}) {
                        ${pair_properties.toString()}
                    }
            `))}
        }`
    );

    let [result, ethPrices] = await Promise.all([
        request(graphAPIEndpoints.exchange, query),
        ethPriceChart({minTimestamp, maxTimestamp, minBlock, maxBlock, min, max, spacing})
    ])

    result = Object.keys(result)
        .map(key => ({...pair_callback([result[key]])[0], timestamp: Number(key.split("timestamp")[1])}))
        .sort((a, b) => (a.timestamp) - (b.timestamp))
        .filter(e => Object.keys(e).length > 1); // Filters empty results (1 because there will always be a timestamp present)

    return pairChart_callback(result, ethPrices).slice(2).slice(undefined, max);
}



export function observePair({address}: {address: string}) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }

    const query = gql`
        subscription {
            pair(id: "${address.toLowerCase()}") {
                ${pair_properties.toString()}
            }
        }`

    const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: Awaited<ReturnType<typeof pair>>): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(pair_callback(results?.data?.pair)[0]);
                },
                error,
                complete
            });
        }
    };
}



export async function pairs({block = undefined, timestamp = undefined, max = undefined, addresses = undefined}: (
    Arg2 & {addresses?: string[] | undefined}
) = {}) {
    if(addresses) {
        
        block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
        const blockString = block ? `block: { number: ${block} }` : "";

        const query = (
            gql`{
                ${addresses.map((pair, i) => (`
                    pair${i}: pair(id: "${pair.toLowerCase()}", ${blockString}) {
                        ${pair_properties.toString()}
                }`))}
            }`
        );

        const result: Pair[] = Object.values(await request(graphAPIEndpoints.exchange, query));
        return pair_callback(result);
    }
    
    const results = await pageResults({
        api: graphAPIEndpoints.exchange,
        query: {
            entity: 'pairs',
            selection: {
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
            },
            properties: pair_properties
        },
        max
    });

    return pair_callback(results);
}



export async function pairsChange({block = undefined, timestamp = undefined, spacing = TWENTY_FOUR_HOURS}: (
    Arg1 & {spacing?: number}
) = {}) {
    let timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
    const timestamp1ago = timestampNow - spacing;
    const timestamp2ago = timestamp1ago - spacing;

    block = timestamp ? await timestampToBlock(timestamp) : block;
    const [block1ago, block2ago] = await Promise.all([
        timestampToBlock(timestamp1ago),
        timestampToBlock(timestamp2ago)
    ]);

    const [results, results1ago, results2ago] = await Promise.all([
        pairs({block: block}),
        pairs({block: block1ago}),
        pairs({block: block2ago})
    ]);

    const [ethPriceUSD, ethPriceUSD1ago] = await Promise.all([
        ethPrice({block: block}),
        ethPrice({block: block1ago})
    ]);

    return pairChange_callback(results, results1ago, results2ago, ethPriceUSD, ethPriceUSD1ago);
}



export function observePairs () {
    const query = gql`
        subscription {
            pairs(first: 1000, orderBy: reserveUSD, orderDirection: desc) {
                ${pair_properties.toString()}
            }
    }`;

    const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: Awaited<ReturnType<typeof pairs>>): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(pair_callback(results?.data?.pairs));
                },
                error,
                complete
            });
        }
    };
}

export default {
    pair,
    pairChange,
    pairChart,
    observePair,
    pairs,
    pairsChange,
    observePairs
}




const pair_properties = [
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
];

function pair_callback(results: Pair[]) {
    return results
        .map((result) => ({
            id: String(result.id),
            token0: { 
                id: String(result?.token0?.id),
                name: String(result?.token0?.name),
                symbol: String(result?.token0?.symbol),
                totalSupply: Number(result?.token0?.totalSupply),
                derivedETH: Number(result?.token0?.derivedETH),
            },
            token1: { 
                id: String(result?.token1?.id),
                name: String(result?.token1?.name),
                symbol: String(result?.token1?.symbol),
                totalSupply: Number(result?.token1?.totalSupply),
                derivedETH: Number(result?.token1?.derivedETH),
            },
            reserve0: Number(result.reserve0),
            reserve1: Number(result.reserve1),
            totalSupply: Number(result.totalSupply),
            reserveETH: Number(result.reserveETH),
            reserveUSD: Number(result.reserveUSD),
            trackedReserveETH: Number(result.trackedReserveETH),
            token0Price: Number(result.token0Price),
            token1Price: Number(result.token1Price),
            volumeToken0: Number(result.volumeToken0),
            volumeToken1: Number(result.volumeToken1),
            volumeUSD: Number(result.volumeUSD),
            untrackedVolumeUSD: Number(result.untrackedVolumeUSD),
            txCount: Number(result.txCount),
        }))
    .sort((a, b) => b.reserveUSD - a.reserveUSD);     
};



function pairChange_callback(
        results: Awaited<ReturnType<typeof pair>>[],
        results1ago: Awaited<ReturnType<typeof pair>>[], 
        results2ago: Awaited<ReturnType<typeof pair>>[], 
        ethPriceUSD: number, 
        ethPriceUSD1ago: number
    ) {

    return results.map(result => {
        const result1ago = results1ago.find(e => e.id === result.id) || result;
        const result2ago = results2ago.find(e => e.id === result.id) || result;

        return ({
            id: result.id,
            token0: { 
                id: result.token0.id,
                name: result.token0.name,
                symbol: result.token0.symbol,
                
                totalSupply: result.token0.totalSupply,
                totalSupplyChange: result.token0.totalSupply / result1ago.token0.totalSupply * 100 - 100,
                totalSupplyChangeCount: result.token0.totalSupply - result1ago.token0.totalSupply,
                
                derivedETH: result.token0.derivedETH,
                derivedETHChange: result.token0.derivedETH / result1ago.token0.derivedETH * 100 - 100,
                derivedETHChangeCount: result.token0.derivedETH - result1ago.token0.derivedETH,

                priceUSD: result.token0.derivedETH * ethPriceUSD,
                priceUSDChange: (result.token0.derivedETH * ethPriceUSD) / (result1ago.token0.derivedETH * ethPriceUSD1ago) * 100 - 100,
                priceUSDChangeCount: (result.token0.derivedETH * ethPriceUSD) - (result1ago.token0.derivedETH * ethPriceUSD1ago),
            },
            token1: { 
                id: result.token1.id,
                name: result.token1.name,
                symbol: result.token1.symbol,

                totalSupply: result.token1.totalSupply,
                totalSupplyChange: result.token1.totalSupply / result1ago.token1.totalSupply * 100 - 100,
                totalSupplyChangeCount: result.token1.totalSupply - result1ago.token1.totalSupply,

                derivedETH: result.token1.derivedETH,
                derivedETHChange: result.token1.derivedETH / result1ago.token1.derivedETH * 100 - 100,
                derivedETHChangeCount: result.token1.derivedETH - result1ago.token1.derivedETH,

                priceUSD: result.token1.derivedETH * ethPriceUSD,
                priceUSDChange: (result.token1.derivedETH * ethPriceUSD) / (result1ago.token1.derivedETH * ethPriceUSD1ago) * 100 - 100,
                priceUSDChangeCount: (result.token1.derivedETH * ethPriceUSD) - (result1ago.token1.derivedETH * ethPriceUSD1ago),
            },

            totalSupply: result.totalSupply,
            totalSupplyChange: result.totalSupply / result1ago.totalSupply * 100 - 100,
            totalSupplyChangeCount: result.totalSupply - result1ago.totalSupply,

            token0Price: result.token0Price,
            token0PriceChange: result.token0Price / result1ago.token0Price * 100 - 100,
            token0PriceChangeCount: result.token0Price - result1ago.token0Price,

            token1Price: result.token1Price,
            token1PriceChange: result.token1Price / result1ago.token1Price * 100 - 100,
            token1PriceChangeCount: result.token1Price - result1ago.token1Price,

            volumeToken0: result.volumeToken0,
            volumeToken0Change: result.volumeToken0 / result1ago.volumeToken0 * 100 - 100,
            volumeToken0ChangeCount: result.volumeToken0 - result1ago.volumeToken0,

            volumeToken1: result.volumeToken1,
            volumeToken1Change: result.volumeToken1 / result1ago.volumeToken1 * 100 - 100,
            volumeToken1ChangeCount: result.volumeToken1 - result1ago.volumeToken1,

            reserve0: result.reserve0,
            reserve0Change: result.reserve0 / result1ago.reserve0 * 100 - 100,
            reserve0ChangeCount: result.reserve0 - result1ago.reserve0,

            reserve1: result.reserve1,
            reserve1Change: result.reserve1 / result1ago.reserve1 * 100 - 100,
            reserve1ChangeCount: result.reserve1 - result1ago.reserve1,
            
            reserveUSD: result.reserveUSD,
            reserveUSDChange: result.reserveUSD / result1ago.reserveUSD * 100 - 100,
            reserveUSDChangeCount: result.reserveUSD - result1ago.reserveUSD,

            reserveETH: result.reserveETH,
            reserveETHChange: (result.reserveETH / result1ago.reserveETH) * 100 - 100,
            reserveETHChangeCount: result.reserveETH - result1ago.reserveETH,

            trackedReserveUSD: result.trackedReserveETH * ethPriceUSD,
            trackedReserveUSDChange: (result.trackedReserveETH * ethPriceUSD) / (result1ago.trackedReserveETH * ethPriceUSD1ago) * 100 - 100,
            trackedReserveUSDChangeCount: result.trackedReserveETH * ethPriceUSD - result1ago.trackedReserveETH * ethPriceUSD1ago,

            trackedReserveETH: result.trackedReserveETH,
            trackedReserveETHChange: result.trackedReserveETH / result1ago.trackedReserveETH * 100 - 100,
            trackedReserveETHChangeCount: result.trackedReserveETH - result1ago.trackedReserveETH,

            volumeUSD: result.volumeUSD,
            volumeUSDPeriod: result.volumeUSD - result1ago.volumeUSD,
            volumeUSDChange: (result.volumeUSD - result1ago.volumeUSD) / (result1ago.volumeUSD - result2ago.volumeUSD) * 100 - 100,
            volumeUSDChangeCount: (result.volumeUSD - result1ago.volumeUSD) - (result1ago.volumeUSD - result2ago.volumeUSD),
            
            untrackedVolumeUSD: result.untrackedVolumeUSD,
            untrackedVolumeUSDPeriod: result.untrackedVolumeUSD - result1ago.untrackedVolumeUSD,
            untrackedVolumeUSDChange: (result.untrackedVolumeUSD - result1ago.untrackedVolumeUSD) / (result1ago.untrackedVolumeUSD - result2ago.untrackedVolumeUSD) * 100 - 100,
            untrackedVolumeUSDChangeCount: (result.untrackedVolumeUSD - result1ago.untrackedVolumeUSD) - (result1ago.untrackedVolumeUSD - result2ago.untrackedVolumeUSD),

            txCount: result.txCount,
            txCountPeriod: result.txCount - result1ago.txCount,
            txCountChange: (result.txCount - result1ago.txCount) / (result1ago.txCount - result2ago.txCount) * 100 - 100,
            txCountChangeCount: (result.txCount - result1ago.txCount) - (result1ago.txCount - result2ago.txCount),
        });
    });
}



function pairChart_callback(
        results: (Awaited<ReturnType<typeof pair>> & {timestamp: number})[],
        ethPrices: Awaited<ReturnType<typeof ethPriceChart>>
    ) {

    return results.map((result, i) => {
        const result1ago = results[i-1] ?? result;
        const result2ago = results[i-2] ?? result1ago;

        const ethPriceUSD = ethPrices.find(ethPrice => ethPrice.timestamp === result.timestamp)?.priceUSD ?? 0;
        const ethPriceUSD1ago = ethPrices.find(ethPrice => ethPrice.timestamp === result1ago.timestamp)?.priceUSD ?? ethPriceUSD;

        return ({
            ...pairChange_callback([result], [result1ago], [result2ago], ethPriceUSD, ethPriceUSD1ago)[0],
            timestamp: result.timestamp
        });
    })
}