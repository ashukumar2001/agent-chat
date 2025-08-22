import React from "react";

export interface Provider {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    placeholder: string;
    getKeyUrl: string;
    defaultKey: string;
}

export type SettingsSection =
    | "general"
    | "appearance"
    | "api-keys"
    | "models"
    | "connections";

export interface SettingsSectionItem {
    id: SettingsSection;
    label: string;
    icon: React.ComponentType<any>;
}