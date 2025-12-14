import { Button } from "../ui/button";
import { Key } from "lucide-react";
import { SidebarTrigger } from "../ui/sidebar";
import { ThemeSwitcher } from "../kibo-ui/theme-switcher";
import { useModal } from "@/hooks/use-modal";

export const AppSidebarTrigger = () => {
  const { openModal } = useModal();

  return (
    <header className="flex h-12 shrink-0 border-b items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center justify-between gap-2 px-2 w-full">
        <SidebarTrigger />
        <div className="flex items-center gap-1 ml-auto">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => openModal("settings", "api-keys")}
            title="API Keys Settings"
            aria-label="Open API keys settings"
            tabIndex={0}
          >
            <Key className="size-4" />
            <span className="sr-only">API Keys Settings</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
