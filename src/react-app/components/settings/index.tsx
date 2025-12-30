import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./types";
import { SETTINGS_SECTIONS } from "./constants";
import { ApiKeysSettings } from "./api-keys-settings";
import { ProfilePage } from "../profile";
import { useModal, type SettingsSectionType } from "@/hooks/use-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft } from "lucide-react";

/**
 * Settings Modal - uses useModal hook for state management
 * Opens via openModal("settings") or openModal("settings", "api-keys")
 * Uses Sheet (bottom drawer) on mobile, Dialog on desktop
 */
export function SettingsModal() {
  const { isSettingsOpen, closeModal, settingsSection, setSettingsSection } =
    useModal();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = React.useState<"nav" | "content">("nav");

  const activeSection = settingsSection as SettingsSection;

  const handleSectionChange = (section: SettingsSection) => {
    setSettingsSection(section as SettingsSectionType);
    if (isMobile) {
      setMobileView("content");
    }
  };

  const handleBack = () => {
    setMobileView("nav");
  };

  // Reset mobile view when modal closes
  React.useEffect(() => {
    if (!isSettingsOpen) {
      setMobileView("nav");
    }
  }, [isSettingsOpen]);

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return <ProfilePage />;
      case "api-keys":
        return <ApiKeysSettings />;
      default:
        return <ProfilePage />;
    }
  };

  const activeSectionData = SETTINGS_SECTIONS.find(
    (s) => s.id === activeSection
  );

  // Mobile Navigation View
  const MobileNavigation = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your preferences</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-left transition-colors",
                activeSection === section.id
                  ? "bg-gray-200 dark:bg-gray-800 text-foreground"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {section.label}
              <ChevronLeft className="h-4 w-4 ml-auto rotate-180" />
            </button>
          );
        })}
      </nav>
    </div>
  );

  // Mobile Content View
  const MobileContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <button
          onClick={handleBack}
          className="p-1 -ml-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">{activeSectionData?.label}</h2>
      </div>
      <div className="flex-1 p-4 pb-8 overflow-y-auto">{renderContent()}</div>
    </div>
  );

  // Desktop Layout
  const DesktopLayout = () => (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Left Sidebar */}
      <div className="w-48 lg:w-56 border-r bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
        <nav className="p-3 lg:p-4 space-y-1">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-left transition-colors",
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
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">{renderContent()}</div>
    </div>
  );

  // Mobile: Use Drawer (bottom drawer)
  if (isMobile) {
    return (
      <Drawer
        open={isSettingsOpen}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DrawerContent className="h-[85vh] p-0">
          <DrawerTitle className="sr-only">Settings</DrawerTitle>
          <DrawerDescription className="sr-only">
            User Preferences
          </DrawerDescription>
          {mobileView === "nav" ? <MobileNavigation /> : <MobileContent />}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog
      open={isSettingsOpen}
      onOpenChange={(open) => !open && closeModal()}
    >
      <DialogContent className="w-[750px]! max-w-[750px]! lg:w-[900px]! lg:max-w-[900px]! h-[580px] lg:h-[600px] p-0 gap-0 flex flex-col">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          User Preferences
        </DialogDescription>
        <DesktopLayout />
      </DialogContent>
    </Dialog>
  );
}
