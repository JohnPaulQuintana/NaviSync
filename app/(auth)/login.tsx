import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  NativeModules,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";

import { authService } from "@/src/services/auth.service";
import { UserStorage } from "@/src/storage/user.storage";
import { ensureDeviceId } from "@/src/utils/device";
import { NotificationPermissionGate } from "@/src/components/permissions/NotificationPermissionGate";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [step, setStep] = useState<"login" | "permission">("login");

  const { NaviSyncStorage } = NativeModules;

  /* ================= SESSION ================= */
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const userId = await UserStorage.getUserId();
        if (mounted && userId) router.replace("/(tabs)");
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  /* ================= LOGIN ================= */
  const handleStart = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const res = await authService.login("user");
      const userId = res.user_id;

      await UserStorage.saveUserId(userId);

      const deviceId = await ensureDeviceId();

      await authService.registerDevice({
        user_id: userId,
        device_id: deviceId,
        platform: "android",
        device_name: "Android Device",
      });

      await NaviSyncStorage.saveUserId(userId);
      await NaviSyncStorage.saveDeviceId(deviceId);

      setStep("permission");
    } catch (err) {
      console.log("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* ================= SESSION LOADING ================= */}
      {checkingSession && (
        <View className="flex-1 bg-white items-center justify-center">
          <ActivityIndicator color="#16A34A" />
          <Text className="text-gray-500 mt-3 text-xs">
            Loading workspace...
          </Text>
        </View>
      )}

      {/* background glow */}
      <View className="absolute -top-24 -right-20 w-72 h-72 bg-green-100 rounded-full opacity-60" />
      <View className="absolute top-40 -left-24 w-64 h-64 bg-green-50 rounded-full opacity-50" />

      <View className="flex-1 justify-center px-8">
        {/* LOGO */}
        <View className="items-center mb-10">
          <Image
            source={require("@/assets/images/icon-transparent.png")}
            className="w-80 h-80"
            resizeMode="contain"
          />

          <Text className="text-gray-500 text-center text-base -mt-14">
            Your inbox, organized automatically.
          </Text>
        </View>

        {/* FEATURE CARDS */}
        <View className="flex-row justify-between mb-10 gap-3">
          {/* Unified */}
          <View className="flex-1 bg-white border border-green-100 rounded-2xl p-4 items-center">
            <View className="w-11 h-11 bg-green-50 rounded-full items-center justify-center mb-2">
              <Ionicons name="layers-outline" size={20} color="#16A34A" />
            </View>
            <Text className="text-gray-900 font-semibold text-xs text-center">
              Unified Inbox
            </Text>
            <Text className="text-gray-400 text-[10px] text-center mt-1">
              One place for everything
            </Text>
          </View>

          {/* Smart */}
          <View className="flex-1 bg-white border border-green-100 rounded-2xl p-4 items-center">
            <View className="w-11 h-11 bg-green-50 rounded-full items-center justify-center mb-2">
              <Ionicons name="sparkles-outline" size={20} color="#16A34A" />
            </View>
            <Text className="text-gray-900 font-semibold text-xs text-center">
              Smart Sorting
            </Text>
            <Text className="text-gray-400 text-[10px] text-center mt-1">
              Auto-categorize emails
            </Text>
          </View>

          {/* Multi */}
          <View className="flex-1 bg-white border border-green-100 rounded-2xl p-4 items-center">
            <View className="w-11 h-11 bg-green-50 rounded-full items-center justify-center mb-2">
              <Ionicons name="mail-outline" size={20} color="#16A34A" />
            </View>
            <Text className="text-gray-900 font-semibold text-xs text-center">
              Multi Account
            </Text>
            <Text className="text-gray-400 text-[10px] text-center mt-1">
              Gmail sync ready
            </Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleStart}
          disabled={loading}
          className="bg-green-600 py-4 rounded-2xl items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Start using NaviSync
            </Text>
          )}
        </TouchableOpacity>

        {/* FOOTER */}
        <Text className="text-gray-400 text-xs text-center mt-6">
          Secure sync • Privacy-first • Lightweight design
        </Text>
      </View>

      {/* ================= PERMISSION OVERLAY ================= */}
      {step === "permission" && (
        <View className="absolute inset-0 z-50">
          <NotificationPermissionGate
            onGranted={() => router.replace("/(tabs)")}
            onSkip={() => router.replace("/(tabs)")}
          />
        </View>
      )}
    </View>
  );
}
