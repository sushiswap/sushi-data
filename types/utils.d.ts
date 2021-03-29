export type TimestampToBlock = (timestmap: number) => Promise<number>;

export type TimestampsToBlocks = (timestamps: number[]) => Promise<number[]>;

export type BlockToTimestamp = (block: number) => Promise<number>;

export type GetAverageBlockTime = ({ block, timestamp }?: {
    block?: number;
    timestamp?: number;
}) => Promise<number>;