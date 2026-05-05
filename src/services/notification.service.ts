import { UserStorage } from "@/src/storage/user.storage";
import { api } from "./http";

export const notificationService = {
  async getNotifications(category: string = "All") {
    const user_id = await UserStorage.getUserId();

    const res = await api.get(
      `/notification/history?user_id=${user_id}&category=${category}`,
    );

    return res.notifications;

  },
};
