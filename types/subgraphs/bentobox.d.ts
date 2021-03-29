export type BentoBox = {
    id?: string,
    users?: User[],
    tokens?: Token[],
    kashiPairs?: KashiPair[],
    transactions?: BentoBoxAction[],
    flashloans?: FlashLoan[],
    masterContracts?: MasterContract[],
    totalTokens?: string,
    totalKashiPairs?: string,
    totalUsers?: string,
    block?: string,
    timestamp?: string
}


export type BentoBoxActionType = 'deposit' | 'transfer' | 'withdraw';


export type BentoBoxAction = {
    id?: string,
    bentoBox?: BentoBox,
    type?: BentoBoxActionType,
    from?: User,
    to?: User,
    token?: Token,
    amount?: string,
    share?: string,
    block?: string,
    timestamp?: string
}


export type FlashLoan = {
    id?: string,
    bentoBox?: BentoBox,
    borrower?: string,
    receiver?: string,
    token?: Token,
    amount?: string,
    feeAmount?: string,
    block?: string,
    timestamp?: string
}


export type MasterContract = {
    id?: string,
    bentoBox?: BentoBox,
    masterContractApprovals?: MasterContractApproval[]
}


export type MasterContractApproval = {
    id?: string,
    masterContract?: MasterContract,
    user?: User,
    approved?: string
}


export type Protocol = {
    id?: string
}


export type Token = {
    id?: string,
    bentoBox?: BentoBox,
    name?: string,
    symbol?: string,
    decimals?: string,
    totalSupplyElastic?: string,
    totalSupplyBase?: string,
    block?: string,
    timestamp?: string
}


export type User = {
    id?: string,
    bentoBox?: BentoBox,
    masterContractApprovals?: MasterContractApproval[],
    tokens?: UserToken[],
    kashiPairs?: UserKashiPair[],
    withdrawals?: BentoBoxAction[],
    deposits?: BentoBoxAction[],
    block?: string,
    timestamp?: string
}


export type UserToken = {
    id?: string,
    user?: User,
    token?: Token,
    share?: string,
    block?: string,
    timestamp?: string
}


export type KashiPairType = 'medium';


export type KashiPair = {
    id?: string,
    bentoBox?: BentoBox,
    type?: KashiPairType,
    masterContract?: MasterContract,
    owner?: string,
    feeTo?: string,
    name?: string,
    symbol?: string,
    oracle?: string,
    asset?: Token,
    collateral?: Token,
    exchangeRate?: string,
    totalAssetElastic?: string,
    totalAssetBase?: string,
    totalCollateralShare?: string,
    totalBorrowElastic?: string,
    totalBorrowBase?: string,
    interestPerSecond?: string,
    utilization?: string,
    feesEarnedFraction?: string,
    totalFeesEarnedFraction?: string,
    lastAccrued?: string,
    transactions?: KashiPairAction[],
    users?: UserKashiPair[],
    block?: string,
    timestamp?: string
}


export type KashiPairActionType = 'addAsset' | 'removeAsset' | 'addCollateral' | 'removeCollateral' | 'borrow' | 'repay';


export type KashiPairAction = {
    id?: string,
    type?: KashiPairActionType,
    pair?: KashiPair,
    root?: UserKashiPair,
    token?: Token,
    amount?: string,
    share?: string,
    feeAmount?: string,
    fraction?: string,
    part?: string,
    poolPercentage?: string,
    block?: string,
    timestamp?: string
}


export type UserKashiPair = {
    id?: string,
    user?: User,
    pair?: KashiPair,
    assetFraction?: string,
    collateralShare?: string,
    borrowPart?: string,
    isSolvent?: string,
    transactions?: KashiPairAction[],
    block?: string,
    timestamp?: string
}


export type KashiPairHourData = {
    id?: string,
    hourStartUnix?: string,
    pair?: KashiPair,
    totalAssetElastic?: string,
    totalAssetBase?: string,
    totalCollateralShare?: string,
    totalBorrowElastic?: string,
    totalBorrowBase?: string,
    avgExchangeRate?: string,
    avgUtilization?: string,
    avgInterestPerSecond?: string,
    avgSupplyInterestPerSecond?: string,
    avgBorrowInterestPerSecond?: string
}


export type KashiPairDayData = {
    id?: string,
    date?: string,
    pair?: KashiPair,
    totalAssetElastic?: string,
    totalAssetBase?: string,
    totalCollateralShare?: string,
    totalBorrowElastic?: string,
    totalBorrowBase?: string,
    avgExchangeRate?: string,
    avgUtilization?: string,
    avgInterestPerSecond?: string,
    avgSupplyInterestPerSecond?: string,
    avgBorrowInterestPerSecond?: string
}