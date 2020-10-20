# sushi-data

This is a collection of utilities to query SushiSwap data from Ethereum. This
data has been indexed by the Graph via the subgraph the SushiSwap team maintains.

## Supported Queries

The below all return a Promise that resolves with the requested results.

1. `masterchef.Info()` Get MasterChef Contract Info.
2. `masterchef.Pools()` Get all pool info for pools in MasterChef.
3. `masterchef.TimeLocks()` Get all queued TimLock Txs.

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
```
