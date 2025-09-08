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
import { TextMorph } from "../motion-primitves/text-morph";

export function AppSidebar() {
  const { data: userSessionData } = authClient.useSession();
  const { chats, createNewChatMutation, deleteChatMutation, isLoading } =
    useChats(userSessionData?.user?.id);
  const { chatId } = useChatSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="flex-col flex space-y-3">
        <h1 className="text-xl group-data-[state=collapsed]:opacity-0 transition-all group-data-[state=expanded]:opacity-100 group-data-[state=expanded]:delay-150 text-center">
          Eddy
        </h1>
        <Button
          onClick={() => {
            createNewChatMutation.mutate({
              name: "New Chat",
            });
          }}
        >
          <TextMorph transition={{ duration: 0.1 }}>
            {createNewChatMutation.isPending
              ? "Creating new chat..."
              : "New chat"}
          </TextMorph>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Today</SidebarGroupLabel>
          <SidebarMenu>
            {chats?.map((chat) => {
              return (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    className="flex items-center justify-between group/chat"
                    isActive={chatId === chat.id}
                    asChild
                  >
                    <Link to={"/chat/" + chat.id} className="flex-1 text-left">
                      <span className="truncate">{chat.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-fit" align="start">
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <PencilIcon />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          deleteChatMutation.mutate({
                            chatId: chat.id,
                          });
                        }}
                      >
                        <TrashIcon />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        {!!userSessionData?.user ? (
          <>
            <Button
              variant="ghost"
              className="justify-start px-3 h-[56px] w-full"
              onClick={() => setSettingsOpen(true)}
            >
              <Avatar>
                <AvatarImage src={userSessionData?.user?.image!} />
                <AvatarFallback>
                  {userSessionData?.user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start w-full">
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
            <span>Login</span>
          </Button>
        )}
      </SidebarFooter>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  );
}
