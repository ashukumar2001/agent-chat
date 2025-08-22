import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/callback/$provider")({
  component: RouteComponent,
  beforeLoad: async (ctx) => {
    const response = await fetch(ctx.location.href);
    if (response.ok) {
      window.location.href = "/";
    }
  },
});

function RouteComponent() {
  return null;
}
