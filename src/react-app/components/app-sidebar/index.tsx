import { memo, useCallback, useMemo } from "react";
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
import { useModal } from "@/hooks/use-modal";
import { authClient } from "@/lib/auth-client";
import { LogInIcon, MoreHorizontal, TrashIcon } from "lucide-react";
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
import { Chat } from "@/types/misc";

// Types
type GroupedChats = {
  Today: Chat[];
  Yesterday: Chat[];
  Older: Chat[];
};

// Utility function to group chats by date
function groupChatsByDate(chats: Chat[] | undefined): GroupedChats {
  const grouped: GroupedChats = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  if (!chats) return grouped;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();

  for (const chat of chats) {
    const chatDate = new Date(chat.updatedAt || chat.createdAt || Date.now());
    const chatDateStr = chatDate.toDateString();

    if (chatDateStr === todayStr) {
      grouped.Today.push(chat);
    } else if (chatDateStr === yesterdayStr) {
      grouped.Yesterday.push(chat);
    } else {
      grouped.Older.push(chat);
    }
  }

  return grouped;
}

// Memoized Chat Item Component
interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
}

const ChatItem = memo(function ChatItem({
  chat,
  isActive,
  onDelete,
}: ChatItemProps) {
  const handleDelete = useCallback(() => {
    onDelete(chat.id);
  }, [chat.id, onDelete]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={`flex items-center justify-between group/chat transition-all duration-200 rounded-lg px-3 py-2 ${
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm font-medium"
            : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
        }`}
        isActive={isActive}
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
          <SidebarMenuAction showOnHover className="hover:bg-background/50">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit" align="start">
          <DropdownMenuItem
            onSelect={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
});

// Memoized Chat Group Component
interface ChatGroupProps {
  label: string;
  chats: Chat[];
  activeChatId: string | undefined;
  onDeleteChat: (chatId: string) => void;
}

const ChatGroup = memo(function ChatGroup({
  label,
  chats,
  activeChatId,
  onDeleteChat,
}: ChatGroupProps) {
  if (chats.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 px-2 mb-2">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={activeChatId === chat.id}
            onDelete={onDeleteChat}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
});

// Memoized Chat List Component
interface ChatListProps {
  groupedChats: GroupedChats;
  activeChatId: string | undefined;
  onDeleteChat: (chatId: string) => void;
  isLoading: boolean;
}

const ChatList = memo(
  ({ groupedChats, activeChatId, onDeleteChat, isLoading }: ChatListProps) => {
    const groups = useMemo(
      () =>
        [
          { label: "Today", chats: groupedChats.Today },
          { label: "Yesterday", chats: groupedChats.Yesterday },
          { label: "Older", chats: groupedChats.Older },
        ] as const,
      [groupedChats]
    );

    return (
      <>
        {groups.map(({ label, chats }) => (
          <ChatGroup
            key={label}
            label={label}
            chats={chats}
            activeChatId={activeChatId}
            onDeleteChat={onDeleteChat}
          />
        ))}
        {isLoading && (
          <div className="space-y-2 px-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <SidebarMenuSkeleton key={index} />
            ))}
          </div>
        )}
      </>
    );
  }
);

// Memoized Sidebar Header Component
const SidebarHeaderContent = memo(function SidebarHeaderContent() {
  const navigate = useNavigate();

  const handleNewChat = useCallback(() => {
    navigate({ to: "/" });
  }, [navigate]);

  return (
    <SidebarHeader className="flex-col flex p-4">
      <h1 className="text-2xl font-bold group-data-[state=collapsed]:opacity-0 h-8 flex items-center transition-all group-data-[state=expanded]:opacity-100 group-data-[state=expanded]:delay-150 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        Eddy
      </h1>
      <Button
        className="w-full justify-start bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-sm transition-all duration-300"
        onClick={handleNewChat}
      >
        New Chat
      </Button>
    </SidebarHeader>
  );
});

// Memoized User Profile Component
interface UserProfileProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onOpenSettings: () => void;
}

const UserProfile = memo(function UserProfile({
  user,
  onOpenSettings,
}: UserProfileProps) {
  return (
    <Button
      variant="ghost"
      className="justify-start px-2 h-14 w-full hover:bg-sidebar-accent/50 transition-colors"
      onClick={onOpenSettings}
    >
      <Avatar className="h-9 w-9 border border-sidebar-border">
        <AvatarImage src={user.image ?? undefined} />
        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start w-full ml-2">
        <p className="text-sm font-medium leading-none">{user.name}</p>
        <p
          title={user.email ?? undefined}
          className="text-xs text-muted-foreground truncate max-w-[140px] mt-1"
        >
          {user.email}
        </p>
      </div>
    </Button>
  );
});

// Memoized Login Button Component
interface LoginButtonProps {
  onLogin: () => void;
}

const LoginButton = memo(function LoginButton({ onLogin }: LoginButtonProps) {
  return (
    <Button
      variant="ghost"
      className="justify-center w-full bg-sidebar-accent/10 hover:bg-sidebar-accent/20"
      onClick={onLogin}
    >
      <LogInIcon className="mr-2 h-4 w-4" />
      <span>Login</span>
    </Button>
  );
});

// Memoized Sidebar Footer Component
interface SidebarFooterContentProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

const SidebarFooterContent = memo(function SidebarFooterContent({
  user,
}: SidebarFooterContentProps) {
  const { openModal } = useModal();

  const handleOpenSettings = useCallback(() => {
    openModal("settings");
  }, [openModal]);

  const handleLogin = useCallback(() => {
    openModal("login");
  }, [openModal]);

  return (
    <SidebarFooter className="border-t border-sidebar-border/50 p-4 bg-linear-to-t from-sidebar-accent/10 to-transparent">
      {user ? (
        <UserProfile user={user} onOpenSettings={handleOpenSettings} />
      ) : (
        <LoginButton onLogin={handleLogin} />
      )}
    </SidebarFooter>
  );
});

// Main Sidebar Component
export function AppSidebar() {
  const { data: userSessionData } = authClient.useSession();
  const userId = userSessionData?.user?.id;
  const { chats, deleteChatMutation, isLoading } = useChats(userId);
  const { chatId } = useChatSession();

  const groupedChats = useMemo(() => groupChatsByDate(chats), [chats]);

  const handleDeleteChat = useCallback(
    (chatIdToDelete: string) => {
      deleteChatMutation.mutate({ chatId: chatIdToDelete });
    },
    [deleteChatMutation]
  );

  return (
    <Sidebar
      collapsible="offcanvas"
      className="bg-linear-to-b from-sidebar to-sidebar/90 border-r-0"
    >
      <SidebarHeaderContent />
      <SidebarContent className="px-2">
        <ChatList
          groupedChats={groupedChats}
          activeChatId={chatId}
          onDeleteChat={handleDeleteChat}
          isLoading={isLoading}
        />
      </SidebarContent>
      <SidebarFooterContent user={userSessionData?.user ?? null} />
    </Sidebar>
  );
}
