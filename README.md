# sushi-data

This is a collection of utilities to query SushiSwap data from Ethereum. This
data has been indexed by the Graph via the subgraph the SushiSwap team maintains.

## Supported Queries

The below all return a Promise that resolves with the requested results.


1. `sushi.price({¹})` Gets ETH price of Sushi.
2. `blocks.latestBlock()` Gets the latest block.
3. `blocks.getBlock({¹})` Gets data for the specified block.
4. `exchange.token({¹, token_address})` Gets data for specified token.
5. `exchange.tokens({¹})` Gets data for all tokens.
6. `exchange.pair({¹, pair_address})` Gets data for specified pair.
7. `exchange.pairs({¹})` Gets data for all pairs.
8. `exchange.ethPrice({¹})` Gets USD price of ETH.
9. `exchange.factory({¹})` Gets all data for the SushiSwap factory.
10. `exchange.dayData({²})` Gets data for the SushiSwap factory broken down by day.
11. `exchange_v1.userHistory({², user_address})` Gets LP history for specified user.
12. `exchange_v1.userPositions({¹, user_address})` Gets LP positions for specified user.
13. `masterchef.info({¹})` Gets MasterChef contract info.
14. `masterchef.pool({¹, pool_id, pool_address})` Gets pool info, either by pool id or by pool address.
15. `masterchef.pools({¹})` Gets pool info for all pools in MasterChef.
16. `masterchef.user({¹, user_address})` Gets all pools user has stake in.
17. `exchange.stakedValue({¹, token_address})` Get pricing info for MasterChef pool.
18. `bar.info({¹})` Gets SushiBar contract info.
19. `bar.user({¹, user_address})` Gets SushiBar data for specified user.
20. `maker.info({¹})` Gets SushiMaker contract info.
21. `maker.servings({²})` Gets past servings to the bar.
22. `maker.servers({¹})` Gets servers that have served Sushi to the bar.
23. `maker.pendingServings({¹})` Gets data on the servings ready to be served to the bar.
24. `timelock.queuedTxs({²})` Gets queued Timelock transactions.
25. `timelock.canceledTxs({²})` Gets canceled Timelock transactions.
26. `timelock.executedTxs({²})` Gets executed Timelock transactions.
27. `timelock.allTxs({²})` Gets all Timelock transactions.
28. `lockup.user({¹, user_address})` Gets lockup data for specified user.

¹ `{block, timestamp}` Supports fetching at a specific block / UNIX timestamp.    
² `{minBlock, maxBlock, minTimestamp, maxTimestamp}` Supports fetching in a specific timeframe.

## Supported Subscriptions
The below all return an Observable that when subscribed to with an object.

1. `sushi.observePrice()` Gets an observable of the current ETH price of Sushi.
2. `blocks.observeLatestBlock()` Gets an observable of the latest block.
3. `exchange.observeToken({token_address})` Gets an observable for specified token.
4. `exchange.observeTokens()` Gets an observable for the top 1000 tokens (by volume in USD).
5. `exchange.observePair({pair_address})` Gets an observable for specified pair.
6. `exchange.observePairs()` Gets an observable for the top 1000 pairs (by liquidity in USD).
7. `exchange.observeEthPrice()` Gets an observable for the current USD price of ETH.
8. `exchange.observeFactory()` Gets an observable for the SushiSwap factory.
9. `bar.observeInfo()` Gets an observable for SushiBar contract info.
10. `maker.observePendingServings()` Gets an observable for pending servings.

## Timeseries

`sushiData.timeseries({blocks = [], timestamps = [], target = targetFunction}, {targetArguments})` Returns an array of queries. Blocks / timestamps are arrays of the blocks / timestamps to query (choose one). The target is the target function, the target arguments are the arguments for the target. See example below

## Example

```javascript
const sushiData = require('@sushiswap/sushi-data'); // common js
// or
import sushiData from '@sushiswap/sushi-data'; // es modules

// query and log resolved results
sushiData.masterchef
  .pools({block: 11223344})
  .then(pools => console.log(pools))

sushiData.timelock
  .allTxs({minTimestamp: 1605239738, maxTimestamp: 1608239738})
  .then(txs => console.log(txs))

sushiData.bar
  .user({user_address: '0x6684977bbed67e101bb80fc07fccfba655c0a64f'})
  .then(user => console.log(user))

sushiData.exchange
  .observePairs()
  .subscribe({next: (pairs) => console.log(pairs), error: (err) => console.log(err)})

sushiData
  .timeseries({blocks: [11407623, 11507623, 11607623], target: sushiData.exchange.pair}, {pair_address: ""})
```
