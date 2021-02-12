# sushi-data

This is a collection of utilities to query SushiSwap data from Ethereum. This
data has been indexed by the Graph via the subgraph the SushiSwap team maintains.

## Supported Queries

The below all return a Promise that resolves with the requested results.

1. `sushi.priceETH({¹})` Gets ETH price of Sushi.
2. `sushi.priceUSD({¹})` Gets USD price of Sushi.
3. `blocks.latestBlock()` Gets the latest block.
4. `blocks.getBlock({¹})` Gets data for the specified block.
5. `charts.factory()` Gets data for the SushiSwap factory broken down daily + weekly.
6. `charts.token({token_address})` Gets data for specified token broken down daily.
7. `charts.pair({pair_address})` Gets data for specified pair broken down daily.
8. `exchange.token({¹, token_address})` Gets data for specified token.
9. `exchange.token24h({¹, token_address})` Gets 24h data for specified token.
10. `exchange.tokenDayData({², token_address})` Gets daily data for specified token.
11. `exchange.tokens({¹})` Gets data for all tokens.
12. `exchange.tokens24h({¹})` Gets 24h data for all tokens.
13. `exchange.pair({¹, pair_address})` Gets data for specified pair.
14. `exchange.pair24h({¹, pair_address})` Gets 24h data for specified pair.
15. `exchange.pairDayData({{², pair_address})` Gets daily data for specified pair.
16. `exchange.pairs({¹, [pair_addresses]})` Gets data for all / specified pairs.
17. `exchange.pairs24h({¹})` Gets 24h data for all pairs.
18. `exchange.ethPrice({¹})` Gets USD price of ETH.
19. `exchange.factory({¹})` Gets all data for the SushiSwap factory.
20. `exchange.dayData({²})` Gets data for the SushiSwap factory broken down by day.
21. `exchange.twentyFourHourData({¹})` Gets 24h data for the SushiSwap factory.
22. `exchange_v1.userHistory({², user_address})` Gets LP history for specified user.
23. `exchange_v1.userPositions({¹, user_address})` Gets LP positions for specified user.
24. `masterchef.info({¹})` Gets MasterChef contract info.
25. `masterchef.pool({¹, pool_id, pool_address})` Gets pool info, either by pool id or by pool address.
26. `masterchef.pools({¹})` Gets pool info for all pools in MasterChef.
27. `masterchef.user({¹, user_address})` Gets all pools user has stake in.
28. `masterchef.apys({¹})` Gets pool info for all pools in MasterChef including APYs.
29. `masterchef.apys24h({¹})` Gets 24h pool info for all pools in MasterChef including APYs.
30. `exchange.stakedValue({¹, token_address})` Get pricing info for MasterChef pool.
31. `bar.info({¹})` Gets SushiBar contract info.
32. `bar.user({¹, user_address})` Gets SushiBar data for specified user.
33. `maker.info({¹})` Gets SushiMaker contract info.
34. `maker.servings({²})` Gets past servings to the bar.
35. `maker.servers({¹})` Gets servers that have served Sushi to the bar.
36. `maker.pendingServings({¹})` Gets data on the servings ready to be served to the bar.
37. `timelock.queuedTxs({²})` Gets queued Timelock transactions.
38. `timelock.canceledTxs({²})` Gets canceled Timelock transactions.
39. `timelock.executedTxs({²})` Gets executed Timelock transactions.
40. `timelock.allTxs({²})` Gets all Timelock transactions.
41. `lockup.user({¹, user_address})` Gets lockup data for specified user.

¹ `{block, timestamp}` Supports fetching at a specific block / UNIX timestamp.    
² `{minBlock, maxBlock, minTimestamp, maxTimestamp}` Supports fetching in a specific timeframe.

## Supported Subscriptions
The below all return an Observable that when subscribed to with an object.

1. `sushi.observePriceETH()` Gets an observable of the current ETH price of Sushi.
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
  .timeseries({blocks: [11407623, 11507623, 11607623], target: sushiData.exchange.pair}, {pair_address: "0x795065dCc9f64b5614C407a6EFDC400DA6221FB0"})
```
