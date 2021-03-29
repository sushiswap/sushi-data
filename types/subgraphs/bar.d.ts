export type Bar = {
    id?: string,
    decimals?: string,
    name?: string,
    sushi?: string,
    symbol?: string,
    totalSupply?: string,
    ratio?: string,
    xSushiMinted?: string,
    xSushiBurned?: string,
    sushiStaked?: string,
    sushiStakedUSD?: string,
    sushiHarvested?: string,
    sushiHarvestedUSD?: string,
    xSushiAge?: string,
    xSushiAgeDestroyed?: string,
    users?: User[],
    updatedAt?: string
}


export type User = {
    id?: string,
    bar?: Bar,
    xSushi?: string,
    xSushiIn?: string,
    xSushiOut?: string,
    xSushiMinted?: string,
    xSushiBurned?: string,
    xSushiOffset?: string,
    xSushiAge?: string,
    xSushiAgeDestroyed?: string,
    sushiStaked?: string,
    sushiStakedUSD?: string,
    sushiHarvested?: string,
    sushiHarvestedUSD?: string,
    sushiOut?: string,
    sushiIn?: string,
    usdOut?: string,
    usdIn?: string,
    updatedAt?: string,
    sushiOffset?: string,
    usdOffset?: string
}


export type Timeframe = 'Day';


export type History = {
    id?: string,
    date?: string,
    timeframe?: Timeframe,
    sushiStaked?: string,
    sushiStakedUSD?: string,
    sushiHarvested?: string,
    sushiHarvestedUSD?: string,
    xSushiAge?: string,
    xSushiAgeDestroyed?: string,
    xSushiMinted?: string,
    xSushiBurned?: string,
    xSushiSupply?: string,
    ratio?: string
}