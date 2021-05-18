import pageResults from 'graph-results-pager';

import { request, gql } from 'graphql-request';

import { graphAPIEndpoints } from './constants';

const blocklytics = graphAPIEndpoints.blocklytics;

import {
    getUnixTime,
    startOfHour,
    startOfMinute,
    startOfSecond,
    subHours,
  } from "date-fns";

import { Arg1, ChainId } from '../types';



export async function timestampToBlock(timestamp: number, { chainId = 1 }: ChainId = {}) {
    timestamp = String(timestamp).length > 10 ? Math.floor(timestamp / 1000) : timestamp;

    let result = await request(blocklytics[chainId],
        gql`{
            blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_lte: ${timestamp} }) {
                number
            }
        }`
    );

    return Number(result.blocks[0].number);
}

export async function timestampsToBlocks(timestamps: number[], { chainId = 1 }: ChainId = {}) {   
    const query = (
        gql`{
            ${timestamps.map((timestamp) => (gql`
                timestamp${timestamp}: blocks(first:1, orderBy: timestamp, orderDirection: desc, where: { timestamp_lte: ${timestamp}}) {
                    number
            }`))}
        }`
    );

    let result = await request(blocklytics[chainId], query)

    result = Object.keys(result)
            .map(key => ({...result[key], timestamp: key.split("timestamp")[1]}))
            .sort((a, b) => Number(a.timestamp) - (b.timestamp));

    result.forEach((e: any) => delete e.timestamp);

    return result = Object.values(result).map((e: any) => Number(e[0].number));
}

export async function blockToTimestamp(block: number, { chainId = 1 }: ChainId = {}) {
    const result = await request(blocklytics[chainId],
        gql`{
            blocks(first: 1, where: { number: ${block} }) {
                timestamp
            }
        }`
    );

    return Number(result.blocks[0].timestamp);
}

export async function getAverageBlockTime({block = undefined, timestamp = undefined, chainId = 1}: Arg1 & ChainId = {}) {

    timestamp = timestamp ? String(timestamp).length > 10 ? Math.floor(timestamp / 1000) : timestamp : undefined;
    timestamp = timestamp ? timestamp : block ? await blockToTimestamp(block) : undefined;

    const now = startOfSecond(startOfMinute(startOfHour(timestamp ? timestamp * 1000 : Date.now())));
    const start = getUnixTime(subHours(now, 6));
    const end = getUnixTime(now);

    const blocks = (await pageResults({
        api: blocklytics[chainId],
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
    })).map(result => ({
        timestamp: Number(result.timestamp),
        difference: undefined
    }))

    const averageBlockTime = blocks
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
        .reduce(
            (previousValue, currentValue) => {
            if (previousValue.timestamp !== 0) {
                const difference = previousValue.timestamp - currentValue.timestamp;

                previousValue.difference = previousValue.difference + difference;
            }

            previousValue.timestamp = currentValue.timestamp;

            return previousValue;
            },
            { timestamp: 0, difference: 0 }
        ).difference / blocks.length

    return averageBlockTime;
}

export default {
    timestampToBlock,
    timestampsToBlocks,
    blockToTimestamp,
    getAverageBlockTime
}