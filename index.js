'use strict';

const pageResults = require('graph-results-pager');

const graphAPIEndpoints = {
	masterchef: 'https://api.thegraph.com/subgraphs/name/sushiswap/sushiswap',
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
						date: new Date(addedTs * 1000)
					})),
				)
				.catch(err => console.log(err));
		},
	},
};
