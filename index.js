'use strict';

const pageResults = require('graph-results-pager');

const graphAPIEndpoints = {
	masterchef: 'https://api.thegraph.com/subgraphs/name/zippoxer/sushiswap',
};

module.exports = {
	pageResults,
	graphAPIEndpoints,
	masterchef: {
		masterChefPools() {
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
						'exchange',
						'addedAt',
					],
				},
			})
				.then(results =>
					results.map(({ id, balance, lpToken, allocPoint, lastRewardBlock, accSushiPerShare, exchange, addedAt }) => ({
						id: Number(id),
						balance: Number(balance),
						lpToken: lpToken,
						allocPoint: Number(allocPoint),
						lastRewardBlock: Number(lastRewardBlock),
						accSushiPerShare: Number(accSushiPerShare),
						exchange: exchange,
						addedAt: addedAt,
					})),
				)
				.catch(err => console.log(err));
		},
	},
};
