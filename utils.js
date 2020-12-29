const { request, gql } = require('graphql-request');
const blocklytics = 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks';

async function timestampToBlock(timestamp) {
    const result = await request(blocklytics,
        gql`{
            blocks(first: 1, orderBy: timestamp, where: { timestamp_gte: ${timestamp} }) {
                number
            }
        }`
    );

    return Number(result.blocks[0].number);
}

async function blockToTimestamp(block) {
    const result = await request(blocklytics,
        gql`{
            blocks(first: 1, where: { number: ${block} }) {
                timestamp
            }
        }`
    );

    return Number(result.blocks[0].timestamp);
}

module.exports = {
    timestampToBlock,
    blockToTimestamp,
};