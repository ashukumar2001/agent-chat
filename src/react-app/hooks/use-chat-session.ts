import { useLocation } from "@tanstack/react-router";
import { useMemo } from "react";
export const useChatSession = () => {
  const pathname = useLocation().pathname;
  const chatId = useMemo(() => {
    if (pathname.startsWith("/chat/")) {
      // Strip any trailing slashes so "/chat/abc/" yields "abc", not "abc/".
      return pathname.split("/chat/")[1].replace(/\/+$/, "");
    }
    return "";
  }, [pathname]);

  return { chatId };
};
