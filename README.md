# sushi-data

This is a collection of utilities to query SushiSwap data from Ethereum. This
data has been indexed by the Graph via the subgraph the SushiSwap team maintains.

## Supported Queries

The below all return a Promise that resolves with the requested results.

### Sushi

1. `sushi.priceUSD({¹})` Gets USD price of Sushi.
2. `sushi.priceETH({¹})` Gets ETH price of Sushi.

3. `blocks.latestBlock()` Gets the latest block.
4. `blocks.getBlock({¹})` Gets data for the specified block.

5. `charts.factory()` Gets data for the SushiSwap factory broken down daily + weekly.
6. `charts.tokenHourly({address, startTime?})` Gets data for specified token broken down hourly.
7. `charts.tokenDaily({address})` Gets data for specified token broken down daily.
8. `charts.pairHourly({address, startTime?})` Gets data for specified pair broken down hourly.
9. `charts.pairDaily({address})` Gets data for specified pair broken down daily.

10. `exchange.token({¹, address})` Gets data for specified token.
11. `exchange.token24h({¹, address})` Gets 24h data for specified token.
12. `exchange.tokenHourData({², address})` Gets hourly data for specified token.
13. `exchange.tokenDayData({², address})` Gets daily data for specified token.
14. `exchange.tokens({¹})` Gets data for all tokens.
15. `exchange.tokens24h({¹})` Gets 24h data for all tokens.
16. `exchange.pair({¹, address})` Gets data for specified pair.
17. `exchange.pair24h({¹, address})` Gets 24h data for specified pair.
18. `exchange.pairHourData({², address})` Gets hourly data for specified pair.
19. `exchange.pairDayData({{², address})` Gets daily data for specified pair.
20. `exchange.pairs({¹, [addresses]?})` Gets data for all / specified pairs.
21. `exchange.pairs24h({¹})` Gets 24h data for all pairs.
22. `exchange.ethPrice({¹})` Gets USD price of ETH.
23. `exchange.ethPriceHourly({²})` Gets USD price of ETH broken down hourly.
24. `exchange.factory({¹})` Gets all data for the SushiSwap factory.
25. `exchange.dayData({²})` Gets data for the SushiSwap factory broken down by day.
26. `exchange.twentyFourHourData({¹})` Gets 24h data for the SushiSwap factory.

27. `exchange_v1.userHistory({², address})` Gets LP history for specified user.
28. `exchange_v1.userPositions({¹, address})` Gets LP positions for specified user.

29. `masterchef.info({¹})` Gets MasterChef contract info.
30. `masterchef.pool({¹, poolId, address})` Gets pool info, either by pool id or by pool address.
31. `masterchef.pools({¹})` Gets pool info for all pools in MasterChef.
32. `masterchef.user({¹, address})` Gets user's data for all of the user's pools.
33. `masterchef.users({¹})` Gets all users and data for all of the users' pools.
34. `masterchef.apys({¹})` Gets pool info for all pools in MasterChef including APYs.
35. `masterchef.apys24h({¹})` Gets 24h pool info for all pools in MasterChef including APYs.
36. `masterchef.stakedValue({¹, address})` Get pricing info for MasterChef pool.

37. `bar.info({¹})` Gets SushiBar contract info.
38. `bar.user({¹, address})` Gets SushiBar data for specified user.

39. `maker.info({¹})` Gets SushiMaker contract info.
40. `maker.servings({²})` Gets past servings to the bar.
41. `maker.servers({¹})` Gets servers that have served Sushi to the bar.
42. `maker.pendingServings({¹})` Gets data on the servings ready to be served to the bar.

43. `timelock.queuedTxs({²})` Gets queued Timelock transactions.
44. `timelock.canceledTxs({²})` Gets canceled Timelock transactions.
45. `timelock.executedTxs({²})` Gets executed Timelock transactions.
46. `timelock.allTxs({²})` Gets all Timelock transactions.


### Bento

1. `kashi.pair({¹, address})` Gets data for specified pair.
2. `kashi.pairChange({¹, spacing, address})` Gets change data for specified pair with the specified spacing.
3. `kashi.pairChart({³, spacing, address})` Gets data for specified pair with the specified spacing.
4. `kashi.pairs({², [addresses]?})` Gets data for all / specified pairs.
5. `kashi.pairsChange({¹, spacing, [addresses]?})` Gets change data for all / specified pairs with the specified spacing.


### Argument legend

¹ `{block, timestamp}` Supports fetching at a specific block / UNIX timestamp.    
² `{block, timestamp, max}` Supports fetching at a specific block / UNIX timestamp with a maximum amount of results.      
³ `{minBlock, maxBlock, minTimestamp, maxTimestamp}` Supports fetching in a specific timeframe.    
⁴ `{minBlock, maxBlock, minTimestamp, maxTimestamp, max}` Supports fetching in a specific timeframe with a maximum amount of results.

## Supported Subscriptions
The below all return an Observable that when subscribed to with an object.

1. `sushi.observePriceETH()` Gets an observable of the current ETH price of Sushi.
2. `blocks.observeLatestBlock()` Gets an observable of the latest block.
3. `exchange.observeToken({address})` Gets an observable for specified token.
4. `exchange.observeTokens()` Gets an observable for the top 1000 tokens (by volume in USD).
5. `exchange.observePair({address})` Gets an observable for specified pair.
6. `exchange.observePairs()` Gets an observable for the top 1000 pairs (by liquidity in USD).
7. `exchange.observeEthPrice()` Gets an observable for the current USD price of ETH.
8. `exchange.observeFactory()` Gets an observable for the SushiSwap factory.
9. `bar.observeInfo()` Gets an observable for SushiBar contract info.

## Example

```javascript
const sushiData = require('@sushiswap/sushi-data'); // common js
// or
import { sushi } from '@sushiswap/sushi-data'; // es modules
import { bento } from '@sushiswap/sushi-data';

// query and log resolved results
sushi.masterchef
  .pools({block: 11223344})
  .then(pools => console.log(pools))

sushi.timelock
  .allTxs({minTimestamp: 1605239738, maxTimestamp: 1608239738})
  .then(txs => console.log(txs))

sushi.bar
  .user({address: '0x6684977bbed67e101bb80fc07fccfba655c0a64f'})
  .then(user => console.log(user))

sushi.exchange
  .observePairs()
  .subscribe({next: (pairs) => console.log(pairs), error: (err) => console.log(err)})

bento.kashi
  .pairs()
  .then(pairs => console.log(pairs))
```