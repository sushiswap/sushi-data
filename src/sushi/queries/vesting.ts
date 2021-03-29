import pageResults from 'graph-results-pager';

import { request, gql } from 'graphql-request';

import { graphAPIEndpoints } from './../../constants';
import { timestampToBlock } from './../../utils';

import { Arg1 } from '../../../types';
import { User, Week } from '../../../types/subgraphs/vesting';



export async function user({block = undefined, timestamp = undefined, address}: (
    Arg1 & {address: string}
)) {
    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.vesting,
        gql`{
            user(id: "${address.toLowerCase()}", ${blockString}) {
                ${user_properties.toString()}
            }
        }`
    );

    return user_callback([result.user])[0];
}



export async function users({block = undefined, timestamp = undefined}: Arg1 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.vesting,
        query: {
            entity: 'users',
            selection: {
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
            },
            properties: user_properties
        }
    })

    return user_callback(results);
}



export async function week({block = undefined, timestamp = undefined, week}: (
    Arg1 & {week: number}
)) {
    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.vesting,
        gql`{
            week(id: "${week}", ${blockString}) {
                ${week_properties.toString()}
            }
        }`
    );

    return week_callback([result.week])[0];
}



export async function weeks({block = undefined, timestamp = undefined}: Arg1 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.vesting,
        query: {
            entity: 'weeks',
            selection: {
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
            },
            properties: week_properties
        }
    })

    return week_callback(results);
}

export default {
    user,
    users,
    week,
    weeks
}



const user_properties = [
    'id',
    'claims { id, week, amount }',
    'totalClaimed'
];

function user_callback(results: User[]) {
    return results.map(result => ({
        id: result.id,
        claims: result.claims?.map(claim => ({
            id: claim.id,
            week: Number(claim.week),
            amount: Number(claim.amount)
        })),
        totalClaimed: Number(result.totalClaimed)
    }));
};



const week_properties = [
    'id',
    'numberOfClaims',
    'totalClaimed',
    'merkleRoot'
];

function week_callback(results: Week[]) {
    return results.map(result => ({
        id: Number(result.id),
        numberOfClaims: Number(result.numberOfClaims),
        totalClaimed: Number(result.totalClaimed),
        merkleRoot: result.merkleRoot,
    }));
};