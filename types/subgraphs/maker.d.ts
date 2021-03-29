export type Maker = {
    id?: string,
    sushiServed?: string,
    servers?: Server[],
    servings?: Serving[]
}


export type Server = {
    id?: string,
    maker?: Maker,
    sushiServed?: string,
    servings?: Serving[]
}


export type Serving = {
    id?: string,
    maker?: Maker,
    server?: Server,
    tx?: string,
    pair?: string,
    token0?: string,
    token1?: string,
    sushiServed?: string,
    block?: string,
    timestamp?: string
}