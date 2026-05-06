import { api } from "./http";

export const authService = {
  // =====================
  // LOGIN
  // =====================
  login: async (email: string) => {
    const res = await api.post("/auth/login", { email });
    // console.log(res);
    return res;
  },

  // =====================
  // REGISTER DEVICE
  // =====================
  registerDevice: async (payload: {
    user_id: string;
    device_id: string;
    platform: string;
    device_name?: string;
    app_version?: string;
  }) => {
    const res = await api.post("/device/register", payload);
    return res.data;
  },
};
