import { LoginModal } from "./login-modal";
import { SettingsModal } from "@/components/settings";

/**
 * Global modal container - renders all application modals
 * Add this component once in your root layout
 */
export function ModalProvider() {
  return (
    <>
      <LoginModal />
      <SettingsModal />
    </>
  );
}

export { LoginModal } from "./login-modal";
export { SettingsModal } from "@/components/settings";
