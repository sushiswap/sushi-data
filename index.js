'use strict';

const pageResults = require('graph-results-pager');

// TODO: exchange will need to be replaced with new exchange subgraph once it's finished
const graphAPIEndpoints = {
	masterchef: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushiswap',
	bar: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-bar',
	timelock: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-timelock',
	maker: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-maker',
	exchange: 'https://api.thegraph.com/subgraphs/name/zippoxer/sushiswap-subgraph-fork'
};

module.exports = {
	pageResults,
	graphAPIEndpoints,
	weth: {
		price() {
			let weth_usdc_pair = "0x397ff1542f962076d0bfe58ea045ffa2d347aca0"
			return pageResults({
				api: graphAPIEndpoints.exchange,
				query: {
					entity: 'pairs',
					selection: {
						where: {
							id: `\\"${weth_usdc_pair}\\"`
						}
					},
					properties: [
						'token0Price'
					]
				}
			})
				.then(([{ token0Price }]) => (Number(token0Price)))
				.catch(err => console.error(err))
		}
	},
	// TODO: can add blockNumber as another parameter to this to get the price for any block
	sushi: {
		info() {
			let sushi_address = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2"
			return pageResults({
				api: graphAPIEndpoints.exchange,
				query: {
					entity: 'tokens',
					selection: {
						where: {
							id: `\\"${sushi_address}\\"`
						}
					},
					properties: [
						'derivedETH',
						'totalSupply'
					]
				}
			})
				// TODO: need to figure out to not return this is an arraay, rather just an object
				.then(results =>
					results.map(({ derivedETH, totalSupply }) => ({
						derivedETH: Number(derivedETH),
						totalSupply: Number(totalSupply)
					}))
				)
				.catch(err => console.log(err));
		}
	},

	masterchef: {
		info() {
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
		// TODO: probably better to have a way for this to return pool info with either
		//       ID or tokenAddress. Or just decide which is better to use.
		pools() {
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

		pool({ poolId = undefined }) {
			// TODO: poolId must be a string, otherwise returns all of the pools if Num. Need to figure out how to support both types.
			//       can also probably get rid of pools() above and just use the query to return both individual pools and all pools
			return pageResults({
				api: graphAPIEndpoints.masterchef,
				query: {
					entity: 'masterChefPools',
					selection: {
						where: {
							id: poolId ? `\\"${poolId}\\"` : undefined
						}
					},
					properties: [
						'id',
						'balance',
						'lpToken',
						'allocPoint',
						'lastRewardBlock',
						'accSushiPerShare',
						'addedBlock',
						'addedTs'
					]
				}
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
					}))
				)
				.catch(err => console.log(err));
		},
		stakedValue({ lpToken = undefined }) {
			let chef_address = "0xc2edad668740f1aa35e4d8f227fb8e17dca888cd"
			return pageResults({
				api: graphAPIEndpoints.exchange,
				query: {
					entity: 'liquidityPositions',
					selection: {
						where: {
							id: `\\"${lpToken.toLowerCase()}-${chef_address}\\"`
						}
					},
					properties: [
						'id',
						'liquidityTokenBalance',
						'pair { id, totalSupply, reserveETH, reserveUSD }'
					]
				}
			})
				.then(results =>
					results.map(({ id, liquidityTokenBalance, pair }) => ({
						// TODO: I don't think all of this info is necessary, we can get away
						//       with just returning totalValueETH and totalValueUSD for this query
						id: id,
						liquidityTokenBalance: Number(liquidityTokenBalance),
						totalSupply: Number(pair.totalSupply),
						totalValueETH: Number(pair.reserveETH),
						totalValueUSD: Number(pair.reserveUSD)
					}))
				)
				.catch(err => console.log(err))
		}
	},

	bar: {
		info() {
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

		user({ user = undefined }) {
			return pageResults({
				api: graphAPIEndpoints.bar,
				query: {
					entity: 'users',
					selection: {
						where: {
							id: user ? `\\"${user.toLowerCase()}\\"` : undefined,
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
		info() {
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

		servings() {
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
		servers() {
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
		},

		pendingServings() {
			let maker_address = "0x6684977bbed67e101bb80fc07fccfba655c0a64f"
			return pageResults({
				api: graphAPIEndpoints.exchange,
				query: {
					entity: 'users',
					selection: {
						where: {
							id: `\\"${maker_address}\\"`,
						},
					},
					properties: [
						'liquidityPositions { id, liquidityTokenBalance, pair { id, totalSupply, reserveUSD, token0 { id, name, symbol }, token1 { id, symbol, name } } }'
					]
				}
			})
				.then(results =>
					results.map(({ liquidityPositions }) => ({
						servings: liquidityPositions.map(({ liquidityTokenBalance, pair }) => ({
							address: pair.id,
							token0: pair.token0,
							token1: pair.token1,
							valueUSD: (liquidityTokenBalance / pair.totalSupply) * pair.reserveUSD
						})),
					}))
				)
				.catch(err => console.log(err));
		}
	},

	timelock: {
		// TODO: We can probably split this up into QueuedTxs, CanceledTxs, and ExecutedTxs
		txs() {
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
