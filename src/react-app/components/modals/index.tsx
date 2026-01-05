import { LoginModal } from "./login-modal";
import { SettingsModal } from "@/components/settings";
import { PricingModal } from "@/components/pricing";

/**
 * Global modal container - renders all application modals
 * Add this component once in your root layout
 */
export function ModalProvider() {
  return (
    <>
      <LoginModal />
      <SettingsModal />
      <PricingModal />
    </>
  );
}

export { LoginModal } from "./login-modal";
export { SettingsModal } from "@/components/settings";
export { PricingModal } from "@/components/pricing";
