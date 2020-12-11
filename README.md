# sushi-data

This is a collection of utilities to query SushiSwap data from Ethereum. This
data has been indexed by the Graph via the subgraph the SushiSwap team maintains.

## Supported Queries

The below all return a Promise that resolves with the requested results.

1. `weth.price()` Gets current USDC price of WETH.
2. `sushi.info(block)` Get sushi ETH price and total supply.  
    Optional: can use block number to fetch data at a specific block.
3. `masterchef.info()` Get MasterChef Contract Info.
4. `masterchef.pools(identifier)` Get all pool info for pools in MasterChef.  
    Optional: can use identifier as argument - either pool id or pair address.
5. `masterchef.stakedValue()` Get pricing info for MasterChef pools.
6. `timelock.queuedTxs()` Get all queued Timelock txs.
7. `timelock.canceledTxs()` Get all canceled Timelock txs.
8. `timelock.executedTxs()` Get all executed Timelock txs.
9. `timelock.txs()` Get all queued/executed/canceled Timelock txs.
10. `bar.info()` Get all SushiBar contract info.
11. `bar.user({ user: "address"})` Get sushi bar data for specific address.
12. `maker.info()` Get SushiMaker contract info
13. `maker.servings()` Get all past servings to the bar.
14. `maker.servers()` Get all addresses that have served sushi to the bar.
15. `maker.pendingServings()` Get all data on all of the servings that are ready to be served to the bar.
16. `exchange.tokens(token_address)` Get data for all tokens under the SushiSwap factory.  
    Optional: can use token address to fetch data for specific token.
17. `exchange.pairs(pair_address)` Get data for all pairs under the SushiSwap factory.  
    Optional: can use pair address to fetch data for specific pair.
18. `exchange.ethPrice()` Get current ETH price in USD.
19. `exchange.factory()` Get all data for the SushiSwap factory.
20. `exchange.dayData(days)` Get all data for the SushiSwap factory broken down by day.  
    Optional: can use number of days to fetch data for a specific number of days (1 for today's data only, 2 for today and yesterday).

## Example

```javascript
const sushiData = require('sushi-data'); // common js
// or
import sushiData from 'sushi-data'; // es modules

// query and log resolved results
sushiData.masterchef
  .Pools()
  .then(pools => console.log(pools))

sushiData.masterchef
  .TimeLocks()
  .then(timelocks => console.log(timelocks))

sushiData.bar
  .User({user: '0x6684977bbed67e101bb80fc07fccfba655c0a64f'})
  .then(user => console.log(user))
```
