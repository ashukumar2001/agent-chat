import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./types";
import { SETTINGS_SECTIONS } from "./constants";
import { AppearanceSettings } from "./appearance-settings";
import { ApiKeysSettings } from "./api-keys-settings";
import { ModelsSettings } from "./models-settings";
import { ConnectionsSettings } from "./connections-settings";
import { ProfilePage } from "../profile";
import { DialogTitle } from "@radix-ui/react-dialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: SettingsSection;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  defaultSection = "general",
}) => {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>(defaultSection);

  // Reset active section when dialog opens or defaultSection changes
  useEffect(() => {
    if (open) {
      setActiveSection(defaultSection);
    }
  }, [open, defaultSection]);

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return <ProfilePage />;
      case "appearance":
        return <AppearanceSettings />;
      case "api-keys":
        return <ApiKeysSettings />;
      case "models":
        return <ModelsSettings />;
      case "connections":
        return <ConnectionsSettings />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] h-[85vh] md:!w-[750px] md:!max-w-[750px] md:h-[580px] lg:!w-[900px] lg:!max-w-[900px] lg:h-[600px] p-0 gap-0">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">User Preferences</DialogDescription>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-44 md:w-48 lg:w-56 border-r bg-gray-50/50 dark:bg-gray-900/50">
            <nav className="p-2 md:p-3 lg:p-4 space-y-1">
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 text-xs md:text-sm font-medium rounded-md text-left transition-colors",
                      activeSection === section.id
                        ? "bg-gray-200 dark:bg-gray-800 text-foreground"
                        : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-3 md:p-4 lg:p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
