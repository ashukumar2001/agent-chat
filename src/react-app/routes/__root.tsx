import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebarTrigger } from "@/components/app-sidebar/sidebar-trigger";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
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
