import { Chat } from "@/components/chat";
import { useChatSession } from "@/hooks/use-chat-session";
import { useSession } from "@/hooks/useSession";
import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/chat/$chatId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { chatId } = useChatSession();
  const { user, isPending } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/" />;
  }
  return <Chat key={chatId} chatId={chatId} userId={user.id} />;
}
