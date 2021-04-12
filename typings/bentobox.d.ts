type Clone = {
  address: string;
  block: number;
  timestamp: number;
}

export function clones({ masterAddress, chainId }?: {
  masterAddress?: string;
  chainId?: number;
}): Promise<Clone>;
