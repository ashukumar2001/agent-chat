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
import {
  LogInIcon,
  MessageSquare,
  MoreHorizontal,
  SquarePen,
  TrashIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useChatSession } from "@/hooks/use-chat-session";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Chat } from "@/types/misc";
import { useChatUtils } from "@/hooks/use-chat-utils";
import { UsageIndicator } from "@/components/usage";
import { cn } from "@/lib/utils";

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

function groupedChatCount(grouped: GroupedChats): number {
  return (
    grouped.Today.length + grouped.Yesterday.length + grouped.Older.length
  );
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
        isActive={isActive}
        tooltip={chat.name ?? undefined}
        render={
          <Link
            to="/chat/$chatId"
            params={{ chatId: chat.id }}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <span className="truncate">{chat.name}</span>
          </Link>
        }
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              showOnHover
              className="text-sidebar-foreground/80"
            >
              <MoreHorizontal />
              <span className="sr-only">Chat actions</span>
            </SidebarMenuAction>
          }
        />
        <DropdownMenuContent className="min-w-40" align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
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
    <SidebarGroup className="gap-1 p-2">
      <SidebarGroupLabel className="h-7 px-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
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

    const hasChats = groupedChatCount(groupedChats) > 0;

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
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
          <div className="flex flex-col gap-2 px-3 py-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SidebarMenuSkeleton key={index} />
            ))}
          </div>
        )}
        {!isLoading && !hasChats && (
          <Empty className="mx-2 my-3 flex-none rounded-2xl border border-dashed border-sidebar-border/80 bg-sidebar-accent/5 p-6">
            <EmptyHeader className="gap-3">
              <EmptyMedia variant="icon">
                <MessageSquare />
              </EmptyMedia>
              <EmptyTitle className="text-base">No chats yet</EmptyTitle>
              <EmptyDescription>
                Create a new chat to see it listed here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
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
    <SidebarHeader
      className={cn(
        "gap-3 border-b border-sidebar-border/60 bg-sidebar-accent/5 px-3 py-4",
        "group-data-[state=collapsed]:border-b-0 group-data-[state=collapsed]:bg-transparent group-data-[state=collapsed]:p-2"
      )}
    >
      <div
        className={cn(
          "flex min-h-8 items-center px-0.5",
          "group-data-[state=collapsed]:justify-center"
        )}
      >
        <h1
          className={cn(
            "font-heading text-xl font-semibold tracking-tight",
            "bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent",
            "transition-opacity duration-200",
            "group-data-[state=collapsed]:sr-only"
          )}
        >
          Eddy
        </h1>
      </div>
      <Button
        className="w-full shadow-sm"
        onClick={handleNewChat}
      >
        <SquarePen data-icon="inline-start" />
        New chat
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
      className="h-auto min-h-14 w-full justify-start gap-3 px-2 py-2.5 hover:bg-sidebar-accent"
      onClick={onOpenSettings}
    >
      <Avatar className="size-9 ring-1 ring-sidebar-border">
        <AvatarImage src={user.image ?? undefined} alt="" />
        <AvatarFallback className="text-xs font-medium">
          {user.name?.charAt(0) ?? "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
        <p className="w-full truncate text-sm font-medium leading-none">
          {user.name}
        </p>
        <p
          title={user.email ?? undefined}
          className="w-full truncate text-xs text-muted-foreground"
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
      variant="outline"
      className="w-full border-sidebar-border bg-sidebar-accent/10 hover:bg-sidebar-accent/20"
      onClick={onLogin}
    >
      <LogInIcon data-icon="inline-start" />
      Log in
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
    <SidebarFooter className="gap-3 border-t border-sidebar-border/60 bg-sidebar-accent/5 px-3 py-3">
      {user && (
        <div className="flex justify-center px-1">
          <UsageIndicator />
        </div>
      )}
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
  const { chats, isLoading } = useChats(userId);
  const { deleteChatMutation } = useChatUtils();
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
      className="border-r border-sidebar-border/80"
    >
      <SidebarHeaderContent />
      <SidebarContent className="gap-0 px-0 py-1">
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
