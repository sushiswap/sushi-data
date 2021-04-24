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

import { 
    Arg1,
    Arg2,
    Arg5,
    Awaited
} from '../../../../types';

import { Token } from '../../../../types/subgraphs/exchange';



export async function token({block = undefined, timestamp = undefined, address}: (
    Arg1 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Token address undefined"); }

    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.exchange,
        gql`{
                token(id: "${address.toLowerCase()}", ${blockString}) {
                    ${token_properties.toString()}
                }
            }`
    );

    return token_callback([result.token])[0];
}



export async function tokenChange({block = undefined, timestamp = undefined, spacing = TWENTY_FOUR_HOURS, address}: (
    Arg1 & {
        spacing?: number;
        address: string
    }
)) {
    if(!address) { throw new Error("sushi-data: Token address undefined"); }

    let timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
    const timestamp1ago = timestampNow - spacing;
    const timestamp2ago = timestamp1ago - spacing;

    block = timestamp ? await timestampToBlock(timestamp) : block;
    const [block1ago, block2ago] = await Promise.all([
        timestampToBlock(timestamp1ago),
        timestampToBlock(timestamp2ago)
    ]);

    const [result, result1ago, result2ago] = await Promise.all([
        token({block: block, address}),
        token({block: block1ago, address}),
        token({block: block2ago, address})
    ]);

    const [ethPriceUSD, ethPriceUSD1ago] = await Promise.all([
        ethPrice({block: block}),
        ethPrice({block: block1ago})
    ]);

    return tokenChange_callback([result], [result1ago], [result2ago], ethPriceUSD, ethPriceUSD1ago)[0];
}



export async function tokenChart({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, min = 10, max = undefined, spacing = TWENTY_FOUR_HOURS, address}: (
    Arg5 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Token address undefined"); }
    
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
                    token(id: "${address.toLowerCase()}", block: {number: ${block}}) {
                        ${token_properties.toString()}
                    }
            `))}
        }`
    );

    let [result, ethPrices] = await Promise.all([
        request(graphAPIEndpoints.exchange, query),
        ethPriceChart({minTimestamp, maxTimestamp, minBlock, maxBlock, min, max, spacing})
    ])

    result = Object.keys(result)
        .map(key => ({...token_callback([result[key]])[0], timestamp: Number(key.split("timestamp")[1])}))
        .sort((a, b) => (a.timestamp) - (b.timestamp))
        .filter(e => Object.keys(e).length > 1); // Filters empty results (1 because there will always be a timestamp present)

    return tokenChart_callback(result, ethPrices).slice(2).slice(undefined, max);
}



export function observeToken({address}: {address: string}) {
    if(!address) { throw new Error("sushi-data: Token address undefined"); }

    const query = gql`
        subscription {
            token(id: "${address.toLowerCase()}") {
                ${token_properties.toString()}
            }
    }`;

    const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: Awaited<ReturnType<typeof token>>): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(token_callback(results?.data?.token)[0]);
                },
                error,
                complete
            });
        }
    };
}



export async function tokens({block = undefined, timestamp = undefined, max = undefined}: Arg2 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.exchange,
        query: {
            entity: 'tokens',
            selection: {
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp!) } : undefined,
            },
            properties: token_properties
        },
        max
    });

    return token_callback(results);
}



export async function tokensChange({block = undefined, timestamp = undefined, max = undefined}: Arg2 = {}) {
    const timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
    const timestamp24ago = timestampNow! - TWENTY_FOUR_HOURS;
    const timestamp48ago = timestamp24ago - TWENTY_FOUR_HOURS;

    block = timestamp ? await timestampToBlock(timestamp!) : block;
    const [block24ago, block48ago] = await Promise.all([
        timestampToBlock(timestamp24ago),
        timestampToBlock(timestamp48ago)
    ]);

    const [results, results24ago, results48ago] = await Promise.all([
        tokens({block: block, max}),
        tokens({block: block24ago, max}),
        tokens({block: block48ago, max})
    ]);

    const [ethPriceUSD, ethPriceUSD24ago] = await Promise.all([
        ethPrice({block: block}),
        ethPrice({block: block24ago})
    ]);

    return tokenChange_callback(results, results24ago, results48ago, ethPriceUSD, ethPriceUSD24ago);
}



export function observeTokens() {
    const query = gql`
        subscription {
            tokens(first: 1000, orderBy: volumeUSD, orderDirection: desc) {
                ${token_properties.toString()}
            }
    }`;

    const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: Awaited<ReturnType<typeof tokens>>): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(token_callback(results?.data?.tokens));
                },
                error,
                complete
            });
        }
    };
}

export default {
    token,
    tokenChange,
    tokenChart,
    observeToken,
    tokens,
    tokensChange,
    observeTokens
}



const token_properties = [
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
];

function token_callback(results: Token[]) {
    return results
        .map(result => ({
            id: String(result.id),
            symbol: String(result.symbol),
            name: String(result.name),
            decimals: Number(result.decimals),
            totalSupply: Number(result.totalSupply),
            volume: Number(result.volume),
            volumeUSD: Number(result.volumeUSD),
            untrackedVolumeUSD: Number(result.untrackedVolumeUSD),
            txCount: Number(result.txCount),
            liquidity: Number(result.liquidity),
            derivedETH: Number(result.derivedETH)
        }))
    .sort((a, b) => b.volumeUSD - a.volumeUSD);
};



