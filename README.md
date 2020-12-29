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
10. `masterchef.info({¹})` Gets MasterChef contract info.
11. `masterchef.pool({¹, pool_id, pool_address})` Gets pool info, either by pool id or by pool address.
12. `masterchef.pools({¹})` Gets pool info for all pools in MasterChef.
13. `exchange.stakedValue({¹, token_address})` Get pricing info for MasterChef pool.
14. `bar.info({¹})` Gets SushiBar contract info.
15. `bar.user({¹, user_address})` Gets SushiBar data for specified user.
16. `maker.info({¹})` Gets SushiMaker contract info.
17. `maker.servings({²})` Gets past servings to the bar.
18. `maker.servers({¹})` Gets servers that have served Sushi to the bar.
19. `maker.pendingServings({¹})` Gets data on the servings ready to be served to the bar.
20. `timelock.queuedTxs({²})` Get queued Timelock transactions.
21. `timelock.canceledTxs({²})` Get canceled Timelock transactions.
22. `timelock.executedTxs({²})` Get executed Timelock transactions.
23. `timelock.allTxs({²})` Get all Timelock transactions.

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
const sushiData = require('sushi-data'); // common js
// or
import sushiData from 'sushi-data'; // es modules

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
