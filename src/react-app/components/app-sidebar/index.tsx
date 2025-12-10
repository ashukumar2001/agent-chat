import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { useChats } from "@/hooks/use-chats";
import { authClient } from "@/lib/auth-client";
import { LogInIcon, MoreHorizontal, PencilIcon, TrashIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useChatSession } from "@/hooks/use-chat-session";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsDialog } from "@/components/settings";
import { useState } from "react";

export function AppSidebar() {
  const navigate = useNavigate();
  const { data: userSessionData } = authClient.useSession();
  const { chats, deleteChatMutation, isLoading } = useChats(
    userSessionData?.user?.id
  );
  const { chatId } = useChatSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <Sidebar
      collapsible="offcanvas"
      className="bg-linear-to-b from-sidebar to-sidebar/90 border-r-0"
    >
      <SidebarHeader className="flex-col flex p-4">
        <h1 className="text-2xl font-bold group-data-[state=collapsed]:opacity-0 h-8 flex items-center transition-all group-data-[state=expanded]:opacity-100 group-data-[state=expanded]:delay-150 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Eddy
        </h1>
        <Button
          className="w-full justify-start bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-sm transition-all duration-300"
          onClick={() => {
            navigate({ to: "/" });
          }}
        >
          New Chat
        </Button>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {(() => {
          const groupedChats = {
            Today: [] as typeof chats,
            Yesterday: [] as typeof chats,
            Older: [] as typeof chats,
          };

          chats?.forEach((chat) => {
            const chatDate = new Date(
              chat.updatedAt || chat.createdAt || Date.now()
            );
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (chatDate.toDateString() === today.toDateString()) {
              groupedChats.Today?.push(chat);
            } else if (chatDate.toDateString() === yesterday.toDateString()) {
              groupedChats.Yesterday?.push(chat);
            } else {
              groupedChats.Older?.push(chat);
            }
          });

          return (
            <>
              {Object.entries(groupedChats).map(([label, groupChats]) => {
                if (!groupChats || groupChats.length === 0) return null;
                return (
                  <SidebarGroup key={label}>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 px-2 mb-2">
                      {label}
                    </SidebarGroupLabel>
                    <SidebarMenu>
                      {groupChats.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            className={`flex items-center justify-between group/chat transition-all duration-200 rounded-lg px-3 py-2 ${
                              chatId === chat.id
                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm font-medium"
                                : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                            }`}
                            isActive={chatId === chat.id}
                            asChild
                          >
                            <Link
                              to="/chat/$chatId"
                              params={{ chatId: chat.id }}
                              className="flex-1 text-left"
                            >
                              <span className="truncate">{chat.name}</span>
                            </Link>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuAction
                                showOnHover
                                className="hover:bg-background/50"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More</span>
                              </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              className="w-fit"
                              align="start"
                            >
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <PencilIcon className="mr-2 h-4 w-4" />
                                <span>Rename</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  deleteChatMutation.mutate({
                                    chatId: chat.id,
                                  });
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>
                );
              })}
              {isLoading && (
                <div className="space-y-2 px-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton className="w-full h-8 animate-pulse rounded-md bg-sidebar-accent/50" />
                    </SidebarMenuItem>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-4 bg-linear-to-t from-sidebar-accent/10 to-transparent">
        {userSessionData?.user ? (
          <>
            <Button
              variant="ghost"
              className="justify-start px-2 h-14 w-full hover:bg-sidebar-accent/50 transition-colors"
              onClick={() => setSettingsOpen(true)}
            >
              <Avatar className="h-9 w-9 border border-sidebar-border">
                <AvatarImage src={userSessionData?.user?.image!} />
                <AvatarFallback>
                  {userSessionData?.user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start w-full ml-2">
                <p className="text-sm font-medium leading-none">
                  {userSessionData?.user?.name}
                </p>
                <p
                  title={userSessionData?.user?.email}
                  className="text-xs text-muted-foreground truncate max-w-[140px] mt-1"
                >
                  {userSessionData?.user?.email}
                </p>
              </div>
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            className="justify-center w-full bg-sidebar-accent/10 hover:bg-sidebar-accent/20"
            onClick={() => {
              authClient.signIn.social({ provider: "github" });
            }}
          >
            <LogInIcon className="mr-2 h-4 w-4" />
            <span>Login</span>
          </Button>
        )}
      </SidebarFooter>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  );
}