function tokenChange_callback(
        results: Awaited<ReturnType<typeof token>>[],
        results1ago: Awaited<ReturnType<typeof token>>[],
        results2ago: Awaited<ReturnType<typeof token>>[], 
        ethPriceUSD: number, 
        ethPriceUSD1ago: number
    ) {

    return results.map(result => {
        const result1ago = results1ago.find(e => e.id === result.id) || result;
        const result2ago = results2ago.find(e => e.id === result.id) || result;

        return ({
            id: result.id,
            symbol: result.symbol,
            name: result.name,
            decimals: result.decimals,

            totalSupply: result.totalSupply,
            totalSupplyChange: result.totalSupply / result1ago.totalSupply * 100 - 100,
            totalSupplyChangeCount: result.totalSupply - result1ago.totalSupply,

            volume: result.volume,
            volumePeriod: result.volume - result1ago.volume,
            volumeChange: (result.volume - result1ago.volume) / (result1ago.volume - result2ago.volume) * 100 - 100,
            volumeChangeCount: (result.volume - result1ago.volume) - (result1ago.volume - result2ago.volume),
            
            liquidity: result.liquidity,
            liquidityChange: result.liquidity / result1ago.liquidity * 100 - 100,
            liquidityChangeCount: result.liquidity - result1ago.liquidity,

            liquidityUSD: result.liquidity * result.derivedETH * ethPriceUSD,
            liquidityUSDChange: (result.liquidity * result.derivedETH * ethPriceUSD) / (result1ago.liquidity * result1ago.derivedETH * ethPriceUSD1ago) * 100 - 100,
            liquidityUSDChangeCount: result.liquidity * result.derivedETH * ethPriceUSD - result1ago.liquidity * result1ago.derivedETH * ethPriceUSD1ago,
            
            liquidityETH: result.liquidity * result.derivedETH,
            liquidityETHChange: (result.liquidity * result.derivedETH) / (result1ago.liquidity * result1ago.derivedETH) * 100 - 100,
            liquidityETHChangeCount: result.liquidity * result.derivedETH - result1ago.liquidity * result1ago.derivedETH,
            
            volumeUSD: result.volumeUSD,
            volumeUSDPeriod: result.volumeUSD - result1ago.volumeUSD,
            volumeUSDChange: (result.volumeUSD - result1ago.volumeUSD) / (result1ago.volumeUSD - result2ago.volumeUSD) * 100 - 100,
            volumeUSDChangeCount: (result.volumeUSD - result1ago.volumeUSD) - (result1ago.volumeUSD - result2ago.volumeUSD),
            
            untrackedVolumeUSD: result.untrackedVolumeUSD,
            untrackedVolumeUSDOneDay: result.untrackedVolumeUSD - result1ago.untrackedVolumeUSD,
            untrackedVolumeUSDChange: (result.untrackedVolumeUSD - result1ago.untrackedVolumeUSD) / (result1ago.untrackedVolumeUSD - result2ago.untrackedVolumeUSD) * 100 - 100,
            untrackedVolumeUSDChangeCount: (result.untrackedVolumeUSD - result1ago.untrackedVolumeUSD) - (result1ago.untrackedVolumeUSD - result2ago.untrackedVolumeUSD),
            
            txCount: result.txCount,
            txCountPeriod: result.txCount - result1ago.txCount,
            txCountChange: (result.txCount - result1ago.txCount) / (result1ago.txCount - result2ago.txCount) * 100 - 100,
            txCountChangeCount: (result.txCount - result1ago.txCount) - (result1ago.txCount - result2ago.txCount),

            derivedETH: result.derivedETH,
            derivedETHChange: result.derivedETH / result1ago.derivedETH * 100 - 100,
            derivedETHChangeCount: result.derivedETH - result1ago.derivedETH,

            priceUSD: result.derivedETH * ethPriceUSD,
            priceUSDChange: (result.derivedETH * ethPriceUSD) / (result1ago.derivedETH * ethPriceUSD1ago) * 100 - 100,
            priceUSDChangeCount: (result.derivedETH * ethPriceUSD) - (result1ago.derivedETH * ethPriceUSD1ago),
    })});
};



function tokenChart_callback(
    results: (Awaited<ReturnType<typeof token>> & {timestamp: number})[],
    ethPrices: Awaited<ReturnType<typeof ethPriceChart>>
    ) {

    return results.map((result, i) => {
        const result1ago = results[i-1] ?? result;
        const result2ago = results[i-2] ?? result1ago;

        const ethPriceUSD = ethPrices.find(ethPrice => ethPrice.timestamp === result.timestamp)?.priceUSD ?? 0;
        const ethPriceUSD1ago = ethPrices.find(ethPrice => ethPrice.timestamp === result1ago.timestamp)?.priceUSD ?? ethPriceUSD;

        return ({
            ...tokenChange_callback([result], [result1ago], [result2ago], ethPriceUSD, ethPriceUSD1ago)[0],
            timestamp: result.timestamp
        });
    })
};