'use strict';

const pageResults = require('graph-results-pager');

const graphAPIEndpoints = {
	masterchef: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushiswap',
	bar: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-bar'
};

module.exports = {
	pageResults,
	graphAPIEndpoints,
	masterchef: {
		Info() {
			return pageResults({
				api: graphAPIEndpoints.masterchef,
				// Note: a single subgraph fetch can return 1000 results, any larger numbers will trigger multiple fetches
				query: {
					entity: 'masterChefs',
					selection: {
						where: {
							id: "1",
						}
					},
					properties: [
						'totalAllocPoint',
						'poolLength',
					],
				},
			})
				.then(results =>
					results.map(({ totalAllocPoint, poolLength }) => ({
						totalAllocPoint: Number(totalAllocPoint),
						poolLength: Number(poolLength)
					})),
				)
				.catch(err => console.log(err));
		},

		Pools() {
			return pageResults({
				api: graphAPIEndpoints.masterchef,
				query: {
					entity: 'masterChefPools',
					properties: [
						'id',
						'balance',
						'lpToken',
						'allocPoint',
						'lastRewardBlock',
						'accSushiPerShare',
						'addedBlock',
						'addedTs',
					],
				},
			})
				.then(results =>
					results.map(({ id, balance, lpToken, allocPoint, lastRewardBlock, accSushiPerShare, addedBlock, addedTs }) => ({
						id: Number(id),
						balance: balance / 1e18,
						lpToken: lpToken,
						allocPoint: Number(allocPoint),
						lastRewardBlock: Number(lastRewardBlock),
						accSushiPerShare: accSushiPerShare / 1e18,
						addedBlock: Number(addedBlock),
						addedTs: Number(addedTs * 1000),
						addedDate: new Date(addedTs * 1000)
					})),
				)
				.catch(err => console.log(err));
		},

		TimeLocks() {
			return pageResults({
				api: graphAPIEndpoints.masterchef,
				query: {
					entity: 'timelocks',
					selection: {
						orderBy: 'createdBlock',
						orderDirection: 'desc',
					},
					properties: [
						'id',
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
					],
				},
			})
				.then(results =>
					results.map(({ id, value, eta, functionName, data, targetAddress, isCanceled, isExecuted, createdBlock, createdTs, expiresTs, canceledBlock, canceledTs, executedBlock, executedTs, createdTx, canceledTx, executedTx }) => ({
						txHash: id,
						value: Number(value),
						etaTs: Number(eta * 1000),
						etaDate: new Date(eta * 1000),
						functionName: functionName,
						data: data,
						targetAddress: targetAddress,
						isCanceled: isCanceled,
						isExecuted: isExecuted,
						createdBlock: Number(createdBlock),
						createdTs: Number(createdTs * 1000),
						createdDate: new Date(createdTs * 1000),
						expiresTs: Number(expiresTs * 1000),
						expiresDate: new Date(expiresTs * 1000),
						canceledBlock: Number(canceledBlock),
						canceledTs: Number(canceledTs * 1000),
						canceledDate: new Date(canceledTs * 1000),
						executedBlock: Number(executedBlock),
						executedTs: Number(executedTs * 1000),
						executedDate: new Date(executedTs * 1000),
						createdTx: createdTx,
						canceledTx: canceledTx,
						executedTx: executedTx
					})),
				)
				.catch(err => console.log(err));
		},

	},
	bar: {
		Info() {
			return pageResults({
				api: graphAPIEndpoints.bar,
				query: {
					entity: 'bars',
					properties: [
						'decimals',
						'name',
						'sushi',
						'symbol',
						'totalSupply',
						'ratio',
						'updatedAt'
					]
				}
			})
				.then(results =>
					results.map(({ decimals, name, sushi, symbol, totalSupply, ratio, updatedAt }) => ({
						decimals: Number(decimals),
						name: name,
						sushi: sushi,
						symbol: symbol,
						totalSupply: Number(totalSupply),
						ratio: Number(ratio),
						sushiStaked: Number(totalSupply) * Number(ratio),
						updatedAt: Number(updatedAt)
					}))
				)
				.catch(err => console.log(err));
		},

		User({ user = undefined }) {
			console.log(user)
			return pageResults({
				api: graphAPIEndpoints.bar,
				query: {
					entity: 'users',
					selection: {
						where: {
							id: user ? `\\"${user}\\"` : undefined,
						}
					},
					properties: [
						'xSushi'
					]
				}
			})
				.then(results =>
					results.map(({ xSushi }) => ({
						xSushi: Number(xSushi)
					}))
				)
				.catch(err => console.log(err));
		},

	},
};
