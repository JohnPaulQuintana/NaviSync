import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  NativeModules
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TrustCard } from "@/src/components/permissions/TrustCard";

type Props = {
  onGranted: () => void;
  onSkip?: () => void;
};

export function NotificationPermissionGate({
  onGranted,
  onSkip,
}: Props) {
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  // SAFE native module access
  const NotificationIntent =
    NativeModules?.NotificationIntent ?? null;

  // ================= CHECK PERMISSION =================
  const check = async () => {
    try {
      // fallback if module not available (Expo Go / web)
      if (!NotificationIntent) {
        console.log("NotificationIntent not available");
        setChecking(false);
        return;
      }

      const enabled =
        await NotificationIntent.isNotificationEnabled?.();

      if (enabled) {
        onGranted();
        return;
      }
    } catch (err) {
      console.log("Permission check error:", err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  // ================= OPEN SETTINGS =================
  const handleEnable = async () => {
    try {
      setLoading(true);

      if (!NotificationIntent) {
        console.log("Native module missing");
        return;
      }

      await NotificationIntent.openNotificationSettings?.();
    } catch (err) {
      console.log("Open settings error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= LOADING =================
  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
        <Text className="text-gray-400 mt-3 text-xs">
          Checking notification access...
        </Text>
      </View>
    );
  }

  // ================= UI =================
  return (
    <View className="flex-1 bg-gray-50 px-6 justify-center">
     
      <View className="bg-white rounded-3xl p-7 border border-gray-100">

        {/* ICON */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-5">
            <Ionicons
              name="shield-checkmark-outline"
              size={44}
              color="#16A34A"
            />
          </View>

          <Text className="text-3xl font-bold text-gray-900 text-center">
            Secure Notification Access
          </Text>

          <Text className="text-gray-500 text-center text-base mt-3 leading-6 px-2">
            NaviSync uses notification access only to sync important updates
            across your devices.
          </Text>
        </View>

        {/* TRUST POINTS */}
        <View className="mb-8">
          <TrustCard
            icon="lock-closed-outline"
            title="Local Processing"
            description="Everything is processed on your device first."
          />

          <TrustCard
            icon="eye-off-outline"
            title="No Sensitive Reading"
            description="We never access passwords or private messages."
          />

          <TrustCard
            icon="cloud-upload-outline"
            title="Secure Sync Only"
            description="Only notification metadata is synced."
          />
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleEnable}
          disabled={loading}
          className="bg-green-600 py-4 rounded-2xl items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Enable Notification Access
            </Text>
          )}
        </TouchableOpacity>

        {/* SKIP */}
        {onSkip && (
          <TouchableOpacity onPress={onSkip} className="mt-5">
            <Text className="text-center text-gray-400 text-sm">
              Skip for now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}