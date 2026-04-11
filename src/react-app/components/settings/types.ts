import type { ComponentType, SVGProps } from "react";

export type SettingsIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface Provider {
    id: string;
    name: string;
    icon: SettingsIcon;
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
    icon: SettingsIcon;
}