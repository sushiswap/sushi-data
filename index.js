'use strict';

const pageResults = require('graph-results-pager');

const graphAPIEndpoints = {
	masterchef: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushiswap',
	bar: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-bar',
	timelock: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-timelock',
	maker: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-maker'
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
						'xSushiMinted',
						'xSushiBurned',
						'sushiStaked',
						'sushiStakedUSD',
						'sushiHarvested',
						'sushiHarvestedUSD',
						'xSushiAge',
						'xSushiAgeDestroyed',
						'updatedAt'
					]
				}
			})
				.then(results =>
					results.map(({ decimals, name, sushi, symbol, totalSupply, ratio, xSushiMinted, xSushiBurned, sushiStaked, sushiStakedUSD, sushiHarvested, sushiHarvestedUSD, xSushiAge, xSushiAgeDestroyed, updatedAt }) => ({
						decimals: Number(decimals),
						name: name,
						sushi: sushi,
						symbol: symbol,
						totalSupply: Number(totalSupply),
						ratio: Number(ratio),
						xSushiMinted: Number(xSushiMinted),
						xSushiBurned: Number(xSushiBurned),
						sushiStaked: Number(totalSupply) * Number(ratio),
						sushiStakedUSD: Number(sushiStakedUSD),
						sushiHarvested: Number(sushiHarvested),
						sushiHarvestedUSD: Number(sushiHarvestedUSD),
						xSushiAge: Number(xSushiAge),
						xSushiAgeDestroyed: Number(xSushiAgeDestroyed),
						updatedAt: Number(updatedAt)
					}))
				)
				.catch(err => console.log(err));
		},

		User({ user = undefined }) {
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
						'bar { sushiStaked, ratio, totalSupply }',
						'xSushi',
						'xSushiIn',
						'xSushiOut',
						'xSushiMinted',
						'xSushiBurned',
						'xSushiOffset',
						'xSushiAge',
						'xSushiAgeDestroyed',
						'sushiStaked',
						'sushiStakedUSD',
						'sushiHarvested',
						'sushiHarvestedUSD',
						'sushiOut',
						'sushiIn',
						'usdOut',
						'usdIn',
						'updatedAt',
						'sushiOffset',
						'usdOffset'
					]
				}
			})
				.then(results =>
					results.map(({ bar, xSushi, xSushiIn, xSushiOut, xSushiMinted, xSushiBurned, xSushiOffset, xSushiAge, xSushiAgeDestroyed, sushiStaked, sushiStakedUSD, sushiHarvested, sushiHarvestedUSD, sushiOut, sushiIn, usdOut, usdIn, updatedAt, sushiOffset, usdOffset }) => ({
						// TODO: will need to figure out calculations for sushi earned and apy here once we figure out xSushi transfer issues in the subgraph
						xSushi: Number(xSushi),
						sushiStaked: xSushi * bar.ratio,
						bar: bar
					}))
				)
				.catch(err => console.log(err));
		},

	},
	maker: {
		Info() {
			return pageResults({
				api: graphAPIEndpoints.maker,
				query: {
					entity: 'makers',
					properties: [
						'id',
						'sushiServed'
					]
				}
			})
				.then(results =>
					results.map(({ id, sushiServed }) => ({
						address: id,
						sushiServed: Number(sushiServed)
					}))
				)
				.catch(err => console.log(err));
		},

		Servings() {
			return pageResults({
				api: graphAPIEndpoints.maker,
				query: {
					entity: 'servings',
					selection: {
						orderBy: 'block',
						orderDirection: 'desc'
					},
					properties: [
						'server { id }',
						'tx',
						'pair',
						'token0',
						'token1',
						'sushiServed',
						'block',
						'timestamp'
					]
				}
			})
				.then(results =>
					results.map(({ server, tx, pair, token0, token1, sushiServed, block, timestamp }) => ({
						serverAddress: server.id,
						tx: tx,
						pair: pair,
						token0: token0,
						token1: token1,
						sushiServed: Number(sushiServed),
						block: Number(block),
						timestamp: Number(timestamp * 1000),
						date: new Date(timestamp * 1000)
					}))
				)
				.catch(err => console.log(err));
		},

		// TODO: Add support for getting Server's history of Servings here
		Servers() {
			return pageResults({
				api: graphAPIEndpoints.maker,
				query: {
					entity: 'servers',
					selection: {
						orderBy: 'sushiServed',
						orderDirection: 'desc'
					},
					properties: [
						'id',
						'sushiServed'
					]
				}
			})
				.then(results =>
					results.map(({ id, sushiServed }) => ({
						serverAddress: id,
						sushiServed: Number(sushiServed)
					}))
				)
				.catch(err => console.log(err));
		}
	},
	timelock: {
		// TODO: We can probably split this up into QueuedTxs, CanceledTxs, and ExecutedTxs
		Txs() {
			return pageResults({
				api: graphAPIEndpoints.timelock,
				query: {
					entity: 'timelocks',
					selection: {
						orderBy: 'createdBlock',
						orderDirection: 'desc'
					},
					properties: [
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
					]
				}
			})
				.then(results =>
					results.map(({ id, description, value, eta, functionName, data, targetAddress, isCanceled, isExecuted, createdBlock, createdTs, expiresTs, canceledBlock, canceledTs, executedBlock, executedTs, createdTx, canceledTx, executedTx }) => ({
						txHash: id,
						description: description,
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
						canceledBlock: canceledTx ? Number(canceledBlock) : null,
						canceledTs: canceledTx ? Number(canceledTs * 1000) : null,
						canceledDate: canceledTx ? new Date(canceledTs * 1000) : null,
						executedTs: executedTx ? Number(executedTs * 1000) : null,
						executedDate: executedTx ? new Date(executedTs * 1000) : null,
						createdTx: createdTx,
						canceledTx: canceledTx,
						executedTx: executedTx
					})),
				)
				.catch(err => console.log(err));
		}
	},
};
