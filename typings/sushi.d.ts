type Price = number;

export function price({ block, timestamp }?: {
    block?: number;
    timestamp?: number;
}): Promise<Price>;

export function observePrice(): {
    subscribe({ next, error, complete }: {
        next?(data: Price): any;
        error?(error: any): any;
        complete?: Function;
    }): any;
};
