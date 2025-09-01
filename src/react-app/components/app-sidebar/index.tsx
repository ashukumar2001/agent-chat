import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useChats } from "@/hooks/use-chats";
import { authClient } from "@/lib/auth-client";
import {
  EditIcon,
  LogInIcon,
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "@tanstack/react-router";
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
  const { state: sidebarState } = useSidebar();
  const { data: userSessionData } = authClient.useSession();
  const { chats, createNewChatMutation, deleteChatMutation, isLoading } =
    useChats(userSessionData?.user?.id);
  const { chatId } = useChatSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="justify-between p-2 flex-row items-center">
        <h1 className="text-xl font-semibold">
          {sidebarState === "collapsed" ? "AC" : "AgentChat"}
        </h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2">
          <SidebarMenuButton
            className="w-full justify-start flex-nowrap"
            onClick={() => {
              createNewChatMutation.mutate({
                name: "New Chat",
              });
            }}
          >
            <EditIcon />
            <span className="group-data-[state=collapsed]:hidden">
              New Chat
            </span>
          </SidebarMenuButton>
          <div className="group-data-[state=collapsed]:hidden ">
            {chats?.map((chat) => {
              return (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    className="flex items-center justify-between group/chat"
                    isActive={chatId === chat.id}
                  >
                    <Link
                      to={"/chat/" + chat.id}
                      className="flex-1 truncate text-left"
                      onClick={(e) => {
                        // Only navigate when clicking the text area, not the dropdown
                        e.stopPropagation();
                      }}
                    >
                      <span className="truncate">{chat.name}</span>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover/chat:opacity-100 transition-opacity duration-200"
                          onClick={(e) => {
                            // Prevent the parent link from being triggered
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-fit" align="start">
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <PencilIcon />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteChatMutation.mutate({
                              chatId: chat.id,
                            });
                          }}
                        >
                          <TrashIcon />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton className="w-full h-8 animate-pulse rounded-md" />
                  </SidebarMenuItem>
                ))}
              </div>
            )}
          </div>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t">
        {!!userSessionData?.user ? (
          <>
            <Button
              variant="ghost"
              className="justify-start px-3 h-[56px] w-full group-data-[state=collapsed]:justify-center"
              onClick={() => setSettingsOpen(true)}
            >
              <Avatar>
                <AvatarImage src={userSessionData?.user?.image!} />
                <AvatarFallback>
                  {userSessionData?.user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start group-data-[state=collapsed]:hidden w-full">
                <p className="text-sm font-medium">
                  {userSessionData?.user?.name}
                </p>
                <p
                  title={userSessionData?.user?.email}
                  className="text-xs text-muted-foreground truncate max-w-[180px]"
                >
                  {userSessionData?.user?.email}
                </p>
              </div>
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            className="justify-center"
            onClick={() => {
              authClient.signIn.social({ provider: "github" });
            }}
          >
            <LogInIcon />
            <span className="group-data-[state=collapsed]:hidden">Login</span>
          </Button>
        )}
      </SidebarFooter>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  );
}
