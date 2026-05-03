import { adaptFiltersPayload, adaptInterestsPayload } from '../adapters/catalogResponseAdapter';

/**
 * Composite pattern: treat filters + interests as one catalog load operation.
 * Open for extension by adding more leaf fetches without changing callers (OCP).
 */
export class MergedCatalogComposite {
    /** @param {import('axios').AxiosInstance} apiClient */
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    async load() {
        const [filtersRes, interestsRes] = await Promise.all([
            this.apiClient.get('accounts/filters/'),
            this.apiClient.get('accounts/interests/available/'),
        ]);
        return {
            filters: adaptFiltersPayload(filtersRes.data),
            interests: adaptInterestsPayload(interestsRes.data),
        };
    }
}
