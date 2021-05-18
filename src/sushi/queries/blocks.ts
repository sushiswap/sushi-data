import ws from 'isomorphic-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws'; 

import { request, gql } from 'graphql-request';

import { graphAPIEndpoints, graphWSEndpoints } from '../../constants';
import { timestampToBlock } from '../../utils';

import type {
    Arg1,
    Awaited,
    ChainId,
} from './../../../types/index'

import { Block } from '../../../types/subgraphs/blocklytics';



export async function latestBlock({chainId = 1}: ChainId = {}) {
    const result = await request(graphAPIEndpoints.blocklytics[chainId],
        gql`{
            blocks(first: 1, orderBy: number, orderDirection: desc) {
                ${latestBlock_properties.toString()}
            }
        }`
    );

    return latestBlock_callback(result.blocks);
}



export function observeLatestBlock({chainId = 1}: ChainId = {}) {
    const query = gql`
        subscription {
            blocks(first: 1, orderBy: number, orderDirection: desc) {
                ${latestBlock_properties.toString()}
            }
    }`;

    const client = new SubscriptionClient(graphWSEndpoints.blocklytics[chainId], { reconnect: true, }, ws,);
    const observable = client.request({ query });

    return {
        subscribe({next, error, complete}: {
            next(data: Awaited<ReturnType<typeof latestBlock>>): any;
            error?(error: any): any;
            complete?: (() => void) | undefined;
        }) {
            return observable.subscribe({
                next(results) {
                    next(latestBlock_callback(results?.data?.blocks));
                },
                error,
                complete
            })
        }
    };
}



export async function getBlock({block = undefined, timestamp = undefined, chainId = 1}: Arg1 & ChainId = {}) {
    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.blocklytics[chainId],
        gql`{
            blocks(first: 1, orderBy: number, orderDirection: desc, ${blockString}) {
                ${getBlock_properties.toString()}
            }
        }`
    );

    return getBlock_callback(result.blocks[0]);
}

export default {
    latestBlock,
    observeLatestBlock,
    getBlock
}



const latestBlock_properties = [
    'id',
    'number',
    'timestamp'
];

function latestBlock_callback(result: Block) {
    return ({
        id: String(result.id),
        number: Number(result.number),
        timestamp: Number(result.timestamp),
        date: new Date(Number(result.timestamp) * 1000)
    });
};



const getBlock_properties = [
    'id',
    'number',
    'timestamp',
    'author',
    'difficulty',
    'gasUsed',
    'gasLimit'
];

function getBlock_callback(results: Block) {
    return ({
        id: results.id,
        number: Number(results.number),
        timestamp: Number(results.timestamp),
        author: results.author,
        difficulty: Number(results.difficulty),
        gasUsed: Number(results.gasUsed),
        gasLimit: Number(results.gasLimit)
    })
};