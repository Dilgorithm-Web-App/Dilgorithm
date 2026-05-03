/**
 * Singleton + State coordination for JWT refresh.
 * Concurrent 401 responses share a single in-flight refresh (flyweight promise).
 */
export class RefreshCoordinator {
    static #instance = null;

    /** @type {Promise<string>|null} */
    #flight = null;

    static getInstance() {
        if (!RefreshCoordinator.#instance) {
            RefreshCoordinator.#instance = new RefreshCoordinator();
        }
        return RefreshCoordinator.#instance;
    }

    /**
     * State: only one refresh runs at a time; others await the same promise.
     * @param {import('axios').AxiosInstance} rawClient axios instance without auth interceptors
     * @returns {Promise<string>} new access token
     */
    refreshWithRawClient(rawClient) {
        if (!this.#flight) {
            const refresh = localStorage.getItem('refresh_token');
            if (!refresh) {
                return Promise.reject(new Error('No refresh token'));
            }
            this.#flight = rawClient
                .post('accounts/token/refresh/', { refresh })
                .then(({ data }) => {
                    const access = data?.access;
                    if (!access) throw new Error('Refresh response missing access');
                    localStorage.setItem('access_token', access);
                    return access;
                })
                .finally(() => {
                    this.#flight = null;
                });
        }
        return this.#flight;
    }
}
