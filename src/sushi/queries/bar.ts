import ws from 'isomorphic-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws'; 

import { request, gql } from 'graphql-request';

import { graphAPIEndpoints, graphWSEndpoints, barAddress } from '../../constants';
import { timestampToBlock } from '../../utils';

import type {
    Arg1,
    Awaited,
} from './../../../types'

import {
    User,
    Bar
} from '../../../types/subgraphs/bar';



export async function info({block = undefined, timestamp = undefined}: Arg1 = {}) {
    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.bar,
        gql`{
                bar(id: "${barAddress}", ${blockString}) {
                    ${info_properties.toString()}
                }
            }`
    );

    return info_callback(result.bar);
}



export function observeInfo() {
    const query = gql`
        subscription {
            bar(id: "${barAddress}") {
                ${info_properties.toString()}
            }
    }`;

    const client = new SubscriptionClient(graphWSEndpoints.bar, { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: Awaited<ReturnType<typeof info>>): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(info_callback(results?.data?.bar));
                },
                error,
                complete
            });
        }
    };
}



export async function user({block = undefined, timestamp = undefined, address}: Arg1 & {address: string}) {
    if(!address) { throw new Error("sushi-data: User address undefined"); }

    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.bar,
        gql`{
                user(id: "${address.toLowerCase()}", ${blockString}) {
                    ${user_properties.toString()}
                }
            }`
    );

    return user_callback(result.user);
}

export default {
    info,
    observeInfo,
    user
}



const info_properties = [
    'decimals',
    'name',
    'sushi',
    'symbol',
    'totalSupply',
    'ratio',
    'xSushiMinted',
    'xSushiBurned',
    'sushiStaked',
    'sushiStakedUSD',
    'sushiHarvested',
    'sushiHarvestedUSD',
    'xSushiAge',
    'xSushiAgeDestroyed',
    'updatedAt'
];

function info_callback(results: Bar) {
    return ({
        decimals: Number(results.decimals),
        name: String(results.name),
        sushi: String(results.sushi),
        symbol: String(results.symbol),
        totalSupply: Number(results.totalSupply),
        ratio: Number(results.ratio),
        xSushiMinted: Number(results.xSushiMinted),
        xSushiBurned: Number(results.xSushiBurned),
        sushiStaked: Number(results.totalSupply) * Number(results.ratio),
        sushiStakedUSD: Number(results.sushiStakedUSD),
        sushiHarvested: Number(results.sushiHarvested),
        sushiHarvestedUSD: Number(results.sushiHarvestedUSD),
        xSushiAge: Number(results.xSushiAge),
        xSushiAgeDestroyed: Number(results.xSushiAgeDestroyed),
        updatedAt: Number(results.updatedAt)
    })
};



const user_properties = [
    'xSushi',
    'xSushiIn',
    'xSushiOut',
    'xSushiMinted',
    'xSushiBurned',
    'xSushiOffset',
    'xSushiAge',
    'xSushiAgeDestroyed',
    'sushiStaked',
    'sushiStakedUSD',
    'sushiHarvested',
    'sushiHarvestedUSD',
    'sushiIn',
    'sushiOut',
    'usdOut',
    'usdIn',
    'updatedAt',
    'sushiOffset',
    'usdOffset'
];

function user_callback(results: User) {
    return ({
        xSushi: Number(results.xSushi),
        xSushiIn: Number(results.xSushiIn),
        xSushiOut: Number(results.xSushiOut),
        xSushiMinted: Number(results.xSushiMinted),
        xSushiBurned: Number(results.xSushiBurned),
        xSushiOffset: Number(results.xSushiOffset),
        xSushiAge: Number(results.xSushiAge),
        xSushiAgeDestroyed: Number(results.xSushiAgeDestroyed),
        sushiStaked: Number(results.sushiStaked),
        sushiStakedUSD: Number(results.sushiStakedUSD),
        sushiHarvested: Number(results.sushiHarvested),
        sushiHarvestedUSD: Number(results.sushiHarvestedUSD),
        sushiIn: Number(results.sushiIn),
        sushiOut: Number(results.sushiOut),
        usdOut: Number(results.usdOut),
        usdIn: Number(results.usdIn),
        updatedAt: Number(results.updatedAt),
        sushiOffset: Number(results.sushiOffset),
        usdOffset: Number(results.usdOffset)
    })
};