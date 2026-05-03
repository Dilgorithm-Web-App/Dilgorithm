import { useEffect, useState } from 'react';
import api from '../api';
import { catalogSingleton } from '../catalog/CatalogSingleton';

/**
 * React-facing hook: loads catalog once via Singleton and subscribes to Observer updates.
 */
export function useCatalogMetadata() {
    const [state, setState] = useState(() => ({
        loading: !catalogSingleton.getSnapshot(),
        error: null,
        data: catalogSingleton.getSnapshot(),
    }));

    useEffect(() => {
        const snap = catalogSingleton.getSnapshot();
        if (snap) {
            setState({ loading: false, error: null, data: snap });
            return undefined;
        }

        let cancelled = false;

        const unsub = catalogSingleton.subscribe((data) => {
            if (!cancelled) setState({ loading: false, error: null, data });
        });

        catalogSingleton
            .ensureLoaded(api)
            .then((data) => {
                if (!cancelled) setState({ loading: false, error: null, data });
            })
            .catch((error) => {
                if (!cancelled) setState({ loading: false, error, data: null });
            });

        return () => {
            cancelled = true;
            unsub();
        };
    }, []);

    return state;
}
