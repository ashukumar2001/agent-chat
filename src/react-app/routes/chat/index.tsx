import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/chat/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Navigate to="/" />;
}
