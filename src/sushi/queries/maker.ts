import pageResults from 'graph-results-pager';

import { request, gql } from 'graphql-request';

import { graphAPIEndpoints, makerAddress } from '../../constants';
import { timestampToBlock } from '../../utils';

import type {
    Arg1,
    Arg4,
    Arg2,
} from './../../../types/index';

import { Maker, Server, Serving } from '../../../types/subgraphs/maker';
import { User } from '../../../types/subgraphs/exchange';



export async function info({block = undefined, timestamp = undefined}: Arg1 = {}) {
    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.maker,
        gql`{
                makers(first: 1, ${blockString}) {
                    ${info_properties.toString()}
                }
            }`
    );

    return info_callback(result.makers[0]);
}



export async function servings({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, max = undefined}: Arg4 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.maker,
        query: {
            entity: 'servings',
            selection: {
                where: {
                    block_gte: minBlock || undefined,
                    block_lte: maxBlock || undefined,
                    timestamp_gte: minTimestamp || undefined,
                    timestamp_lte: maxTimestamp || undefined,
                }
            },
            properties: servings_properties
        },
        max
    })

    return servings_callback(results)
}



export async function servers({block = undefined, timestamp = undefined, max = undefined}: Arg2 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.maker,
        query: {
            entity: 'servers',
            selection: {
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined
            },
            properties: servers_properties
        },
        max
    })

    return servers_callback(results);
}



export async function pendingServings({block = undefined, timestamp = undefined, max = undefined}: Arg2 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.exchange[1],
        query: {
            entity: 'users',
            selection: {
                where: {
                    id: `\\"${makerAddress}\\"`,
                },
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
            },
            properties: pendingServings_properties
        },
        max
    })

    return pendingServings_callback(results[0]);
}



export default {
    info,
    servings,
    servers,
    pendingServings,
}



const info_properties = [
    'id',
    'sushiServed'
];

function info_callback(result: Maker) {
    return ({
        address: String(result.id),
        sushiServed: Number(result.sushiServed)
    });
}



const servings_properties = [
    'server { id }',
    'tx',
    'pair',
    'token0',
    'token1',
    'sushiServed',
    'block',
    'timestamp'
];

function servings_callback(results: Serving[]) {
    return results.map(result => ({
        serverAddress: String(result.server?.id),
        tx: String(result.tx),
        pair: String(result.pair),
        token0: String(result.token0),
        token1: String(result.token1),
        sushiServed: Number(result.sushiServed),
        block: Number(result.block),
        timestamp: Number(result.timestamp) * 1000,
        date: new Date(Number(result.timestamp) * 1000)
    }));
}



const servers_properties = [
    'id',
    'sushiServed',
    'servings(first: 1000, orderBy: block, orderDirection: desc) { tx, block, pair, sushiServed }'
];
    
function servers_callback(results: Server[]) {
    return results.map(({ id, sushiServed, servings }) => ({
        serverAddress: String(id),
        sushiServed: Number(sushiServed),
        servings: servings?.map(serving => ({
            tx: String(serving.tx),
            block: Number(serving.block),
            pair: String(serving.pair),
            sushiServed: Number(serving.sushiServed)
        })),
    }));
}



const pendingServings_properties = [
    'liquidityPositions(first: 1000) { id, liquidityTokenBalance, pair { id, totalSupply, reserveUSD, token0 { id, name, symbol }, token1 { id, symbol, name } } }'
];

function pendingServings_callback(result: User) {
    return result.liquidityPositions?.map(result => ({
        address: String(result.pair?.id),
        token0: String(result.pair?.token0),
        token1: String(result.pair?.token1),
        valueUSD: (Number(result.liquidityTokenBalance) / Number(result.pair?.totalSupply)) * Number(result.pair?.reserveUSD)
    })).sort((a: any, b: any) => b.valueUSD - a.valueUSD);
}
