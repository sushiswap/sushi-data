export function timestampToBlock(timestmap: number): Promise<Number>;

export function timestampsToBlocks(timestamps: number[]): Promise<Number[]>;

export function blockToTimestamp(block: number): Promise<Number>;

export function getAverageBlockTime({ block, timestamp }?: {
    block?: number;
    timestamp?: number;
}): Promise<Number>;