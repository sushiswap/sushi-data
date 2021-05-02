export type Arg1 = {
    block?: number;
    timestamp?: number;
};

export type Arg2 = {
    block?: number;
    timestamp?: number;
    max?: number;
};

export type Arg3 = {
    minTimestamp?: number;
    maxTimestamp?: number;
    minBlock?: number;
    maxBlock?: number;
}

export type Arg4 = {
    minTimestamp?: number;
    maxTimestamp?: number;
    minBlock?: number;
    maxBlock?: number;
    max?: number;
}

export type Arg5 = {
    minTimestamp?: number;
    maxTimestamp?: number;
    minBlock?: number;
    maxBlock?: number;
    min?: number;
    max?: number;
    spacing?: number;
}

export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

export type ChainId = {
    chainId?: 1 | 137
};