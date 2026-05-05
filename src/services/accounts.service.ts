import { api } from "./http";
import { UserStorage } from "@/src/storage/user.storage";

export const accountService = {
  getGoogleAuthUrl: async () => {
    const user_id = await UserStorage.getUserId();

    if (!user_id) throw new Error("No user_id found");

    return api.get(`/auth/google?app_user_id=${user_id}`);
  },
};