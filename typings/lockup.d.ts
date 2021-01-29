type User = {
    id: string,
    address: string,
    amount: number,
    rewardDebt: number,
    pool: {
        id: string,
        balance: number,
        accSushiPerShare: number
    },
    sushiAtLockup: number,
    sushiHarvestedSinceLockup: number,
    sushiLocked: number,
}

export function user({ block, timestamp, user_address }: {
    block?: number;
    timestamp?: number;
    user_address: string;
}): Promise<User[]>;