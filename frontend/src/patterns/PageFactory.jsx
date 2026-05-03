/**
 * Factory pattern: creates the correct settings sub-page component from a key.
 * Mirrors StepFactory in onboarding but for the dashboard settings area.
 * SOLID: SRP — only maps keys to components. OCP — add entries, don't modify logic.
 */
import React from 'react';

const SETTINGS_COMPONENTS = {};

/** Register a settings sub-page component. */
export const registerSettingsPage = (key, component) => {
    SETTINGS_COMPONENTS[key] = component;
};

/** Factory — returns the component for the given settings key. */
export const createSettingsPage = (key) => {
    return SETTINGS_COMPONENTS[key] || null;
};

/**
 * SettingsPageFactory component — renders the settings sub-page for the given key.
 * @param {{ pageKey: string, fallback: React.ReactNode }} props
 */
export const SettingsPageFactory = ({ pageKey, fallback = null }) => {
    const Component = SETTINGS_COMPONENTS[pageKey];
    if (!Component) return fallback;
    return <Component />;
};
