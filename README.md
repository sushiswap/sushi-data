# sushi-data

This is a collection of utilities to query SushiSwap data from Ethereum. This
data has been indexed by the Graph via the subgraph the SushiSwap team maintains.

## Supported Queries

The below all return a Promise that resolves with the requested results.

1. `weth.price()` Gets current USDC price of WETH.
2. `sushi.info()` Get sushi ETH price and total supply.
3. `masterchef.info()` Get MasterChef Contract Info.
4. `masterchef.pools()` Get all pool info for pools in MasterChef.
5. `masterchef.pool()` Get pool info for a single pool in MasterChef.
6. `masterchef.stakedValue()` Get pricing info for MasterChef pools
7. `timelock.txs()` Get all queued/executed/canceled Timelock txs.
8. `bar.info()` Get all SushiBar contract info.
9. `bar.user({ user: "address"})` Get sushi bar data for specific address.
10. `maker.info()` Get SushiMaker contract info
11. `maker.servings()` Get all past servings to the bar.
12. `maker.servers()` Get all addresses that have served sushi to the bar.
13. `maker.pendingServings()` Get all data on all of the servings that are ready to be served to the bar.

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
