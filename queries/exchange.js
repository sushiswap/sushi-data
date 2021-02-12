const pageResults = require('graph-results-pager');

const ws = require('isomorphic-ws');
const { SubscriptionClient } = require('subscriptions-transport-ws'); 

const { request, gql } = require('graphql-request');

const { graphAPIEndpoints, graphWSEndpoints, factoryAddress, TWENTY_FOUR_HOURS } = require('./../constants')
const { timestampToBlock, blockToTimestamp } = require('./../utils');

const token = require('./exchange/token');
const pair = require('./exchange/pair');
const factory = require('./exchange/factory');
const eth = require('./exchange/eth');

module.exports = {
    ...token,
    ...pair,
    ...factory,
    ...eth,
}