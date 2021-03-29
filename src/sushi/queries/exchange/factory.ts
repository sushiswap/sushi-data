import pageResults from 'graph-results-pager';

import ws from 'isomorphic-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws'; 

import { request, gql } from 'graphql-request';

import { graphAPIEndpoints, graphWSEndpoints, TWENTY_FOUR_HOURS, factoryAddress } from '../../../constants';
import { timestampToBlock, blockToTimestamp } from '../../../utils';

import {
    Arg1,
    Arg4,
} from '../../../../types';

import { DayData, Factory } from '../../../../types/subgraphs/exchange';



export async function factory({block = undefined, timestamp = undefined}: Arg1 = {}) {
    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.exchange,
        gql`{
                factory(id: "${factoryAddress}", ${blockString}) {
                    ${factory_properties.toString()}
                }
            }`
    );

    return factory_callback(result.factory);
}



export function observeFactory() {
    const query = gql`
        subscription {
            factory(id: "${factoryAddress}") {
                ${factory_properties.toString()}
            }
    }`;

    const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: ReturnType<typeof factory_callback>): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(factory_callback(results?.data?.factory));
                },
                error,
                complete
            });
        }
    };
}



export async function dayData({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, max = undefined}: Arg4 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.exchange,
        query: {
            entity: 'dayDatas',
            selection: {
                orderDirection: 'desc',
                where: {
                    date_gte: minTimestamp || (minBlock ? await blockToTimestamp(minBlock) : undefined),
                    date_lte: maxTimestamp || (maxBlock ? await blockToTimestamp(maxBlock) : undefined),
                },
            },
            properties: dayData_properties,
        },
        max
    })

    return dayData_callback(results);
}



export async function twentyFourHourData({block = undefined, timestamp = undefined}: Arg1 = {}) {
    timestamp = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Date.now() / 1000)
    const timestamp24ago = timestamp - TWENTY_FOUR_HOURS;

    block = await timestampToBlock(timestamp);
    const block24ago = await timestampToBlock(timestamp24ago);

    const blockString = `block: { number: ${block} }`;
    const block24agoString = `block: { number: ${block24ago} }`;

    const result = await request(graphAPIEndpoints.exchange,
        gql`{
                factory(id: "${factoryAddress}", ${blockString}) {
                    ${twentyFourHourData_properties.toString()}
                }
            }`
    );

    const result24ago = await request(graphAPIEndpoints.exchange,
        gql`{
                factory(id: "${factoryAddress}", ${block24agoString}) {
                    ${twentyFourHourData_properties.toString()}
                }
            }`
    );

    return twentyFourHourData_callback(result.factory, result24ago.factory);
}

export default {
    factory,
    observeFactory,
    dayData,
    twentyFourHourData
}



const factory_properties = [
    'pairCount',
    'volumeUSD',
    'volumeETH',
    'untrackedVolumeUSD',
    'liquidityUSD',
    'liquidityETH',
    'txCount',
    'tokenCount',
    'userCount',
];

function factory_callback(results: Factory) {
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
};



const dayData_properties = [
    'id',
    'date',
    'volumeETH',
    'volumeUSD',
    'liquidityETH',
    'liquidityUSD',
    'txCount'
];

function dayData_callback(results: DayData[]) {
    return results.map(({ id, date, volumeETH, volumeUSD, liquidityETH, liquidityUSD, txCount }) => ({
        id: Number(id),
        date: new Date(Number(date) * 1000),
        volumeETH: Number(volumeETH),
        volumeUSD: Number(volumeUSD),
        liquidityETH: Number(liquidityETH),
        liquidityUSD: Number(liquidityUSD),
        txCount: Number(txCount),
    }));
};



const twentyFourHourData_properties = [
    'id',
    'volumeUSD',
    'volumeETH',
    'untrackedVolumeUSD',
    'liquidityUSD',
    'liquidityETH',
    'txCount',
    'pairCount'
];

function twentyFourHourData_callback(results: Factory, results24ago: Factory) {
    return ({
        id: String(results.id),
        volumeUSD: Number(results.volumeUSD) - Number(results24ago.volumeUSD),
        volumeETH: Number(results.volumeETH) - Number(results24ago.volumeETH),
        untrackedVolumeUSD: Number(results.untrackedVolumeUSD) - Number(results24ago.untrackedVolumeUSD),
        liquidityETH: Number(results.liquidityETH) - Number(results24ago.liquidityETH),
        liquidityUSD: Number(results.liquidityUSD) - Number(results24ago.liquidityUSD),
        txCount: Number(results.txCount) - Number(results24ago.txCount),
        pairCount: Number(results.pairCount) - Number(results24ago.pairCount)
    })
};