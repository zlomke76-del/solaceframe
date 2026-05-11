export interface AssetLineage {
  assetId: string;
  createdAt: string;
  model: string;
  prompt: string;
  operator?: string;
  parentAssetId?: string;
}

export function createLineage(
  lineage: AssetLineage
): AssetLineage {
  return lineage;
}
