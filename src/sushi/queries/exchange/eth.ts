import ws from 'isomorphic-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws'; 

import { request, gql } from 'graphql-request';

import {
    subWeeks,
    getUnixTime,
    fromUnixTime
} from "date-fns";

import { graphAPIEndpoints, graphWSEndpoints } from '../../../constants';
import { timestampToBlock, timestampsToBlocks, blockToTimestamp } from '../../../utils';

import {
    Arg1,
    Arg3,
} from '../../../../types';

import { Bundle } from '../../../../types/subgraphs/exchange';


export async function ethPrice({block = undefined, timestamp = undefined}: Arg1 = {}) {
    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.exchange,
        gql`{
                bundle(id: 1, ${blockString}) {
                    ${ethPrice_properties.toString()}
                }
            }`
    );

    return ethPrice_callback(result.bundle);
}



export async function ethPriceHourly({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined}: Arg3 = {}) {
    minTimestamp = minBlock ? await blockToTimestamp(minBlock!) : minTimestamp;
    maxTimestamp = maxBlock ? await blockToTimestamp(maxBlock!) : maxTimestamp;

    const endTime = maxTimestamp ? fromUnixTime(maxTimestamp!) : new Date();
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
                timestamp${timestamps[i]}: bundle(id: 1, block: {number: ${block}}) {
                    ${ethPrice_properties.toString()}
            }`))}
        }`
    );

    let result = await request(graphAPIEndpoints.exchange, query)

    result = Object.keys(result)
        .map(key => ({...result[key], timestamp: key.split("timestamp")[1]}))
        .sort((a, b) => Number(a.timestamp) - (b.timestamp));

    return ethPrice_callbackHourly(result);
}



export function observeEthPrice() {
    const query = gql`
        subscription {
            bundle(id: 1) {
                ${ethPrice_properties.toString()}
            }
    }`;

    const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: number): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(ethPrice_callback(results?.data?.bundle));
                },
                error,
                complete
            });
        }
    };
}

export default {
    ethPrice,
    ethPriceHourly,
    observeEthPrice
}



const ethPrice_properties = [
    'ethPrice'
];

function ethPrice_callback(results: Bundle) {
    return Number(results.ethPrice);
}

function ethPrice_callbackHourly(results: (Bundle & {timestamp: string})[]) {
    return results.map(result => ({
        timestamp: Number(result.timestamp),
        priceUSD: Number(result.ethPrice)
    }))
}