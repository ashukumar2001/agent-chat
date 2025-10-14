import { createFileRoute, useParams } from "@tanstack/react-router";
export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  console.log(params);
  return (
    <div className="">
      <h1>AI Chat</h1>
    </div>
  );
}
