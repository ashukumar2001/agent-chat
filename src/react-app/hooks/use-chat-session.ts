import { useLocation } from "@tanstack/react-router";
import { useMemo } from "react";
export const useChatSession = () => {
  const pathname = useLocation().pathname;
  const chatId = useMemo(() => {
    if (pathname.startsWith("/chat/")) return pathname.split("/chat/")[1];
    return "";
  }, [pathname]);

  return { chatId };
};
