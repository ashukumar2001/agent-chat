import { type User } from "@worker/db/db-types";
export const getOrCreateGuestUserId = async (user?: User) => {
  if (user?.id) return user.id;
  return null;
};
