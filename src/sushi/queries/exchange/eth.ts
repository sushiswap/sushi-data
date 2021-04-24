import ws from 'isomorphic-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws'; 

import { request, gql } from 'graphql-request';

import {
    getUnixTime,
    fromUnixTime
} from "date-fns";

import { graphAPIEndpoints, graphWSEndpoints, TWENTY_FOUR_HOURS } from '../../../constants';
import { timestampToBlock, timestampsToBlocks, blockToTimestamp } from '../../../utils';

import {
    Arg1,
    Arg5,
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



export async function ethPriceChart({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, min = 10, max = undefined, spacing = TWENTY_FOUR_HOURS}: Arg5 = {}) {
    minTimestamp = minBlock ? await blockToTimestamp(minBlock) : minTimestamp;
    maxTimestamp = maxBlock ? await blockToTimestamp(maxBlock) : maxTimestamp;

    const endTime = maxTimestamp ? fromUnixTime(maxTimestamp) : new Date();
    let time = (minTimestamp ? minTimestamp : Math.floor(Date.now() / 1000) - spacing * min) - spacing * 1; // neccessary for some of the calcs, the two results will be cut off

    const timestamps: number[] = [];
    while (time <= getUnixTime(endTime) - spacing) {
        timestamps.push(time + spacing);
        time += spacing;
    }

    const blocks = await timestampsToBlocks(timestamps);

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
        .map(key => ({priceUSD: ethPrice_callback(result[key]), timestamp: Number(key.split("timestamp")[1])}))
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter(e => Object.keys(e).length > 1); // Filters empty results (1 because there will always be a timestamp present)

    return ethPriceChart_callback(result).slice(1).slice(undefined, max);
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
    ethPriceChart,
    observeEthPrice
}



const ethPrice_properties = [
    'ethPrice'
];

function ethPrice_callback(results: Bundle) {
    return Number(results.ethPrice);
}

function ethPriceChart_callback(results: {priceUSD: number, timestamp: string}[]) {
    return results.map((result, i) => {
        const result1ago = results[i-1] ?? result;

        return ({
            priceUSD: Number(result.priceUSD),
            priceUSDChange: Number(result.priceUSD) / Number(result1ago.priceUSD) * 100 - 100,
            priceUSDChangeCount: Number(result.priceUSD) - Number(result1ago.priceUSD),

            timestamp: Number(result.timestamp)
        })
    })
}