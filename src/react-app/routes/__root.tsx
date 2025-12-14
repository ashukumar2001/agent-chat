import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebarTrigger } from "@/components/app-sidebar/sidebar-trigger";
import { ModalProvider } from "@/components/modals";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <NuqsAdapter>
      <ThemeProvider defaultTheme="system" storageKey="eddy-ui-theme">
        <Toaster />
        <ModalProvider />
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppSidebarTrigger />
            <div className="bg-background @container/mainview flex h-full w-full">
              <main className="@container h-[calc(100dvh-48px)] grow shrink-0">
                <Outlet />
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
