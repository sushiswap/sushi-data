const {
    getWeek,
    subYears,
    startOfMinute,
    getUnixTime
} = require("date-fns");

const { TWENTY_FOUR_HOURS } = require('./../constants');
const { dayData, tokenDayData, pairDayData } = require('./exchange');

module.exports = {
    async factory() {
        let data = await dayData();
        let weeklyData = [];

        let startIndexWeekly = -1;
        let currentWeek = -1;

        data.forEach((entry, i) => {
            const week = getWeek(data[i].date)

            if (week !== currentWeek) {
                currentWeek = week;
                startIndexWeekly++;
            }

            weeklyData[startIndexWeekly] = weeklyData[startIndexWeekly] || {};
            weeklyData[startIndexWeekly].date = data[i].date;
            weeklyData[startIndexWeekly].weeklyVolumeUSD = (weeklyData[startIndexWeekly].weeklyVolumeUSD ?? 0) + data[i].volumeUSD;
          });

        return [data, weeklyData];
    },

    async token({token_address = undefined} = {}) {
        if(!token_address) { throw new Error("sushi-data: Token address undefined"); }
        
        let data = await tokenDayData({token_address});
        const endTime = getUnixTime(new Date());
        const startTime = getUnixTime(startOfMinute(subYears(new Date(), 1)));

        let dayIndexSet = new Set();
        let dayIndexArray = [];

        data.forEach((dayData, i) => {
        // add the day index to the set of days
            dayIndexSet.add((data[i].timestamp / TWENTY_FOUR_HOURS).toFixed(0));
            dayIndexArray.push(data[i]);
        });

        // fill in empty days
        let timestamp = data[0] && data[0].timestamp ? data[0].timestamp : startTime;
        let latestLiquidity = data[0] && data[0].liquidity;
        let latestLiquidityUSD = data[0] && data[0].liquidityUSD;
        let latestLiquidityETH = data[0] && data[0].liquidityETH;
        let latestPriceUSD = data[0] && data[0].priceUSD;
        let index = 1;

        while (timestamp < endTime - TWENTY_FOUR_HOURS) {
            const nextDay = timestamp + TWENTY_FOUR_HOURS;
            let currentDayIndex = (nextDay / TWENTY_FOUR_HOURS).toFixed(0);
            if (!dayIndexSet.has(currentDayIndex)) {
                data.push({
                    id: `${data[0].id.split("-")[0]}-${nextDay / TWENTY_FOUR_HOURS}`,
                    date: new Date(nextDay * 1000),
                    timestamp: nextDay,
                    volume: 0,
                    volumeETH: 0,
                    volumeUSD: 0,
                    liquidity: latestLiquidity,
                    liquidityETH: latestLiquidityETH,
                    liquidityUSD: latestLiquidityUSD,
                    priceUSD: latestPriceUSD,
                    txCount: 0
                });
            } else {
                latestLiquidity = dayIndexArray[index].liquidity;
                latestLiquidityETH = dayIndexArray[index].liquidityETH;
                latestLiquidityUSD = dayIndexArray[index].liquidityUSD;

                latestPriceUSD = dayIndexArray[index].priceUSD;
                index = index + 1;
            }
            timestamp = nextDay;
        }
        
        data = data.sort((a, b) => (parseInt(a.timestamp) > parseInt(b.timestamp) ? 1 : -1));

        return data;
    },

    async pair({pair_address = undefined} = {}) {
        if(!pair_address) { throw new Error("sushi-data: Pair address undefined"); }

        let data = await pairDayData({pair_address});
        const endTime = getUnixTime(new Date());
        const startTime = getUnixTime(startOfMinute(subYears(new Date(), 1)));
        
        let dayIndexSet = new Set();
        let dayIndexArray = [];

        data.forEach((dayData, i) => {
            // add the day index to the set of days
            dayIndexSet.add((data[i].timestamp / TWENTY_FOUR_HOURS).toFixed(0));
            dayIndexArray.push(data[i]);
        });
      
        let timestamp = data[0].timestamp ? data[0].timestamp : startTime;
        let latestLiquidityUSD = data[0].liquidityUSD;
        let index = 1;

        while (timestamp < endTime - TWENTY_FOUR_HOURS) {
            const nextDay = timestamp + TWENTY_FOUR_HOURS;
            let currentDayIndex = (nextDay / TWENTY_FOUR_HOURS).toFixed(0);
            if (!dayIndexSet.has(currentDayIndex)) {
                data.push({
                    id: `${data[0].id.split("-")[0]}-${nextDay / TWENTY_FOUR_HOURS}`,
                    date: new Date(nextDay * 1000),
                    timestamp: nextDay,
                    volumeUSD: 0,
                    volumeToken0: 0,
                    volumeToken1: 0,
                    liquidityUSD: latestLiquidityUSD,
                    txCount: 0
                });
            } else {
                latestLiquidityUSD = dayIndexArray[index].liquidityUSD;

                index = index + 1;
            }
            timestamp = nextDay;
        }

        data = data.sort((a, b) => (parseInt(a.timestamp) > parseInt(b.timestamp) ? 1 : -1));

        return data;
    }
}