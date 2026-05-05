import { UserStorage } from "@/src/storage/user.storage";

export const ensureDeviceId = async (): Promise<string> => {
  let deviceId = await UserStorage.getDeviceId();

  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    await UserStorage.saveDeviceId(deviceId);
  }

  return deviceId;
};