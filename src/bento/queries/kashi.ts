import pageResults from 'graph-results-pager';

import { request, gql } from 'graphql-request';

import {
    getUnixTime,
    fromUnixTime
} from "date-fns";

import { graphAPIEndpoints, TWENTY_FOUR_HOURS } from '../../constants';
import { timestampToBlock, timestampsToBlocks, blockToTimestamp } from '../../utils';

import { Arg1, Arg2, Arg3, Arg5, Awaited } from '../../../types';
import { KashiPair } from '../../../types/subgraphs/bentobox';



export async function pair({block = undefined, timestamp = undefined, address}: (
    Arg1 & {address: string}
)) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }

    block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
    const blockString = block ? `block: { number: ${block} }` : "";

    const result = await request(graphAPIEndpoints.bentobox,
        gql`{
                kashiPair(id: "${address.toLowerCase()}", ${blockString}) {
                    ${pair_properties.toString()}
                }
            }`
    );

    return pair_callback([result.kashiPair])[0];
}



export async function pairChange({block = undefined, timestamp = undefined, spacing = TWENTY_FOUR_HOURS, address}: (
    Arg1 & {
        spacing?: number;
        address: string
    }
)) {    
    const timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
    const timestamp1ago = timestampNow - spacing;
    const timestamp2ago = timestamp1ago - spacing;

    const [blockNow, block1ago, block2ago] = await Promise.all([
        timestamp ? timestampToBlock(timestamp) : block,
        timestampToBlock(timestamp1ago),
        timestampToBlock(timestamp2ago)
    ]);

    const [result, result1ago, result2ago] = await Promise.all([
        pair({block: blockNow, address}),
        pair({block: block1ago, address}),
        pair({block: block2ago, address})
    ])

    return pair_callbackChange([result], [result1ago], [result2ago])[0];
}



export async function pairChart({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, min = 10, max = undefined, spacing = TWENTY_FOUR_HOURS, address}: (
    Arg5 & {
        address: string;
    }
)) {    
    minTimestamp = minBlock ? await blockToTimestamp(minBlock) : minTimestamp;
    maxTimestamp = maxBlock ? await blockToTimestamp(maxBlock) : maxTimestamp;

    const endTime = maxTimestamp ? fromUnixTime(maxTimestamp) : new Date();
    let time = minTimestamp ? minTimestamp : Math.floor(Date.now() / 1000) - spacing * min;

    // create an array of hour start times until we reach current hour
    const timestamps: number[] = [];
    while (time <= getUnixTime(endTime)) {
        timestamps.push(time + spacing);
        time += spacing;
    }

    let blocks = await timestampsToBlocks(timestamps);

    const query = (
        gql`{
            ${blocks.map((block, i) => (gql`
                timestamp${timestamps[i]}: kashiPair(id: "${address.toLowerCase()}", block: {number: ${block}}) {
                    ${pair_properties.toString()}
            }`))}
        }`
    );

    let result = await request(graphAPIEndpoints.bentobox, query);

    result = Object.keys(result)
        .map(key => ({...result[key], timestamp: Number(key.split("timestamp")[1])}))
        .sort((a, b) => (a.timestamp) - (b.timestamp))
        .filter(e => Object.keys(e).length > 1)

    return pair_callbackChart(result).slice(undefined, max);
}



export async function pairs({block = undefined, timestamp = undefined, max = undefined, addresses = undefined}: (
    Arg2 & {addresses?: string[]}
) = {}){
    if(addresses) {
        
        block = block ? block : timestamp ? (await timestampToBlock(timestamp)) : undefined;
        const blockString = block ? `block: { number: ${block} }` : "";

        const query = (
            gql`{
                ${addresses.map((pair, i) => (`
                    pair${i}: kashiPair(id: "${pair.toLowerCase()}", ${blockString}) {
                        ${pair_properties.toString()}
                }`))}
            }`
        );

        const result: KashiPair[] = Object.values(await request(graphAPIEndpoints.bentobox, query));
        return pair_callback(result);
    }
    
    const results = await pageResults({
        api: graphAPIEndpoints.bentobox,
        query: {
            entity: 'kashiPairs',
            selection: {
                block: block ? { number: block } : timestamp ? { number: await timestampToBlock(timestamp) } : undefined,
            },
            properties: pair_properties
        },
        max
    });

    return pair_callback(results);
}



