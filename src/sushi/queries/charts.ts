import {
    getWeek,
    subYears,
    startOfMinute,
    getUnixTime
} from "date-fns";

import { TWENTY_FOUR_HOURS } from '../../constants';
import { tokenHourData, tokenDayData, pairHourData, pairDayData, ethPriceHourly } from './exchange';

import { Awaited } from "../../../types";



export async function tokenHourly({address, startTime = undefined}: ({
    address: string;
    startTime?: number;
})) {
    if(!address) { throw new Error("sushi-data: Token address undefined"); }

    let [tokenData, ethPrices] = await Promise.all([
            tokenHourData({minTimestamp: startTime, address}),
            ethPriceHourly({minTimestamp: startTime})
    ]);

    const tokenDataWithPrice = tokenData.map(tokenEntry => {
        const ethPriceUSD = ethPrices.find(ethEntry => ethEntry.timestamp === tokenEntry.timestamp)!.priceUSD;
        return ({
            ...tokenEntry,
            priceUSD: tokenEntry.derivedETH * ethPriceUSD,
        })
    });

    return tokenDataWithPrice.map((tokenEntry, i) => ({
        ...tokenEntry,
        volume: tokenDataWithPrice[i-1] ? tokenEntry.volume - tokenDataWithPrice[i-1].volume : undefined,
        volumeUSD: tokenDataWithPrice[i-1] ? tokenEntry.volumeUSD - tokenDataWithPrice[i-1].volumeUSD : undefined,
        untrackedVolumeUSD: tokenDataWithPrice[i-1] ? tokenEntry.untrackedVolumeUSD - tokenDataWithPrice[i-1].untrackedVolumeUSD : undefined,

        txCount: tokenDataWithPrice[i-1] ? tokenEntry.txCount - tokenDataWithPrice[i-1].txCount : undefined,

        open: tokenEntry.priceUSD,
        close: tokenDataWithPrice[i+1] ? tokenDataWithPrice[i+1].priceUSD : undefined,
    }));
}



export async function tokenDaily({address}: {address: string}) {
    if(!address) { throw new Error("sushi-data: Token address undefined"); }
    
    let data = await tokenDayData({address});
    const endTime = getUnixTime(new Date());
    const startTime = getUnixTime(startOfMinute(subYears(new Date(), 1)));

    let dayIndexSet = new Set();
    let dayIndexArray: Awaited<ReturnType<typeof tokenDayData>> = [];

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
    
    data = data.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));

    return data;
}



export async function pairHourly({address, startTime = undefined}: ({
    address: string;
    startTime?: number;
})) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }

    let pairData = await pairHourData({minTimestamp: startTime, address});

    return pairData.map((pairEntry: any, i: any) => ({
        ...pairEntry,
        volumeToken0: pairData[i-1] ? pairEntry.volumeToken0 - pairData[i-1].volumeToken0 : undefined,
        volumeToken1: pairData[i-1] ? pairEntry.volumeToken1 - pairData[i-1].volumeToken1 : undefined,

        rate0: {
            open: pairEntry.token0Price,
            close: pairData[i+1] ? pairData[i+1].token0Price : undefined,
        },

        rate1: {
            open: pairEntry.token1Price,
            close: pairData[i+1] ? pairData[i+1].token1Price : undefined,
        },

        txCount: pairData[i-1] ? pairEntry.txCount - pairData[i-1].txCount : undefined,
    }));
}



export async function pairDaily({address}: {address: string}) {
    if(!address) { throw new Error("sushi-data: Pair address undefined"); }

    let data = await pairDayData({address});
    const endTime = getUnixTime(new Date());
    const startTime = getUnixTime(startOfMinute(subYears(new Date(), 1)));
    
    let dayIndexSet = new Set();
    let dayIndexArray: Awaited<ReturnType<typeof pairDayData>> = [];

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

    data = data.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));

    return data;
}

export default {
    tokenHourly,
    tokenDaily,
    pairHourly,
    pairDaily
}