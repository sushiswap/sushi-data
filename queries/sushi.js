const pageResults = require('graph-results-pager');

const ws = require('isomorphic-ws');
const { SubscriptionClient } = require('subscriptions-transport-ws'); 

const { gql } = require('graphql-request');

const { graphAPIEndpoints, graphWSEndpoints, sushiAddress } = require('./../constants')
const { timestampToBlock } = require('./../utils')

module.exports = {
    async price({block = undefined, timestamp = undefined} = {}) {
        return pageResults({
            api: graphAPIEndpoints.exchange,
            query: {
                entity: 'tokens',
                selection: {
                    where: {
                        id: `\\"${sushiAddress}\\"`,
                    },
                    block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
                },
                properties: price.properties,
            }
        })
            .then(results => price.callback(results[0]))
            .catch(err => console.error(err));
    },

    observePrice() {
        const query = gql`
            subscription {
                    token(id: "${sushiAddress}") {
                        derivedETH
                    }
        }`;

        const client = new SubscriptionClient(graphWSEndpoints.exchange, { reconnect: true, }, ws,);
        const observable = client.request({ query });

        return {
            subscribe({next, error, complete}) {
                return observable.subscribe({
                    next(results) {
                        next(price.callback(results.data.token));
                    },
                    error,
                    complete
                });
            }
        };
    }
}

const price = {
    properties: [
        'derivedETH'
    ],

    callback(results) {
        return Number(results.derivedETH);
    },
};