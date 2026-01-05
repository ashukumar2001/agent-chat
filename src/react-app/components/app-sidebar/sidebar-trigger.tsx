import { Button } from "../ui/button";
import { Settings } from "lucide-react";
import { SidebarTrigger } from "../ui/sidebar";
import { ThemeSwitcher } from "../kibo-ui/theme-switcher";
import { useModal } from "@/hooks/use-modal";
import { UpgradeButton } from "../pricing";
import { useSubscription } from "@/hooks/use-subscription";

export const AppSidebarTrigger = () => {
  const { openModal } = useModal();
  const { hasSubscription, error, subscription } = useSubscription();

  console.log(hasSubscription, error, subscription);
  return (
    <header className="flex h-12 shrink-0 border-b items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center justify-between gap-2 px-2 w-full">
        <SidebarTrigger />
        <div className="flex items-center gap-2 ml-auto">
          <UpgradeButton />
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => openModal("settings")}
            title="Settings"
            aria-label="Open settings"
            tabIndex={0}
          >
            <Settings className="size-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
