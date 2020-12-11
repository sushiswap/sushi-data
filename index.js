'use strict';

const pageResults = require('graph-results-pager');

const ws = require('ws');
const { SubscriptionClient } = require('subscriptions-transport-ws'); 

// TODO: exchange will need to be replaced with new exchange subgraph once it's finished
const graphAPIEndpoints = {
	masterchef: 'https://api.thegraph.com/subgraphs/name/sushiswap/master-chef',
	bar: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-bar',
	timelock: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-timelock',
	maker: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushi-maker',
	exchange: 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange',
	blocklytics: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks'
};

const graphWSEndpoints = {
	exchange: 'wss://api.thegraph.com/subgraphs/name/sushiswap/exchange',
}

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
	sushi: {
		info(blockNumber) {
			let sushi_address = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2"
			return pageResults({
				api: graphAPIEndpoints.exchange,
				query: {
					entity: 'tokens',
					selection: {
						where: {
							id: `\\"${sushi_address}\\"`
						},
						block: { number: blockNumber }
					},
					properties: [
						'derivedETH',
						'totalSupply'
					]
				}
			})
				.then(([{ derivedETH, totalSupply }]) =>
					({
						derivedETH: Number(derivedETH),
						totalSupply: Number(totalSupply)
					})
				)
				.catch(err => console.log(err));
		}
	},

	blocks: {
		latestBlock() {
			return pageResults({
				api: graphAPIEndpoints.blocklytics,
				query: {
					entity: 'blocks',
					selection: {
						first: 1,
						skip: 0,
						orderBy: 'number',
						orderDirection: 'desc',
						where: {
							number_gt: 11370252
						}
					},
					properties: [
						'id',
						'number',
						'timestamp'
					]
				}
			})
				.then(([{ id, number, timestamp }]) =>
					({
						id: id,
						number: Number(number),
						timestamp: Number(timestamp),
						date: new Date(timestamp * 1000)
					})
				)
				.catch(err => console.log(err));
		},

	},
	exchange: {
		tokens(token_address) {
			let where = token_address ? { id: `\\"${token_address.toLowerCase()}\\"` } : {}
			return pageResults({
				api: graphAPIEndpoints.exchange,
				query: {
					entity: 'tokens',
					selection: {
						where,
					},
					properties: [
						'id',
						'symbol',
						'name',
						'decimals',
						'totalSupply',
						'volume',
						'volumeUSD',
						'txCount',
						'liquidity',
						'derivedETH'
					],
				},
			})
				.then(results => {
					results = results.map(({ id, symbol, name, decimals, totalSupply, volume, volumeUSD, txCount, liquidity, derivedETH }) => ({
						id: id,
						symbol: symbol,
						name: name,
						decimals: Number(decimals),
						totalSupply: Number(totalSupply),
						volume: Number(volume),
						volumeUSD: Number(volumeUSD),
						txCount: Number(txCount),
						liquidity: Number(liquidity),
						derivedETH: Number(derivedETH)
					}))
					return token_address ? results[0] : results
				})
				.catch(err => console.log(err))
		},

		observeToken(token_address) {
			let query = token_address ? 
				`subscription { token(id: \"${token_address.toLowerCase()}\")` :
				`subscription { tokens(first: 1000, orderBy: volumeUSD, orderDirection: desc)`
			query += `{ id, symbol, name, decimals, totalSupply, volume, volumeUSD, txCount, liquidity, derivedETH}}`

			const client = new SubscriptionClient(
				graphWSEndpoints.exchange,
				{
					reconnect: true,
				},
				ws,
			);
				console.log(query)
			const observable = client.request({
				query
			});
			
			return {
				subscribe({next, error, complete}) {
					return observable.subscribe({
						next({ data }) {
							next(!token_address ? data.tokens.map(({ id, symbol, name, decimals, totalSupply, volume, volumeUSD, txCount, liquidity, derivedETH }) => ({
								id: id,
								symbol: symbol,
								name: name,
								decimals: Number(decimals),
								totalSupply: Number(totalSupply),
								volume: Number(volume),
								volumeUSD: Number(volumeUSD),
								txCount: Number(txCount),
								liquidity: Number(liquidity),
								derivedETH: Number(derivedETH)
							})) : data)
						},
						error,
						complete
					})
				}
			}
		},

		pairs(pair_address) {
			let where = pair_address ? { id: `\\"${pair_address.toLowerCase()}\\"` } : {}
			return pageResults({
				api: graphAPIEndpoints.exchange,
				query: {
					entity: 'pairs',
					selection: {
						orderBy: 'volumeUSD',
						orderDirection: 'desc',
						where,
					},
					properties: [
						'id',
						'token0 { id }',
						'token1 { id }',
						'reserve0',
						'reserve1',
						'totalSupply',
						'reserveETH',
						'reserveUSD',
						'trackedReserveETH',
						'token0Price',
						'token1Price',
						'volumeToken0',
						'volumeToken1',
						'volumeUSD',
						'untrackedVolumeUSD',
						'txCount',
					],
				},
			})
				.then(reserves => {
					reserves = reserves.map(({ id, token0, token1, reserve0, reserve1, totalSupply, reserveETH, reserveUSD, trackedReserveETH, token0Price, token1Price, volumeToken0, volumeToken1, volumeUSD, untrackedVolumeUSD, txCount }) => ({
						id: id,
						token0: token0.id,
						token1: token1.id,
						reserve0: Number(reserve0),
						reserve1: Number(reserve1),
						totalSupply: Number(totalSupply),
						reserveETH: Number(reserveETH),
						reserveUSD: Number(reserveUSD),
						trackedReserveETH: Number(trackedReserveETH),
						token0Price: Number(token0Price),
						token1Price: Number(token1Price),
						volumeToken0: Number(volumeToken0),
						volumeToken1: Number(volumeToken1),
						volumeUSD: Number(volumeUSD),
						untrackedVolumeUSD: Number(untrackedVolumeUSD),
						txCount: Number(txCount),
					}))
					return pair_address ? reserves[0] : reserves
				})
				.catch(err => console.log(err))
		},

		ethPrice() {
			return pageResults({
				api: graphAPIEndpoints.exchange,
				query: {
					entity: 'bundles',
					properties: [
						'ethPrice'
					],
				},
			})
				.then(([{ ethPrice }]) => Number(ethPrice))
				.catch(err => console.log(err))
		},

		factory() {
			let factory_address = "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac";
			return pageResults({
				api: graphAPIEndpoints.exchange,
				query: {
					entity: 'factories',
					selection: {
						where: {
							id: `\\"${factory_address}\\"`,
						},
					},
					properties: [
						'pairCount',
						'volumeUSD',
						'volumeETH',
						'untrackedVolumeUSD',
						'liquidityUSD',
						'liquidityETH',
						'txCount',
						'tokenCount',
						'userCount',
					],
				},
			})
				.then(([{ pairCount, volumeUSD, volumeETH, untrackedVolumeUSD, liquidityUSD, liquidityETH, txCount, tokenCount, userCount }]) => ({
					pairCount: Number(pairCount),
					volumeUSD: Number(volumeUSD),
					volumeETH: Number(volumeETH),
					untrackedVolumeUSD: Number(untrackedVolumeUSD),
					liquidityUSD: Number(liquidityUSD),
					liquidityETH: Number(liquidityETH),
					txCount: Number(txCount),
					tokenCount: Number(tokenCount),
					userCount: Number(userCount),
				}))
				.catch(err => console.log(err))
		},

		dayData(days) {
			return pageResults({
				api: graphAPIEndpoints.exchange,
				query: {
					entity: 'dayDatas',
					selection: {
						orderBy: 'date', 
						orderDirection: 'desc'
					},
					properties: [
						'id',
						'date',
						'volumeETH',
						'volumeUSD',
						'liquidityETH',
						'liquidityUSD',
						'txCount'
					]
				}
			})
				.then(results => {
					return results.map(({ id, date, volumeETH, volumeUSD, liquidityETH, liquidityUSD, txCount }) => ({
						id: Number(id),
						date: new Date(date * 1000),
						volumeETH: Number(volumeETH),
						volumeUSD: Number(volumeUSD),
						liquidityETH: Number(liquidityETH),
						liquidityUSD: Number(liquidityUSD),
						txCount: Number(txCount),
					})).slice(0, days) // Can't fetch an N number of days directly because graph-results-pager overrides the first value
				})
				.catch(err => console.log(err))
		},
	},

	masterchef: {
		info() {
			let mainnet_address = "0xc2edad668740f1aa35e4d8f227fb8e17dca888cd"
			return pageResults({
				api: graphAPIEndpoints.masterchef,
				query: {
					entity: 'masterChefs',
					selection: {
						where: {
							id: `\\"${mainnet_address}\\"`,
						}
					},
					properties: [
				    'bonusMultiplier',
				    'bonusEndBlock',
				    'devaddr',
				    'migrator',
				    'owner',
				    'startBlock',
				    'sushi',
				    'sushiPerBlock',
				    'totalAllocPoint',
				    'poolCount',
				    'slpBalance',
				    'slpAge',
				    'slpAgeRemoved',
				    'slpDeposited',
				    'slpWithdrawn',
				    'updatedAt'
					],
				},
			})
				.then(([{ bonusMultiplier, bonusEndBlock, devaddr, migrator, owner, startBlock, sushi, sushiPerBlock, totalAllocPoint, poolCount, slpBalance, slpAge, slpAgeRemoved, slpDeposited, slpWithdrawn, updatedAt }]) =>
					({
						bonusMultiplier: Number(bonusMultiplier),
				    bonusEndBlock: Number(bonusEndBlock),
				    devaddr: devaddr,
				    migrator: migrator,
				    owner: owner,
				    startBlock: Number(startBlock),
				    sushiPerBlock: sushiPerBlock / 1e18,
				    totalAllocPoint: Number(totalAllocPoint),
				    poolCount: Number(poolCount),
				    slpBalance: Number(slpBalance),
				    slpAge: Number(slpAge),
				    slpAgeRemoved: Number(slpAgeRemoved),
				    slpDeposited: Number(slpDeposited),
				    slpWithdrawn: Number(slpWithdrawn),
				    updatedAt: Number(updatedAt)
					})
				)
				.catch(err => console.log(err));
		},
		pools(identifier) {
			identifier = String(identifier);
			let where = identifier ? identifier.includes("x") ? { pair: `\\"${identifier}\\"`, } : { id: `\\"${identifier}\\"`, } : {};
			return pageResults({
				api: graphAPIEndpoints.masterchef,
				query: {
					entity: 'pools',
					selection: {
						orderBy: 'block',
						orderDirection: 'asc',
						where
					},
					properties: [
						'id',
				    'pair',
				    'allocPoint',
				    'lastRewardBlock',
				    'accSushiPerShare',
				    'balance',
				    'userCount',
				    'slpBalance',
				    'slpAge',
				    'slpAgeRemoved',
				    'slpDeposited',
				    'slpWithdrawn',
				    'timestamp',
				    'block',
				    'updatedAt',
				    'entryUSD',
				    'exitUSD',
				    'sushiHarvested',
				    'sushiHarvestedUSD'
					],
				},
			})
				.then(results =>
					results.map(({ id, pair, allocPoint, lastRewardBlock, accSushiPerShare, balance, userCount, slpBalance, slpAge, slpAgeRemoved, slpDeposited, slpWithdrawn, timestamp, block, updatedAt, entryUSD, exitUSD, sushiHarvested, sushiHarvestedUSD }) => ({
						id: Number(id),
				    pair: pair,
				    allocPoint: Number(allocPoint),
				    lastRewardBlock: Number(lastRewardBlock),
				    accSushiPerShare: accSushiPerShare / 1e18,
				    userCount: Number(userCount),
				    slpBalance: Number(slpBalance),
				    slpAge: Number(slpAge),
				    slpAgeRemoved: Number(slpAgeRemoved),
				    slpDeposited: Number(slpDeposited),
				    slpWithdrawn: Number(slpWithdrawn),
				    addedTs: Number(timestamp),
						addedDate: new Date(timestamp * 1000),
				    addedBlock: Number(block),
				    lastUpdatedTs: Number(updatedAt),
						lastUpdatedDate: new Date(updatedAt * 1000),
				    entryUSD: Number(entryUSD),
				    exitUSD: Number(exitUSD),
				    sushiHarvested: Number(sushiHarvested),
				    sushiHarvestedUSD: Number(sushiHarvestedUSD)
 					})),
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
				.then(([{ id, liquidityTokenBalance, pair }]) =>
					({
						// TODO: I don't think all of this info is necessary, we can get away
						//       with just returning totalValueETH and totalValueUSD for this query
						id: id,
						liquidityTokenBalance: Number(liquidityTokenBalance),
						totalSupply: Number(pair.totalSupply),
						totalValueETH: Number(pair.reserveETH),
						totalValueUSD: Number(pair.reserveUSD)
					})
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
				.then(([{ decimals, name, sushi, symbol, totalSupply, ratio, xSushiMinted, xSushiBurned, sushiStaked, sushiStakedUSD, sushiHarvested, sushiHarvestedUSD, xSushiAge, xSushiAgeDestroyed, updatedAt }]) =>
				({
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
					})
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
				.then(([{ bar, xSushi, xSushiIn, xSushiOut, xSushiMinted, xSushiBurned, xSushiOffset, xSushiAge, xSushiAgeDestroyed, sushiStaked, sushiStakedUSD, sushiHarvested, sushiHarvestedUSD, sushiOut, sushiIn, usdOut, usdIn, updatedAt, sushiOffset, usdOffset }]) =>
					({
						// TODO: will need to figure out calculations for sushi earned and apy here once we figure out xSushi transfer issues in the subgraph
						xSushi: Number(xSushi),
						sushiStaked: xSushi * bar.ratio,
						bar: bar
					})
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
				.then(([{ id, sushiServed }]) =>
					({
						address: id,
						sushiServed: Number(sushiServed)
					})
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
						'sushiServed',
						'servings { tx, block, pair, sushiServed }'
					]
				}
			})
				.then(results =>
					results.map(({ id, sushiServed, servings }) => ({
						serverAddress: id,
						sushiServed: Number(sushiServed),
						servings: servings.map(({ tx, block, pair, sushiServed}) => ({
							tx,
							block: Number(block),
							pair,
							sushiServed: Number(sushiServed)
						})),
					}))
				)
				.catch(err => console.log(err));
		},

		pendingServings() {
			let maker_address = "0x280ac711bb99de7c73fb70fb6de29846d5e4207f"
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
					results[0].liquidityPositions.map(({ liquidityTokenBalance, pair }) => ({
							address: pair.id,
							token0: pair.token0,
							token1: pair.token1,
							valueUSD: (liquidityTokenBalance / pair.totalSupply) * pair.reserveUSD
					})).sort((a, b) => b.valueUSD - a.valueUSD)
				)
				.catch(err => console.log(err));
		}
	},

	timelock: {		
		queuedTxs() {
			return pageResults({
				api: graphAPIEndpoints.timelock,
				query: {
					entity: 'timelocks',
					selection: {
						orderBy: 'createdBlock',
						orderDirection: 'desc',
						where: {
							isCanceled: false,
							isExecuted: false
						}
					},
					properties: [
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
				}
			})
				.then(results =>
					results.map(({ id, description, value, eta, functionName, data, targetAddress, createdBlock, createdTs, expiresTs, createdTx }) => ({
						txHash: id,
						description: description,
						value: Number(value),
						etaTs: Number(eta * 1000),
						etaDate: new Date(eta * 1000),
						functionName: functionName,
						data: data,
						targetAddress: targetAddress,
						createdBlock: Number(createdBlock),
						createdTs: Number(createdTs * 1000),
						createdDate: new Date(createdTs * 1000),
						expiresTs: Number(expiresTs * 1000),
						expiresDate: new Date(expiresTs * 1000),
						createdTx: createdTx,
					})),
				)
				.catch(err => console.log(err));
		},

		canceledTxs() {
			return pageResults({
				api: graphAPIEndpoints.timelock,
				query: {
					entity: 'timelocks',
					selection: {
						orderBy: 'createdBlock',
						orderDirection: 'desc',
						where: {
							isCanceled: true
						}
					},
					properties: [
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
					]
				}
			})
				.then(results =>
					results.map(({ id, description, value, eta, functionName, data, targetAddress, createdBlock, createdTs, expiresTs, canceledBlock, canceledTs, createdTx, canceledTx }) => ({
						txHash: id,
						description: description,
						value: Number(value),
						etaTs: Number(eta * 1000),
						etaDate: new Date(eta * 1000),
						functionName: functionName,
						data: data,
						targetAddress: targetAddress,
						createdBlock: Number(createdBlock),
						createdTs: Number(createdTs * 1000),
						createdDate: new Date(createdTs * 1000),
						expiresTs: Number(expiresTs * 1000),
						expiresDate: new Date(expiresTs * 1000),
						canceledBlock: canceledTx ? Number(canceledBlock) : null,
						canceledTs: canceledTx ? Number(canceledTs * 1000) : null,
						canceledDate: canceledTx ? new Date(canceledTs * 1000) : null,
						createdTx: createdTx,
						canceledTx: canceledTx,
					})),
				)
				.catch(err => console.log(err));
		},

		executedTxs() {
			return pageResults({
				api: graphAPIEndpoints.timelock,
				query: {
					entity: 'timelocks',
					selection: {
						orderBy: 'createdBlock',
						orderDirection: 'desc',
						where: {
							isExecuted: true
						}
					},
					properties: [
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
					]
				}
			})
				.then(results =>
					results.map(({ id, description, value, eta, functionName, data, targetAddress, createdBlock, createdTs, expiresTs, executedBlock, executedTs, createdTx, executedTx }) => ({
						txHash: id,
						description: description,
						value: Number(value),
						etaTs: Number(eta * 1000),
						etaDate: new Date(eta * 1000),
						functionName: functionName,
						data: data,
						targetAddress: targetAddress,
						createdBlock: Number(createdBlock),
						createdTs: Number(createdTs * 1000),
						createdDate: new Date(createdTs * 1000),
						expiresTs: Number(expiresTs * 1000),
						expiresDate: new Date(expiresTs * 1000),
						executedBlock: executedTx ? Number(executedBlock) : null,
						executedTs: executedTx ? Number(executedTs * 1000) : null,
						executedDate: executedTx ? new Date(executedTs * 1000) : null,
						createdTx: createdTx,
						executedTx: executedTx
					})),
				)
				.catch(err => console.log(err));
		},

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
