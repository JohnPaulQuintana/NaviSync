import { accountService } from "@/src/services/accounts.service";
import { api } from "@/src/services/http";
import { UserStorage } from "@/src/storage/user.storage";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from "react-native";

// ================= USER =================
const user = {
  name: "Navi User",
  email: "user@navisync.app",
  plan: "Free Plan",
  avatar: "https://ui-avatars.com/api/?name=Navi+User",
};

// ================= TYPES =================
type AccountStatus = "connected" | "disconnected" | "syncing";

// ================= STATUS CONFIG =================
const STATUS_UI = {
  connected: {
    label: "Connected",
    bg: "bg-green-100",
    text: "text-green-700",
  },
  disconnected: {
    label: "Disconnected",
    bg: "bg-gray-100",
    text: "text-gray-500",
  },
  syncing: {
    label: "Syncing",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },
} as const;

// ================= STATUS ENGINE =================
const normalizeStatus = (acc: any): AccountStatus => {
  console.log(acc);
  const status = acc?.is_active;

  // if (status === "syncing") return "syncing";
  if (!status) return "disconnected";

  return "connected";
};

const formatDate = (date: number | string) => {
  if (!date) return "—";

  const d = new Date(date); // works for both ms number & ISO string
  const now = new Date();

  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay < 7) return `${diffDay} day ago`;

  return d.toLocaleDateString();
};

export default function AccountsScreen() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const hasFetched = useRef(false);

  // ================= FETCH =================
  const fetchAccounts = async (force = false) => {
    if (fetching) return;
    if (hasFetched.current && !force) return;

    try {
      setFetching(true);

      const user_id = await UserStorage.getUserId();
      const res = await api.get(`/gmail/debug/${user_id}`);

      setAccounts(res.accounts || []);
      hasFetched.current = true;
    } catch (err) {
      console.log("FETCH ERROR:", err);
    } finally {
      setFetching(false);
    }
  };

  // ================= CONNECT =================
  const connectGmail = async () => {
    try {
      setLoading(true);
      const res = await accountService.getGoogleAuthUrl();
      await Linking.openURL(res.url);
    } finally {
      setLoading(false);
    }
  };

  // ================= DISCONNECT =================
  const disconnectAccount = async (google_id: string) => {
    try {
      setFetching(true);

      await api.post(`/gmail/disconnect`, { google_id });

      setAccounts((prev) => prev.filter((a) => a.google_id !== google_id));
    } finally {
      setFetching(false);
    }
  };

  // ================= INIT =================
  useEffect(() => {
    fetchAccounts();

    const sub = Linking.addEventListener("url", async () => {
      hasFetched.current = false;
      await fetchAccounts(true);
    });

    return () => sub.remove();
  }, []);

  // ================= RESET =================
  const resetSyncHub = async () => {
    await UserStorage.clear();
    setAccounts([]);
    hasFetched.current = false;
  };

  // ================= UI RENDER HELPERS =================
  const renderAccountCard = (acc: any) => {
    const status = normalizeStatus(acc);
    const ui = STATUS_UI[status];

    return (
      <View
        key={acc.google_id}
        className="bg-white p-5 rounded-2xl mb-4 border border-gray-200 shadow-sm"
      >
        <View className="flex-row items-start">
          {/* AVATAR */}
          <Image
            source={{
              uri:
                acc.picture || `https://ui-avatars.com/api/?name=${acc.name}`,
            }}
            className="w-12 h-12 rounded-full mr-4"
          />

          {/* CONTENT */}
          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-2">
                <Text className="text-gray-900 font-semibold text-base">
                  {acc.name}
                </Text>

                <Text className="text-gray-500 text-sm">{acc.email}</Text>
              </View>

              {/* STATUS BADGE */}
              <View className={`px-3 py-1 rounded-full ${ui.bg}`}>
                <Text className={`text-xs font-semibold ${ui.text}`}>
                  {ui.label}
                </Text>
              </View>
            </View>

            {/* META */}
            <Text className="text-gray-400 text-xs mt-2">
              {acc.last_sync
                ? `Last sync: ${formatDate(acc.last_sync)}`
                : `Connected: ${formatDate(acc.created_at)}`}
            </Text>

            {/* ACTIONS */}
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => disconnectAccount(acc.google_id)}
                className="bg-red-100 px-3 py-2 rounded-xl"
              >
                <Text className="text-red-600 text-xs font-semibold">
                  Disconnect
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="bg-gray-100 px-3 py-2 rounded-xl">
                <Text className="text-gray-700 text-xs font-semibold">
                  View Activity
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ================= UI =================
  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER */}
      {/* <View className="px-6 pt-16 pb-5 border-b border-gray-200 bg-white">
        <Text className="text-gray-900 text-3xl font-bold">NaviSync</Text>
        <Text className="text-gray-500 mt-1">Sync your digital workspace</Text>
      </View> */}
      {/* ================= HEADER ================= */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center bg-green-600">
        {/* BRAND */}
        <View className="flex-row items-center">
          <Image
            source={require("../../assets/images/icon.png")}
            className="w-10 h-10 mr-2 border border-green-600 rounded-lg"
            resizeMode="contain"
          />

          <View>
            <Text className="text-white text-2xl font-bold">NaviSync</Text>

            <Text className="text-gray-100 text-xs -mt-1">
              Sync your digital workspace
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-2">
        {/* PROFILE */}
        <View className="bg-green-600 p-5 mb-6 rounded-xl">
          <View className="flex-row items-center">
            <Image
              source={{ uri: user.avatar }}
              className="w-14 h-14 rounded-full mr-4"
            />

            <View className="flex-1">
              <Text className="text-white text-lg font-bold">{user.name}</Text>
              <Text className="text-gray-200 text-sm">{user.email}</Text>
            </View>

            <View className="bg-green-100 px-3 py-2 rounded-full">
              <Text className="text-green-700 text-xs font-semibold">
                {user.plan}
              </Text>
            </View>
          </View>
        </View>

        {/* ACTIONS */}
        <View className="mb-6">
          <Text className="text-gray-700 mb-3 font-semibold">Sync Center</Text>

          <TouchableOpacity
            onPress={connectGmail}
            disabled={loading}
            className="bg-green-500 py-4 rounded-2xl items-center mb-3"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">
                + Add Sync Source
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => fetchAccounts(true)}
            className="bg-gray-100 py-3 rounded-2xl items-center"
          >
            <Text className="text-gray-700 font-medium">Refresh Sync</Text>
          </TouchableOpacity>
        </View>

        {/* ACCOUNTS */}
        <Text className="text-gray-700 mb-3 font-semibold">
          Connected Integrations
        </Text>

        {fetching && <ActivityIndicator color="green" className="mb-4" />}

        {accounts.length === 0 && !fetching && (
          <Text className="text-slate-500 mb-4">
            No integrations connected yet
          </Text>
        )}

        {accounts.map(renderAccountCard)}

        {/* DANGER */}
        <View className="mt-8 mb-10">
          <Text className="text-red-500 mb-3 font-semibold">Danger Zone</Text>
          <TouchableOpacity
            onPress={resetSyncHub}
            className="bg-red-500 py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-semibold">Reset Sync Hub</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
