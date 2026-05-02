import api from '../../api';

export class ApiService {
    constructor(client) {
        this.client = client;
    }

    patchUserProfile(payload) {
        return this.client.patch('accounts/profile/', payload);
    }
}

export const defaultApiService = new ApiService(api);
