import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/chat/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <h1>Create new chat</h1>;
}
