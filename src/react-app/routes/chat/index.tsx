import { TextMorph } from "@/components/motion-primitves/text-morph";
import { Button } from "@/components/ui/button";
import { useChats } from "@/hooks/use-chats";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/chat/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { createNewChatMutation } = useChats();
  return (
    <main className="h-full flex items-center justify-center">
      <Button
        onClick={() => {
          createNewChatMutation.mutate({
            name: "New Chat",
          });
        }}
        disabled={createNewChatMutation.isPending}
      >
        <TextMorph as="p">
          {createNewChatMutation.isPending
            ? "Creating new chat..."
            : "Create new chat"}
        </TextMorph>
      </Button>
    </main>
  );
}
