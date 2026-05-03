import { MergedCatalogComposite } from '../composite/MergedCatalogComposite';

/** Factory: construct catalog loader with injected HTTP client (DIP). */
export function createCatalogLoader(apiClient) {
    return new MergedCatalogComposite(apiClient);
}
