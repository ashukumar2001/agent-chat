import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebarTrigger } from "@/components/app-sidebar/sidebar-trigger";
import GoogleAnalyticsTags from "@/components/google-analytics-tag";
import { ModalProvider } from "@/components/modals";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <NuqsAdapter>
      {import.meta.env.VITE_GOOGLE_SITE_VERIFICATION && (
        <meta
          name="google-site-verification"
          content={import.meta.env.VITE_GOOGLE_SITE_VERIFICATION}
        />
      )}
      <GoogleAnalyticsTags />
      <ThemeProvider defaultTheme="system" storageKey="eddy-ui-theme">
        <Toaster />
        <ModalProvider />
        <TooltipProvider>
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
        </TooltipProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
