import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebarTrigger } from "@/components/app-sidebar/sidebar-trigger";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="eddy-ui-theme">
      <Toaster />
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
  );
}
