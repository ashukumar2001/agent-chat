import React, { memo, useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsSection, type SettingsSectionItem } from "./types";
import { SETTINGS_SECTIONS } from "./constants";
import { ApiKeysSettings } from "./api-keys-settings";
import { ProfilePage } from "../profile";
import { useModal, type SettingsSectionType } from "@/hooks/use-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

type SettingsMobileDrawerBodyProps = {
  mobileView: "nav" | "content";
  activeSection: SettingsSection;
  activeSectionData: SettingsSectionItem | undefined;
  onSectionChange: (section: SettingsSection) => void;
  onBack: () => void;
  children: React.ReactNode;
};

const SettingsMobileDrawerBody = memo(function SettingsMobileDrawerBody({
  mobileView,
  activeSection,
  activeSectionData,
  onSectionChange,
  onBack,
  children,
}: SettingsMobileDrawerBodyProps) {
  const headerTitle =
    mobileView === "nav"
      ? "Settings"
      : (activeSectionData?.label ?? "Settings");

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <DrawerHeader className="shrink-0 gap-0 border-b border-border px-0 pb-4 text-left">
        <div className="flex items-start gap-2">
          {mobileView === "content" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              aria-label="Back to settings sections"
              className="shrink-0"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              <span className="sr-only">Back</span>
            </Button>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <DrawerTitle className="text-lg font-semibold leading-tight">
              {headerTitle}
            </DrawerTitle>
            {mobileView === "nav" ? (
              <DrawerDescription className="text-balance">
                Manage your account and preferences
              </DrawerDescription>
            ) : null}
          </div>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label="Close settings"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </DrawerClose>
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        {mobileView === "nav" ? (
          <nav
            className="flex flex-col gap-1 py-3"
            aria-label="Settings sections"
          >
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors",
                    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon aria-hidden className="size-6 shrink-0" />
                  <span className="min-w-0 flex-1">{section.label}</span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    aria-hidden
                    className="size-5 shrink-0 text-muted-foreground"
                  />
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="flex flex-col gap-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

type SettingsDesktopLayoutProps = {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  children: React.ReactNode;
};

const SettingsDesktopLayout = memo(function SettingsDesktopLayout({
  activeSection,
  onSectionChange,
  children,
}: SettingsDesktopLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-muted/30 lg:w-60">
        <div className="border-b border-border px-4 py-4">
          <h2 className="font-heading text-base font-medium">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Account and integrations
          </p>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <nav
            className="flex flex-col gap-1 p-3"
            aria-label="Settings sections"
          >
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                    isActive
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <Icon aria-hidden className="size-6 shrink-0" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5 lg:p-6">{children}</div>
        </ScrollArea>
      </div>
    </div>
  );
});

/**
 * Settings Modal - uses useModal hook for state management
 * Opens via openModal("settings") or openModal("settings", "api-keys")
 * Uses Drawer on mobile, Dialog on desktop
 */
export function SettingsModal() {
  const { isSettingsOpen, closeModal, settingsSection, setSettingsSection } =
    useModal();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<"nav" | "content">("nav");

  const activeSection = settingsSection as SettingsSection;

  const handleSectionChange = useCallback(
    (section: SettingsSection) => {
      setSettingsSection(section as SettingsSectionType);
      if (isMobile) {
        setMobileView("content");
      }
    },
    [isMobile, setSettingsSection]
  );

  const handleBack = useCallback(() => {
    setMobileView("nav");
  }, []);

  const handleSettingsOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setMobileView("nav");
        closeModal();
      }
    },
    [closeModal]
  );

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

  if (isMobile) {
    return (
      <Drawer
        open={isSettingsOpen}
        onOpenChange={handleSettingsOpenChange}
        repositionInputs
      >
        <DrawerContent
          className={cn(
            "flex gap-0 overflow-hidden bg-transparent p-0 shadow-none",
            "h-[min(92dvh,calc(100dvh-1rem))] max-h-[92dvh]",
            "data-[vaul-drawer-direction=bottom]:mt-4 data-[vaul-drawer-direction=bottom]:max-h-[92dvh]"
          )}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-0">
            <SettingsMobileDrawerBody
              mobileView={mobileView}
              activeSection={activeSection}
              activeSectionData={activeSectionData}
              onSectionChange={handleSectionChange}
              onBack={handleBack}
            >
              {renderContent()}
            </SettingsMobileDrawerBody>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isSettingsOpen} onOpenChange={handleSettingsOpenChange}>
      <DialogContent className="flex h-[580px] w-[750px]! max-w-[750px]! flex-col gap-0 overflow-hidden p-0 lg:h-[600px] lg:w-[900px]! lg:max-w-[900px]!">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          User preferences and API keys
        </DialogDescription>
        <SettingsDesktopLayout
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        >
          {renderContent()}
        </SettingsDesktopLayout>
      </DialogContent>
    </Dialog>
  );
}
