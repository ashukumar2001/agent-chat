import { useState } from "react";
import { Button } from "../ui/button";
import { Palette, Key } from "lucide-react";
import { SettingsDialog } from "@/components/settings";
import { SettingsSection } from "@/components/settings/types";
import { SidebarTrigger } from "../ui/sidebar";

export const AppSidebarTrigger = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDefaultSection, setSettingsDefaultSection] =
    useState<SettingsSection>("general");

  const handleOpenSettings = (section: SettingsSection = "general") => {
    setSettingsDefaultSection(section);
    setSettingsOpen(true);
  };

  return (
    <>
      <header className="flex h-12 shrink-0 border-b items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center justify-between gap-2 px-2 w-full">
          <SidebarTrigger />
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleOpenSettings("appearance")}
              title="Appearance Settings"
              aria-label="Open appearance settings"
              tabIndex={0}
            >
              <Palette className="size-4" />
              <span className="sr-only">Appearance Settings</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleOpenSettings("api-keys")}
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
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        defaultSection={settingsDefaultSection}
      />
    </>
  );
};
