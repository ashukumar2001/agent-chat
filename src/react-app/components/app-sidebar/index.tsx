import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useChats } from "@/hooks/use-chats";
import { authClient } from "@/lib/auth-client";
import {
  EditIcon,
  LogInIcon,
  LogOutIcon,
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
  Settings,
  User,
  Key,
} from "lucide-react";
import { Button } from "../ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useChatSession } from "@/hooks/use-chat-session";
import { Separator } from "../ui/separator";
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
  const { data: userSessionData } = authClient.useSession();
  const { chats, createNewChatMutation, deleteChatMutation } = useChats(
    userSessionData?.user?.id
  );
  const navigate = useNavigate();
  const { chatId } = useChatSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <Sidebar>
      <SidebarHeader className="justify-between p-2 flex-row items-center">
        <h1 className="text-xl font-semibold">Agent Chat</h1>
        <SidebarTrigger size="lg" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2">
          <SidebarMenuButton
            className="w-full justify-start"
            onClick={() => {
              createNewChatMutation.mutate(
                {
                  name: "New Chat",
                },
                {
                  onSuccess: (data) => {
                    if (data.id) {
                      navigate({
                        to: "/chat/$chatId",
                        params: {
                          chatId: data.id,
                        },
                      });
                    }
                  },
                }
              );
            }}
          >
            <EditIcon />
            New Chat
          </SidebarMenuButton>
          {chats?.map((chat) => {
            return (
              <SidebarMenuItem key={chat.id}>
                <Link to={"/chat/" + chat.id}>
                  <SidebarMenuButton
                    className="flex items-center justify-between group/chat"
                    isActive={chatId === chat.id}
                  >
                    <span className="truncate">{chat.name}</span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t">
        {!!userSessionData?.user ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="justify-start px-3 h-[56px] w-full"
                >
                  <Avatar>
                    <AvatarImage src={userSessionData?.user?.image!} />
                    <AvatarFallback>
                      {userSessionData?.user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
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
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="center">
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>
                  <User />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Key />
                  Keys
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Separator />
            <Button
              variant="ghost"
              className="text-red-400 hover:text-red-400 hover:bg-red-400/10"
              onClick={() => {
                authClient.signOut();
              }}
            >
              <LogOutIcon />
              &nbsp;Logout
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => {
              authClient.signIn.social({ provider: "github" });
            }}
          >
            <LogInIcon />
            &nbsp;Login
          </Button>
        )}
      </SidebarFooter>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  );
}
