import ws from 'isomorphic-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';

import { request, gql } from 'graphql-request';

import { graphAPIEndpoints, graphWSEndpoints, sushiAddress } from '../../constants';
import { timestampToBlock } from '../../utils';

import { Arg1 } from '../../../types';
import { Token } from '../../../types/subgraphs/exchange';

import { ethPrice } from './exchange';



export async function priceUSD ({block = undefined, timestamp = undefined}: Arg1 = {}) {
    return (
        await ethPrice({block, timestamp}) * 
        await priceETH({block, timestamp})
    );
}



export async function priceETH({block = undefined, timestamp = undefined}: Arg1 = {}) {  
    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.exchange,
        gql`{
                token(id: "${sushiAddress.toLowerCase()}", ${blockString}) {
                    ${priceETH_properties.toString()}
                }
            }`
    );

    return priceETH_callback(result);
}



export function observePriceETH() {
    const query = gql`
        subscription {
                token(id: "${sushiAddress}") {
                    ${priceETH_properties.toString()}
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
                    next(priceETH_callback(results?.data?.token));
                },
                error,
                complete
            });
        }
    };
}

export default {
    priceUSD,
    priceETH,
    observePriceETH
}



const priceETH_properties = [
    'derivedETH'
];

function priceETH_callback(result: Token) {
    return Number(result.derivedETH);
}