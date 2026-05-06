import { UserStorage } from "@/src/storage/user.storage";
import { api } from "./http";

export const transactionService = {
  async getTransactions(category: string = "All") {
    const user_id = await UserStorage.getUserId();

    const res = await api.get(
      `/share/transactions?user_id=${user_id}&category=${category}`,
    );

    // console.log(res);
    return res;
  },
};
