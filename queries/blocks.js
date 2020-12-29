const ws = require('isomorphic-ws');
const { SubscriptionClient } = require('subscriptions-transport-ws'); 

const { request, gql } = require('graphql-request');

const { graphAPIEndpoints, graphWSEndpoints } = require('./../constants')

module.exports = {
    async latestBlock() {
        const result = await request(graphAPIEndpoints.blocklytics,
            gql`{
                blocks(first: 1, orderBy: number, orderDirection: desc) {
                    ${latestBlock.properties.toString()}
                }
            }`
        );

        return latestBlock.callback(result.blocks);
    },

    observeLatestBlock() {
        const query = gql`
            subscription {
                blocks(first: 1, orderBy: number, orderDirection: desc) {
                    ${latestBlock.properties.toString()}
                }
        }`;

        const client = new SubscriptionClient(graphWSEndpoints.blocklytics, { reconnect: true, }, ws,);
        const observable = client.request({ query });

        return {
            subscribe({next, error, complete}) {
                return observable.subscribe({
                    next(results) {
                        next(latestBlock.callback(results.data.blocks));
                    },
                    error,
                    complete
                })
            }
        };
    }
}

const latestBlock = {
    properties: [
        'id',
        'number',
        'timestamp'
    ],

    callback([{ id, number, timestamp }]) {
        return ({
            id: id,
            number: Number(number),
            timestamp: Number(timestamp),
            date: new Date(timestamp * 1000)
        });
    }
};