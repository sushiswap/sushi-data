import pageResults from 'graph-results-pager';

import ws from 'isomorphic-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws'; 

import { request, gql } from 'graphql-request';

import {
    subWeeks,
    getUnixTime,
    fromUnixTime
} from "date-fns";

import { graphAPIEndpoints, graphWSEndpoints, TWENTY_FOUR_HOURS } from '../../../constants';
import { timestampToBlock, timestampsToBlocks, blockToTimestamp } from '../../../utils';

import { ethPrice } from'./eth';

import { 
    Arg1,
    Arg2,
    Arg4,
    Awaited
} from '../../../../types';

import { Token, TokenDayData } from '../../../../types/subgraphs/exchange';



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



export async function token24h({block = undefined, timestamp = undefined, address}: (
    Arg1 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Token address undefined"); }

    let timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
    const timestamp24ago = timestampNow - TWENTY_FOUR_HOURS;
    const timestamp48ago = timestamp24ago - TWENTY_FOUR_HOURS;

    block = timestamp ? await timestampToBlock(timestamp) : block;
    const [block24ago, block48ago] = await Promise.all([
        timestampToBlock(timestamp24ago),
        timestampToBlock(timestamp48ago)
    ]);

    const [result, result24ago, result48ago] = await Promise.all([
        token({block: block, address}),
        token({block: block24ago, address}),
        token({block: block48ago, address})
    ]);

    const [ethPriceUSD, ethPriceUSD24ago] = await Promise.all([
        ethPrice({block: block}),
        ethPrice({block: block24ago})
    ]);

    return token_callback24h([result], [result24ago], [result48ago], ethPriceUSD, ethPriceUSD24ago)[0];
}



export async function tokenHourData({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, address}: (
    Arg4 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Token address undefined"); }
    
    minTimestamp = minBlock ? await blockToTimestamp(minBlock) : minTimestamp;
    maxTimestamp = maxBlock ? await blockToTimestamp(maxBlock) : maxTimestamp;

    const endTime = maxTimestamp ? fromUnixTime(maxTimestamp) : new Date();
    let time = minTimestamp ? minTimestamp : getUnixTime(subWeeks(endTime, 1));

    // create an array of hour start times until we reach current hour
    const timestamps: number[] = [];
    while (time <= getUnixTime(endTime) - 3600) {
        timestamps.push(time);
        time += 3600;
    }

    let blocks = await timestampsToBlocks(timestamps);

    const query = (
        gql`{
            ${blocks.map((block, i) => (gql`
                timestamp${timestamps[i]}: token(id: "${address.toLowerCase()}", block: {number: ${block}}) {
                    ${token_properties.toString()}
            }`))}
        }`
    );

    let result = await request(graphAPIEndpoints.exchange, query)
    result = Object.keys(result)
        .map(key => ({...result[key], timestamp: Number(key.split("timestamp")[1])}))
        .sort((a, b) => (a.timestamp) - (b.timestamp));

    return token_callbackHourData(result);
}



export async function tokenDayData({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, address}: (
    Arg4 & {address: string;}
)) {
    if(!address) { throw new Error("sushi-data: Token address undefined"); }
    
    const results = await pageResults({
        api: graphAPIEndpoints.exchange,
        query: {
            entity: 'tokenDayDatas',
            selection: {
                orderDirection: 'desc',
                where: {
                    token: `\\"${address.toLowerCase()}\\"`,
                    date_gte: minTimestamp || (minBlock ? await blockToTimestamp(minBlock!) : undefined),
                    date_lte: maxTimestamp || (maxBlock ? await blockToTimestamp(maxBlock!) : undefined),
                },
            },
            properties: token_propertiesDayData
        }
    })

    return token_callbackDayData(results);
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



export async function tokens24h({block = undefined, timestamp = undefined, max = undefined}: Arg2 = {}) {
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

    return token_callback24h(results, results24ago, results48ago, ethPriceUSD, ethPriceUSD24ago);
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
    token24h,
    tokenHourData,
    tokenDayData,
    observeToken,
    tokens,
    tokens24h,
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
        .map(({ id, symbol, name, decimals, totalSupply, volume, volumeUSD, untrackedVolumeUSD, txCount, liquidity, derivedETH }) => ({
            id: String(id),
            symbol: String(symbol),
            name: String(name),
            decimals: Number(decimals),
            totalSupply: Number(totalSupply),
            volume: Number(volume),
            volumeUSD: Number(volumeUSD),
            untrackedVolumeUSD: Number(untrackedVolumeUSD),
            txCount: Number(txCount),
            liquidity: Number(liquidity),
            derivedETH: Number(derivedETH)
        }))
    .sort((a, b) => b.volumeUSD - a.volumeUSD);
};



function token_callback24h(
        results: Awaited<ReturnType<typeof token>>[],
        results24h: Awaited<ReturnType<typeof token>>[],
        results48h: Awaited<ReturnType<typeof token>>[], 
        ethPriceUSD: number, 
        ethPriceUSD24ago: number
    ) {

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
};



function token_callbackHourData(results: (Token & {timestamp: number})[]) {
    return results.map(result => ({
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
        derivedETH: Number(result.derivedETH),
        timestamp: Number(result.timestamp)
    }));
};



const token_propertiesDayData = [
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
];

function token_callbackDayData(results: TokenDayData[]) {
    return results.map(result => ({
        id: String(result.id),
        date: new Date(Number(result.date) * 1000),
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
};
