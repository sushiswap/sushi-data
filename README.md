# sushi-data

This is a collection of utilities to query SushiSwap data from Ethereum. This
data has been indexed by the Graph via the subgraph the SushiSwap team maintains.

## Supported Queries

The below all return a Promise that resolves with the requested results.


1. `sushi.price({¹})` Gets ETH price of Sushi.
2. `blocks.latestBlock()` Gets the latest block.
3. `exchange.token({¹, token_address})` Gets data for specified token.
4. `exchange.tokens({¹})` Gets data for all tokens.
5. `exchange.pair({¹, pair_address})` Gets data for specified pair.
6. `exchange.pairs({¹})` Gets data for all pairs.
7. `exchange.ethPrice({¹})` Gets USD price of ETH.
8. `exchange.factory({¹})` Gets all data for the SushiSwap factory.
9. `exchange.dayData({²})` Gets data for the SushiSwap factory broken down by day.
10. `exchange_v1.userHistory({², user_address})` Gets LP history for specified user.
11. `exchange_v1.userPositions({¹, user_address})` Gets LP positions for specified user.
12. `masterchef.info({¹})` Gets MasterChef contract info.
13. `masterchef.pool({¹, pool_id, pool_address})` Gets pool info, either by pool id or by pool address.
14. `masterchef.pools({¹})` Gets pool info for all pools in MasterChef.
15. `masterchef.user({¹, user_address})` Gets all pools user has stake in.
16. `exchange.stakedValue({¹, token_address})` Get pricing info for MasterChef pool.
17. `bar.info({¹})` Gets SushiBar contract info.
18. `bar.user({¹, user_address})` Gets SushiBar data for specified user.
19. `maker.info({¹})` Gets SushiMaker contract info.
20. `maker.servings({²})` Gets past servings to the bar.
21. `maker.servers({¹})` Gets servers that have served Sushi to the bar.
22. `maker.pendingServings({¹})` Gets data on the servings ready to be served to the bar.
23. `timelock.queuedTxs({²})` Gets queued Timelock transactions.
24. `timelock.canceledTxs({²})` Gets canceled Timelock transactions.
25. `timelock.executedTxs({²})` Gets executed Timelock transactions.
26. `timelock.allTxs({²})` Gets all Timelock transactions.
27. `lockup.user({¹, user_address})` Gets lockup data for specified user.

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
```
