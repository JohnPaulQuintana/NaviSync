import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "navisync_user_id";
const DEVICE_KEY = "navisync_device_id";

export const UserStorage = {
  // =====================
  // USER ID
  // =====================
  saveUserId: async (id: string) => {
    await AsyncStorage.setItem(USER_KEY, id);
  },

  getUserId: async () => {
    return await AsyncStorage.getItem(USER_KEY);
  },

  // =====================
  // DEVICE ID
  // =====================
  saveDeviceId: async (id: string) => {
    await AsyncStorage.setItem(DEVICE_KEY, id);
  },

  getDeviceId: async () => {
    return await AsyncStorage.getItem(DEVICE_KEY);
  },

  // =====================
  // CLEAR ALL SESSION DATA
  // =====================
  clear: async () => {
    await AsyncStorage.multiRemove([USER_KEY, DEVICE_KEY]);
  },
};