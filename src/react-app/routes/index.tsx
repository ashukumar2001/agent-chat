import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="">
      <h1>AI Chat</h1>
    </div>
  );
}
