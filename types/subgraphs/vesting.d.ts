export type User = {
    id?: string,
    claims?: Claim[],
    totalClaimed?: string
}


export type Claim = {
    id?: string,
    user?: User,
    week?: string,
    amount?: string
}


export type Week = {
    id?: string,
    numberOfClaims?: string,
    totalClaimed?: string,
    merkleRoot?: string
}