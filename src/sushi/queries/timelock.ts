import pageResults from 'graph-results-pager';

import { graphAPIEndpoints } from '../../constants';
import { timestampToBlock } from '../../utils';

import { Arg4 } from '../../../types';

import { Timelock } from '../../../types/subgraphs/timelock';



async function queuedTxs({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, max = undefined}: Arg4 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.timelock,
        query: {
            entity: 'timelocks',
            selection: {
                where: {
                    isCanceled: false,
                    isExecuted: false,
                    createdBlock_gte: minBlock || (minTimestamp ? await timestampToBlock(minTimestamp!) : undefined),
                    createdBlock_lte: maxBlock || (maxTimestamp ? await timestampToBlock(maxTimestamp!) : undefined),
                }
            },
            properties: queuedTxs_properties
        },
        max
    })

    return queuedTxs_callback(results);
}



async function canceledTxs({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, max = undefined}: Arg4 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.timelock,
        query: {
            entity: 'timelocks',
            selection: {
                where: {
                    isCanceled: true,
                    createdBlock_gte: minBlock || (minTimestamp ? await timestampToBlock(minTimestamp!) : undefined),
                    createdBlock_lte: maxBlock || (maxTimestamp ? await timestampToBlock(maxTimestamp!) : undefined),
                },
            },
            properties: canceledTxs_properties
        },
        max
    })

    return canceledTxs_callback(results);
}



const executedTxs = async({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, max = undefined}: Arg4 = {}) => {
    const results = await pageResults({
        api: graphAPIEndpoints.timelock,
        query: {
            entity: 'timelocks',
            selection: {
                where: {
                    isExecuted: true,
                    createdBlock_gte: minBlock || (minTimestamp ? await timestampToBlock(minTimestamp!) : undefined),
                    createdBlock_lte: maxBlock || (maxTimestamp ? await timestampToBlock(maxTimestamp!) : undefined),
                }
            },
            properties: executedTxs_properties
        },
        max
    })

    return executedTxs_callback(results);
}



export async function allTxs ({minTimestamp = undefined, maxTimestamp = undefined, minBlock = undefined, maxBlock = undefined, max = undefined}: Arg4 = {}) {
    const results = await pageResults({
        api: graphAPIEndpoints.timelock,
        query: {
            entity: 'timelocks',
            selection: {
                where: {
                    createdBlock_gte: minBlock || (minTimestamp ? await timestampToBlock(minTimestamp!) : undefined),
                    createdBlock_lte: maxBlock || (maxTimestamp ? await timestampToBlock(maxTimestamp!) : undefined),
                },
            },
            properties: allTxs_properties
        },
        max
    })

    return allTxs_callback(results);
}

export default {
    queuedTxs,
    canceledTxs,
    executedTxs,
    allTxs
}



const queuedTxs_properties = [
    'id',
    'description',
    'value',
    'eta',
    'functionName',
    'data',
    'targetAddress',
    'createdBlock',
    'createdTs',
    'expiresTs',
    'createdTx',
]

function queuedTxs_callback(results: Timelock[]) {
    return results
        .map(({ id, description, value, eta, functionName, data, targetAddress, createdBlock, createdTs, expiresTs, createdTx }) => ({
            txHash: id,
            description: description,
            value: Number(value),
            etaTs: Number(eta) * 1000,
            etaDate: new Date(Number(eta) * 1000),
            functionName: functionName,
            data: data,
            targetAddress: targetAddress,
            createdBlock: Number(createdBlock),
            createdTs: Number(createdTs) * 1000,
            createdDate: new Date(Number(createdTs) * 1000),
            expiresTs: Number(expiresTs) * 1000,
            expiresDate: new Date(Number(expiresTs) * 1000),
            createdTx: createdTx,
        }))
    .sort((a, b) => b.createdBlock - a.createdBlock);
}



const canceledTxs_properties = [
    'id',
    'description',
    'value',
    'eta',
    'functionName',
    'data',
    'targetAddress',
    'createdBlock',
    'createdTs',
    'expiresTs',
    'canceledBlock',
    'canceledTs',
    'createdTx',
    'canceledTx',
];

