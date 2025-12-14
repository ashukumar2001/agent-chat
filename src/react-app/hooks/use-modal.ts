import { parseAsStringLiteral, useQueryState } from "nuqs";

// Define all available modal types
export const MODAL_TYPES = ["login", "settings", "confirm"] as const;
export type ModalType = (typeof MODAL_TYPES)[number];

// Settings section types
export const SETTINGS_SECTION_TYPES = ["general", "api-keys"] as const;
export type SettingsSectionType = (typeof SETTINGS_SECTION_TYPES)[number];

/**
 * Global modal state hook using nuqs
 * Stores modal state in URL query params for shareable/bookmarkable modals
 */
export function useModal() {
  const [modal, setModal] = useQueryState(
    "modal",
    parseAsStringLiteral(MODAL_TYPES).withOptions({
      history: "push",
      shallow: true,
    })
  );

  const [settingsSection, setSettingsSection] = useQueryState(
    "section",
    parseAsStringLiteral(SETTINGS_SECTION_TYPES).withOptions({
      history: "push",
      shallow: true,
    })
  );

  const openModal = (type: ModalType, section?: SettingsSectionType) => {
    if (type === "settings" && section) {
      setSettingsSection(section);
    }
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setSettingsSection(null);
  };

  const isOpen = (type: ModalType) => modal === type;

  return {
    modal,
    openModal,
    closeModal,
    isOpen,
    isLoginOpen: modal === "login",
    isSettingsOpen: modal === "settings",
    isConfirmOpen: modal === "confirm",
    settingsSection: settingsSection ?? "general",
    setSettingsSection,
  };
}
