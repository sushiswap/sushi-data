const ws = require('isomorphic-ws');
const { SubscriptionClient } = require('subscriptions-transport-ws'); 

const { request, gql } = require('graphql-request');

const { graphAPIEndpoints, graphWSEndpoints } = require('./../../constants')
const { timestampToBlock } = require('./../../utils');

module.exports = {
    async ethPrice({block = undefined, timestamp = undefined} = {}) {
        block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
        block = block ? `block: { number: ${block} }` : "";

        const result = await request(graphAPIEndpoints.exchange,
            gql`{
                    bundle(id: 1, ${block}) {
                        ${ethPrice.properties.toString()}
                    }
                }`
        );

        return ethPrice.callback(result.bundle);
    },

    observeEthPrice() {
        const query = gql`
            subscription {
                bundle(id: 1) {
                    ${ethPrice.properties.toString()}
                }
        }`;

        const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
        const observable = client.request({ query });

        return {
            subscribe({next, error, complete}) {
                return observable.subscribe({
                    next(results) {
                        next(ethPrice.callback(results.data.bundle));
                    },
                    error,
                    complete
                });
            }
        };
    },
}


const ethPrice = {
    properties: [
        'ethPrice'
    ],

    callback(results) {
        return Number(results.ethPrice);
    },
}