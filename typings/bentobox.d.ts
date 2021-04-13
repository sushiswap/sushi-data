type Clone = {
  address: string;
  block: number;
  timestamp: number;
}

type Pair = {
  id?: string;
  name?: string;
  symbol?: string;
  asset?: string;
  collateral?: string;
  totalAssetBase?: number;
  totalAssetElastic?: number;
}

export function clones({ masterAddress, chainId }?: {
  masterAddress?: string;
  chainId?: number;
}): Promise<Clone>;

export function kashiStakedInfo(): Promise<Pair>;
