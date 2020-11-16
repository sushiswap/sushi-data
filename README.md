# sushi-data

This is a collection of utilities to query SushiSwap data from Ethereum. This
data has been indexed by the Graph via the subgraph the SushiSwap team maintains.

## Supported Queries

The below all return a Promise that resolves with the requested results.

1. `masterchef.Info()` Get MasterChef Contract Info.
2. `masterchef.Pools()` Get all pool info for pools in MasterChef.
3. `masterchef.TimeLocks()` Get all queued TimLock Txs. ** Will be removed soon **
4. `timelock.Txs()` Get all queued/executed/canceled Timelock txs.
5. `bar.Info()` Get all SushiBar contract info.
6. `bar.User({ user: "address"})` Get sushi bar data for specific address.
7. `maker.Info()` Get SushiMaker contract info
8. `maker.Servings()` Get all past servings to the bar.
9. `maker.Servers()` Get all addresses that have served sushi to the bar.
10. `maker.PendingServings()` Get all data on all of the servings that are ready to be served to the bar.

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