export async function pairsChange({block = undefined, timestamp = undefined, spacing = TWENTY_FOUR_HOURS, addresses = undefined}: (
    Arg1 & {
        spacing?: number;
        addresses?: string[]
    }
) = {}) {    
    const timestampNow = timestamp ? timestamp : block ? await blockToTimestamp(block) : (Math.floor(Date.now() / 1000));
    const timestamp1ago = timestampNow - spacing;
    const timestamp2ago = timestamp1ago - spacing;

    block = timestamp ? await timestampToBlock(timestamp) : block;
    const [block1ago, block2ago] = await Promise.all([
        timestampToBlock(timestamp1ago),
        timestampToBlock(timestamp2ago)
    ]);

    const [result, result1ago, result2ago] = await Promise.all([
        pairs({block: block, addresses}),
        pairs({block: block1ago, addresses}),
        pairs({block: block2ago, addresses})
    ])

    return pair_callbackChange(result, result1ago, result2ago);
}

export default {
    pair,
    pairChange,
    pairChart,
    pairs,
    pairsChange
}



const pair_properties = [
    'id',
    'asset { totalSupplyBase, totalSupplyElastic, name, symbol, decimals }',
    'collateral { totalSupplyBase, totalSupplyElastic, name, symbol, decimals }',
    'exchangeRate',
    'feeTo',
    'feesEarnedFraction',
    'interestPerSecond',
    'lastAccrued',
    'name',
    'oracle',
    'owner',
    'symbol',
    'totalAssetBase',
    'totalAssetElastic',
    'totalBorrowBase',
    'totalBorrowElastic',
    'totalCollateralShare',
    'utilization'
];

function pair_callback(results: KashiPair[]) {
    return results.map(result => ({
        id: String(result.id),
        asset: {
            totalSupplyBase: BigInt(result.asset?.totalSupplyBase),
            totalSupplyElastic: BigInt(result.asset?.totalSupplyElastic),
            name: String(result.asset?.name),
            symbol: String(result.asset?.symbol),
            decimals: Number(result.asset?.decimals)
        },
        collateral: {
            totalSupplyBase: BigInt(result.collateral?.totalSupplyBase),
            totalSupplyElastic: BigInt(result.collateral?.totalSupplyElastic),
            name: String(result.collateral?.name),
            symbol: String(result.collateral?.symbol),
            decimals: Number(result.collateral?.decimals)
        },
        exchangeRate: BigInt(result.exchangeRate),
        feeTo: String(result.feeTo),
        feesEarnedFraction: BigInt(result.feesEarnedFraction),
        interestPerSecond: BigInt(result.interestPerSecond),
        lastAccrued: BigInt(result.lastAccrued),
        name: String(result.name),
        oracle: String(result.oracle),
        owner: String(result.owner),
        symbol: String(result.symbol),
        totalAssetBase: BigInt(result.totalAssetBase),
        totalAssetElastic: BigInt(result.totalAssetElastic),
        totalBorrowBase: BigInt(result.totalBorrowBase),
        totalBorrowElastic: BigInt(result.totalBorrowElastic),
        totalCollateralShare: BigInt(result.totalCollateralShare),
        utilization: BigInt(result.utilization)
    }));
};



