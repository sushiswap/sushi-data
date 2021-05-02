import ws from 'isomorphic-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws'; 

import { request, gql } from 'graphql-request';

import { graphAPIEndpoints, graphWSEndpoints, TWENTY_FOUR_HOURS } from '../../../constants';
import { timestampToBlock, timestampsToBlocks, blockToTimestamp } from '../../../utils';

import {
    Arg1,
    Arg2,
    Arg5,
    Awaited,
    ChainId,
} from '../../../../types';

import { Factory } from '../../../../types/subgraphs/exchange';
import { fromUnixTime, getUnixTime } from 'date-fns';



export async function factory({block = undefined, timestamp = undefined, chainId = 1}: Arg2 & ChainId = {}) {
    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.exchange[chainId],
        gql`{
                factories(first: 1, ${blockString}) {
                    ${factory_properties.toString()}
                }
            }`
    );

    return factory_callback(result.factories[0]);
}



export function observeFactory({chainId = 1}: ChainId = {}) {
    const query = gql`
        subscription {
            factories(first: 1) {
                ${factory_properties.toString()}
            }
    }`;

    const client = new SubscriptionClient(graphWSEndpoints.exchange[chainId], { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: ReturnType<typeof factory_callback>): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(factory_callback(results?.data?.factories[0]));
                },
                error,
                complete
            });
        }
    };
}



export async function factoryChart({
    minTimestamp = undefined, maxTimestamp = undefined,
    minBlock = undefined,
    maxBlock = undefined,
    min = 10,
    max = undefined,
    spacing = TWENTY_FOUR_HOURS,
    chainId = 1
}: (
    Arg5 & ChainId
) = {}) {
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
        `{
            ${blocks.map((block, i) => (gql`
                timestamp${timestamps[i]}: factories(first: 1, block: {number: ${block}}) {
                    ${factory_properties.toString()}
            }`))}
        }`
    );

    let result = await request(graphAPIEndpoints.exchange[chainId], query);

    result = Object.keys(result)
        .map(key => ({...factory_callback(result[key][0]), timestamp: Number(key.split("timestamp")[1])}))
        .sort((a, b) => (a.timestamp) - (b.timestamp))
        .filter(e => Object.keys(e).length > 1); // Filters empty results (1 because there will always be a timestamp present)


    return factoryChart_callback(result).slice(2).slice(undefined, max);
}



export async function factoryChange({block = undefined, timestamp = undefined, spacing = TWENTY_FOUR_HOURS, chainId = 1}: (
    Arg1 & 
    ChainId & {
        spacing?: number;
}) = {}) {
    const timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000))
    const timestamp1ago = timestampNow - spacing;
    const timestamp2ago = timestamp1ago - spacing;

    const [blockNow, block1ago, block2ago] = await Promise.all([
        timestampToBlock(timestampNow),
        timestampToBlock(timestamp1ago),
        timestampToBlock(timestamp2ago)
    ]);

    const [result, result1ago, result2ago] = await Promise.all([
        factory({block: blockNow, chainId}),
        factory({block: block1ago, chainId}),
        factory({block: block2ago, chainId})
    ]);

    return factoryChange_callback(result, result1ago, result2ago);
}

export default {
    factory,
    observeFactory,
    factoryChart,
    factoryChange
}



const factory_properties = [
    'id',
    'volumeUSD',
    'volumeETH',
    'untrackedVolumeUSD',
    'liquidityUSD',
    'liquidityETH',
    'txCount',
    'tokenCount',
    'userCount',
    'pairCount',
];

function factory_callback(results: Factory) {
    return ({
        id: String(results.id),
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
};



function factoryChart_callback(results: (Awaited<ReturnType<typeof factory>> & {timestamp: number})[]) {
    return results.map((result, i) => {
        const result1ago = results[i-1] ?? result;
        const result2ago = results[i-2] ?? result1ago;

        return ({
            ...factoryChange_callback(result, result1ago, result2ago),
            timestamp: result.timestamp
        });
    })
}



function factoryChange_callback(
    results: Awaited<ReturnType<typeof factory>>, 
    results1ago: Awaited<ReturnType<typeof factory>>,
    results2ago: Awaited<ReturnType<typeof factory>>,
    ) {

    return ({
        id: String(results.id),

        volumeUSD: results.volumeUSD,
        volumeUSDPeriod: results.volumeUSD - results1ago.volumeUSD,
        volumeUSDChange: (results.volumeUSD / results1ago.volumeUSD) * 100 - 100,
        volumeUSDChangeCount: (results.volumeUSD - results1ago.volumeUSD) - (results1ago.volumeUSD - results2ago.volumeUSD),

        volumeETH: results.volumeETH,
        volumeETHPeriod: results.volumeETH - results1ago.volumeETH,
        volumeETHChange: (results.volumeETH / results1ago.volumeETH) * 100 - 100,
        volumeETHChangeCount: (results.volumeETH - results1ago.volumeETH) - (results1ago.volumeETH - results2ago.volumeETH),

        untrackedVolumeUSD: results.untrackedVolumeUSD,
        untrackedVolumeUSDPeriod: results.untrackedVolumeUSD - results1ago.untrackedVolumeUSD,
        untrackedVolumeUSDChange: (results.untrackedVolumeUSD / results1ago.untrackedVolumeUSD) * 100 - 100,
        untrackedVolumeUSDChangeCount: (results.untrackedVolumeUSD - results1ago.untrackedVolumeUSD) - (results1ago.untrackedVolumeUSD - results2ago.untrackedVolumeUSD),

        liquidityUSD: results.liquidityUSD,
        liquidityUSDPeriod: results.liquidityUSD - results1ago.liquidityUSD,
        liquidityUSDChange: (results.liquidityUSD / results1ago.liquidityUSD) * 100 - 100,
        liquidityUSDChangeCount: (results.liquidityUSD - results1ago.liquidityUSD) - (results1ago.liquidityUSD - results2ago.liquidityUSD),

        liquidityETH: results.liquidityETH,
        liquidityETHPeriod: results.liquidityETH - results1ago.liquidityETH,
        liquidityETHChange: (results.liquidityETH / results1ago.liquidityETH) * 100 - 100,
        liquidityETHChangeCount: (results.liquidityETH - results1ago.liquidityETH) - (results1ago.liquidityETH - results2ago.liquidityETH),

        txCount: results.txCount,
        txCountPeriod: results.txCount - results1ago.txCount,
        txCountChange: (results.txCount / results1ago.txCount) * 100 - 100,
        txCountChangeCount: (results.txCount - results1ago.txCount) - (results1ago.txCount - results2ago.txCount),

        pairCount: results.pairCount,
        pairCountPeriod: results.pairCount - results1ago.pairCount,
        pairCountChange: (results.pairCount / results1ago.pairCount) * 100 - 100,
        pairCountChangeCount: (results.pairCount - results1ago.pairCount) - (results1ago.pairCount - results2ago.pairCount),
    })
};