function canceledTxs_callback(results: Timelock[]) {
    return results
        .map((result) => ({
            txHash: result.id,
            description: result.description,
            value: Number(result.value),
            etaTs: Number(result.eta) * 1000,
            etaDate: new Date(Number(result.eta) * 1000),
            functionName: result.functionName,
            data: result.data,
            targetAddress: result.targetAddress,
            createdBlock: Number(result.createdBlock),
            createdTs: Number(result.createdTs) * 1000,
            createdDate: new Date(Number(result.createdTs) * 1000),
            expiresTs: Number(result.expiresTs) * 1000,
            expiresDate: new Date(Number(result.expiresTs) * 1000),
            canceledBlock: result.canceledTx ? Number(result.canceledBlock) : null,
            canceledTs: result.canceledTx ? Number(result.canceledTs) * 1000 : null,
            canceledDate: result.canceledTx ? new Date(Number(result.canceledTs) * 1000) : null,
            createdTx: result.createdTx,
            canceledTx: result.canceledTx,
        }))
    .sort((a, b) => b.createdBlock - a.createdBlock);
}



const executedTxs_properties = [
    'id',
    'description',
    'value',
    'eta',
    'functionName',
    'data',
    'targetAddress',
    'createdBlock',
    'createdTs',
    'expiresTs',
    'executedBlock',
    'executedTs',
    'createdTx',
    'executedTx'
];

function executedTxs_callback(results: Timelock[]) {
    return results
        .map(({ id, description, value, eta, functionName, data, targetAddress, createdBlock, createdTs, expiresTs, executedBlock, executedTs, createdTx, executedTx }) => ({
            txHash: id,
            description: description,
            value: Number(value),
            etaTs: Number(eta) * 1000,
            etaDate: new Date(Number(eta) * 1000),
            functionName: functionName,
            data: data,
            targetAddress: targetAddress,
            createdBlock: Number(createdBlock),
            createdTs: Number(createdTs) * 1000,
            createdDate: new Date(Number(createdTs) * 1000),
            expiresTs: Number(expiresTs) * 1000,
            expiresDate: new Date(Number(expiresTs) * 1000),
            executedBlock: executedTx ? Number(executedBlock) : null,
            executedTs: executedTx ? Number(executedTs) * 1000 : null,
            executedDate: executedTx ? new Date(Number(executedTs) * 1000) : null,
            createdTx: createdTx,
            executedTx: executedTx
        }))
        .sort((a, b) => b.createdBlock - a.createdBlock);;
}



const allTxs_properties = [
    'id',
    'description',
    'value',
    'eta',
    'functionName',
    'data',
    'targetAddress',
    'isCanceled',
    'isExecuted',
    'createdBlock',
    'createdTs',
    'expiresTs',
    'canceledBlock',
    'canceledTs',
    'executedBlock',
    'executedTs',
    'createdTx',
    'canceledTx',
    'executedTx'
];

function allTxs_callback(results: Timelock[]) {
    return results
        .map(({ id, description, value, eta, functionName, data, targetAddress, isCanceled, isExecuted, createdBlock, createdTs, expiresTs, canceledBlock, canceledTs, executedBlock, executedTs, createdTx, canceledTx, executedTx }) => ({
            txHash: id,
            description: description,
            value: Number(value),
            etaTs: Number(eta) * 1000,
            etaDate: new Date(Number(eta) * 1000),
            functionName: functionName,
            data: data,
            targetAddress: targetAddress,
            isCanceled: isCanceled,
            isExecuted: isExecuted,
            createdBlock: Number(createdBlock),
            createdTs: Number(createdTs) * 1000,
            createdDate: new Date(Number(createdTs) * 1000),
            expiresTs: Number(expiresTs) * 1000,
            expiresDate: new Date(Number(expiresTs) * 1000),
            canceledBlock: canceledTx ? Number(canceledBlock) : null,
            canceledTs: canceledTx ? Number(canceledTs) * 1000 : null,
            canceledDate: canceledTx ? new Date(Number(canceledTs) * 1000) : null,
            executedTs: executedTx ? Number(executedTs) * 1000 : null,
            executedDate: executedTx ? new Date(Number(executedTs) * 1000) : null,
            createdTx: createdTx,
            canceledTx: canceledTx,
            executedTx: executedTx
        }))
        .sort((a, b) => b.createdBlock - a.createdBlock);
}