function pair_callbackChange(
    results: Awaited<ReturnType<typeof pairs>>,
    results1ago: Awaited<ReturnType<typeof pairs>>,
    results2ago: Awaited<ReturnType<typeof pairs>>
    ) {

    return results.map(result => {
        const result1ago = results1ago.find(e => e.id === result.id) || result;
        const result2ago = results2ago.find(e => e.id === result.id) || result;

        return ({
            ...result,

            asset: {
                ...result.asset,

                totalSupplyBaseChange: Number(result.asset.totalSupplyBase) / Number(result1ago.asset?.totalSupplyBase) * 100 - 100,
                totalSupplyBaseChangeCount: result.asset.totalSupplyBase - result1ago.asset.totalSupplyBase,

                totalSupplyElasticChange: Number(result.asset.totalSupplyElastic) / Number(result1ago.asset.totalSupplyElastic) * 100 - 100,
                totalSupplyElasticChangeCount: result.asset.totalSupplyElastic - result1ago.asset.totalSupplyElastic,
            },

            collateral: {
                ...result.collateral,

                totalSupplyBaseChange: Number(result.collateral.totalSupplyBase) / Number(result1ago.collateral?.totalSupplyBase) * 100 - 100,
                totalSupplyBaseChangeCount: result.collateral.totalSupplyBase - result1ago.collateral.totalSupplyBase,

                totalSupplyElasticChange: Number(result.collateral.totalSupplyElastic) / Number(result1ago.collateral.totalSupplyElastic) * 100 - 100,
                totalSupplyElasticChangeCount: result.collateral.totalSupplyElastic - result1ago.collateral.totalSupplyElastic,
            },

            exchangeRateChange: Number(result.exchangeRate) / Number(result1ago.exchangeRate) * 100 - 100,
            exchangeRateChangeCount: result.exchangeRate - result1ago.exchangeRate,

            feesEarnedFractionPeriod: result.feesEarnedFraction - result1ago.feesEarnedFraction,
            feesEarnedFractionChange: Number(result.feesEarnedFraction) / Number(result1ago.feesEarnedFraction) * 100 - 100,
            feesEarnedFractionChangeCount: (result.feesEarnedFraction - result1ago.feesEarnedFraction) - (result1ago.feesEarnedFraction - result2ago.feesEarnedFraction),

            interestPerSecondChange: Number(result.interestPerSecond) / Number(result.interestPerSecond) * 100 - 100,
            interestPerSecondChangeCount: result.interestPerSecond - result1ago.interestPerSecond,

            totalAssetBaseChange: Number(result.totalAssetBase) / Number(result1ago.totalAssetBase) * 100 - 100,
            totalAssetBaseChangeCount: result.totalAssetBase - result1ago.totalAssetBase,

            totalAssetElasticChange: Number(result.totalAssetElastic) / Number(result1ago.totalAssetElastic) * 100 - 100,
            totalAssetElasticChangeCount: result.totalAssetElastic - result1ago.totalAssetElastic,

            totalBorrowBaseChange: Number(result.totalBorrowBase) / Number(result1ago.totalBorrowBase) * 100 - 100,
            totalBorrowBaseChangeCount: result.totalBorrowBase - result1ago.totalBorrowBase,

            totalBorrowElasticChange: Number(result.totalBorrowElastic) / Number(result1ago.totalBorrowElastic) * 100 - 100,
            totalBorrowElasticChangeCount: result.totalBorrowElastic - result1ago.totalBorrowElastic,

            totalCollateralShareChange: Number(result.totalCollateralShare) / Number(result1ago.totalCollateralShare) * 100 - 100,
            totalCollateralShareChangeCount: result.totalCollateralShare - result1ago.totalCollateralShare,

            utilizationChange: Number(result.utilization) / Number(result1ago.utilization) * 100 - 100,
            utilizationChangeCount: result.utilization - result1ago.utilization
        })
    });
};



function pair_callbackChart(results: KashiPair[]) {
    return results.map(result => ({
        id: String(result.id),
        asset: {
            totalSupplyBase: BigInt(result.asset?.totalSupplyBase),
            totalSupplyElastic: BigInt(result.asset?.totalSupplyElastic),
            name: String(result.asset?.name),
            symbol: String(result.asset?.symbol),
            decimals: Number(result.asset?.decimals)
        },
        collateral: {
            totalSupplyBase: BigInt(result.collateral?.totalSupplyBase),
            totalSupplyElastic: BigInt(result.collateral?.totalSupplyElastic),
            name: String(result.collateral?.name),
            symbol: String(result.collateral?.symbol),
            decimals: Number(result.collateral?.decimals)
        },
        exchangeRate: BigInt(result.exchangeRate),
        feeTo: String(result.feeTo),
        feesEarnedFraction: BigInt(result.feesEarnedFraction),
        interestPerSecond: BigInt(result.interestPerSecond),
        lastAccrued: BigInt(result.lastAccrued),
        name: String(result.name),
        oracle: String(result.oracle),
        owner: String(result.owner),
        symbol: String(result.symbol),
        totalAssetBase: BigInt(result.totalAssetBase),
        totalAssetElastic: BigInt(result.totalAssetElastic),
        totalBorrowBase: BigInt(result.totalBorrowBase),
        totalBorrowElastic: BigInt(result.totalBorrowElastic),
        totalCollateralShare: BigInt(result.totalCollateralShare),
        utilization: BigInt(result.utilization),
        timestamp: Number(result.timestamp)
    }));
};