import { authClient } from "./auth-client";
import { type User } from "@worker/db/db-types";
export const getOrCreateGuestUserId = async (user?: User) => {
    if (user?.id) return user.id;
    // const guestUserStored = localStorage.getItem("guestUserStored");
    // if (guestUserStored) return guestUserStored;

    const guestUser = await authClient.signIn.anonymous();
    return guestUser.data?.user.id;
};