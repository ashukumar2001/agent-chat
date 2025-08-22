import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
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
      <div className="h-dvh overflow-hidden isolate">
        <Toaster />
        <SidebarProvider>
          <AppSidebar />
          <div className="bg-background @container/mainview relative flex h-full w-full">
            <main className="@container relative h-dvh w-0 flex-shrink flex-grow">
              <Outlet />
            </main>
          </div>
        </SidebarProvider>
      </div>
    </ThemeProvider>
  );
}
