import { authClient } from "@/lib/auth-client";

export const useSession = () => {
    const { data: userSessionData, isPending } = authClient.useSession();
    const user = userSessionData?.user;
    const session = userSessionData?.session;
    return { user, session, isPending };
}