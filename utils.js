const pageResults = require('graph-results-pager');

const { request, gql } = require('graphql-request');
const blocklytics = 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks';

const {
    getUnixTime,
    startOfHour,
    startOfMinute,
    startOfSecond,
    subHours,
  } = require("date-fns");

async function timestampToBlock(timestamp) {
    timestamp = String(timestamp).length > 10 ? Math.floor(timestamp / 1000) : timestamp;

    let result = await request(blocklytics,
        gql`{
            blocks(first: 1, orderBy: timestamp, where: { timestamp_gte: ${timestamp} }) {
                number
            }
        }`
    );
    
    // if the timestamp is too new
    if(result.blocks.length === 0) {
        result = await request(blocklytics,
            gql`{
                blocks(first: 1, orderBy: timestamp, orderDirection: desc) {
                    number
                }
            }`
        );
    }

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

async function getAverageBlockTime({block = undefined, timestamp = undefined} = {}) {

    timestamp = timestamp ? String(timestamp).length > 10 ? Math.floor(timestamp / 1000) : timestamp : undefined;
    timestamp = timestamp ? timestamp : block ? await blockToTimestamp(block) : undefined;

    const now = startOfSecond(startOfMinute(startOfHour(timestamp ? timestamp * 1000 : Date.now())));
    const start = getUnixTime(subHours(now, 6));
    const end = getUnixTime(now);

    const blocks = await pageResults({
        api: blocklytics,
        query: {
            entity: 'blocks',
            selection: {
                orderBy: "number",
                orderDirection: "desc",
                where: {
                    timestamp_gte: start,
                    timestamp_lte: end
                }
            },
            properties: [
                'timestamp'
            ]
        }
    })

    const averageBlockTime = blocks.reduce(
        (previousValue, currentValue, currentIndex) => {
        if (previousValue.timestamp) {
            const difference = previousValue.timestamp - currentValue.timestamp;

            previousValue.difference = previousValue.difference + difference;
        }

        previousValue.timestamp = currentValue.timestamp;

        if (currentIndex === blocks.length - 1) {
            return previousValue.difference / blocks.length;
        }

        return previousValue;
        },
        { timestamp: null, difference: 0 }
    );

    return averageBlockTime;
}

module.exports = {
    timestampToBlock,
    blockToTimestamp,
    getAverageBlockTime,
};