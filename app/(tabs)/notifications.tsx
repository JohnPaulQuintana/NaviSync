import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  SectionList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { notificationService } from "@/src/services/notification.service";

const Shimmer = ({ width, height, style }: any) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: "#E5E7EB",
          overflow: "hidden",
          borderRadius: 8,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: "50%",
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.6)",
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

/* ================= SKELETON CARD ================= */
const SkeletonCard = () => {
  return (
    <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200">
      <View className="flex-row">
        {/* AVATAR */}
        <Shimmer width={48} height={48} style={{ borderRadius: 999 }} />

        {/* CONTENT */}
        <View className="flex-1 ml-4">
          {/* TOP ROW */}
          <View className="flex-row justify-between items-center">
            <Shimmer width="65%" height={14} />
            <Shimmer width={60} height={16} />
          </View>

          {/* SENDER */}
          <View className="mt-2">
            <Shimmer width="35%" height={12} />
          </View>

          {/* SNIPPET */}
          <View className="mt-3">
            <Shimmer width="100%" height={12} />
            <View className="mt-2">
              <Shimmer width="85%" height={12} />
            </View>
          </View>

          {/* BOTTOM ROW */}
          <View className="flex-row justify-between items-center mt-4">
            <View className="flex-row gap-2">
              <Shimmer width={70} height={20} style={{ borderRadius: 999 }} />
              <Shimmer width={90} height={20} style={{ borderRadius: 999 }} />
            </View>

            <Shimmer width={80} height={12} />
          </View>
        </View>
      </View>
    </View>
  );
};

const tabs = ["All", "Social", "Job", "Receipt", "Spam"] as const;
type Category = "Social" | "Job" | "Receipt" | "Spam" | "All";
const categoryTheme: Record<Category, { color: string; bg: string }> = {
  All: { color: "#6b7280", bg: "#e5e7eb" },
  Social: { color: "#3b82f6", bg: "#dbeafe" },
  Job: { color: "#f59e0b", bg: "#fef3c7" },
  Receipt: { color: "#10b981", bg: "#d1fae5" },
  Spam: { color: "#ef4444", bg: "#fee2e2" },
};
export default function NotificationsScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "All" | "Social" | "Job" | "Receipt" | "Spam"
  >("All");

  /* ================= DRAWER ================= */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const fadeAnim = useRef(new Animated.Value(1)).current;

  /* ================= DRAWER ================= */
  const openDrawer = () => {
    setDrawerOpen(true);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerOpen(false));
  };

  const fetchNotifications = async (category = activeTab) => {
    try {
      setLoading(true);

      const data = await notificationService.getNotifications(category);

      setNotifications(data || []);
    } catch (err) {
      console.log("FETCH NOTIFICATIONS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupNotificationsByDate = (data: any[]) => {
    const groups: Record<string, { items: any[]; date: Date }> = {};

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const getLabel = (date: Date) => {
      if (date.toDateString() === today.toDateString()) return "Today";
      if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    data.forEach((item) => {
      const date = new Date(item.timestamp || item.created_at);
      const label = getLabel(date);

      if (!groups[label]) {
        groups[label] = {
          items: [],
          date, // store real date for sorting
        };
      }

      groups[label].items.push({
        ...item,
        _time: date,
      });
    });

    // 🔥 convert to SectionList format + sort
    return Object.keys(groups)
      .map((label) => ({
        title: label,
        data: groups[label].items.sort(
          (a, b) => b._time.getTime() - a._time.getTime(),
        ),
        date: groups[label].date,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // newest first
  };

  const NotificationCard = ({ item }: any) => {
    const time = new Date(item._time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const category = (item.category as Category) || "All";
    const theme = categoryTheme[category];

    return (
      <View
        className="bg-white rounded-2xl p-5 mb-3"
        style={{
          borderWidth: 1,
          borderColor: "#f1f5f9",
        }}
      >
        {/* TOP ROW */}
        <View className="flex-row justify-between items-start">
          {/* TITLE */}
          <Text
            className="text-gray-900 font-semibold flex-1 pr-3"
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* CATEGORY BADGE */}
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: theme.bg }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: theme.color }}
            >
              {item.category}
            </Text>
          </View>
        </View>

        {/* MESSAGE */}
        <Text
          className="text-gray-500 text-sm mt-2 leading-5"
          // numberOfLines={2}
        >
          {item.text}
        </Text>

        {/* FOOTER */}
        <View className="flex-row justify-between items-center mt-4">
          {/* SOURCE */}
          <Text className="text-gray-400 text-xs" numberOfLines={1}>
            {item.package_name}
          </Text>

          {/* TIME */}
          <Text className="text-gray-400 text-xs">{time}</Text>
        </View>
      </View>
    );
  };

  const getCounts = (data: any[]) => {
    const counts: Record<string, number> = {
      All: data.length,
      Social: 0,
      Job: 0,
      Receipt: 0,
      Spam: 0,
    };

    data.forEach((item) => {
      const cat = item.category;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });

    return counts;
  };

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab]);

  const tabCounts = getCounts(notifications);
  const groupedData = groupNotificationsByDate(notifications);

  return (
    <View className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center bg-green-600 border-b border-gray-200">
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
              Unified workspace
            </Text>
          </View>
        </View>

        {/* ACTION */}
        <TouchableOpacity
          onPress={openDrawer}
          className="bg-white p-3 rounded-xl"
        >
          <Ionicons name="options-outline" size={18} color="green" />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <View className="flex-1 px-6 pt-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : notifications.length === 0 ? (
          <View className="items-center mt-20">
            <Ionicons name="mail-outline" size={50} color="#9CA3AF" />
            <Text className="text-gray-400 mt-3">No notifications yet</Text>
          </View>
        ) : (
          <SectionList
            sections={groupedData}
            keyExtractor={(item) => item.client_id}
            renderItem={({ item }) => <NotificationCard item={item} />}
            renderSectionHeader={({ section: { title } }) => (
              <View className="bg-gray-50 px-4 pt-2 pb-2">
                {/* TOP ROW */}
                <View className="flex-row items-center justify-between">
                  {/* LEFT: Title (Today / Yesterday) */}
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />

                    <Text className="text-green-600 text-sm font-bold">
                      {title}
                    </Text>
                  </View>

                  {/* RIGHT: small date badge */}
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-700 text-[10px] font-semibold">
                      {new Date().toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                {/* divider line */}
                <View className="h-[1px] border border-dashed border-slate-200 mt-3" />
              </View>
            )}
            contentContainerStyle={{ padding: 0, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* ================= DRAWER ================= */}
      {drawerOpen && (
        <View className="absolute inset-0 z-50">
          {/* BACKDROP */}
          <Animated.View
            style={{ opacity: backdropAnim }}
            className="absolute inset-0 bg-black/40"
          >
            <TouchableOpacity className="flex-1" onPress={closeDrawer} />
          </Animated.View>

          {/* PANEL */}
          <Animated.View
            style={{
              transform: [{ translateX: slideAnim }],
              willChange: "transform",
            }}
            className="absolute right-0 top-0 bottom-0 w-[60%] bg-white pt-16 px-6 rounded-l-3xl"
          >
            {/* HEADER */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-green-600 text-xl font-bold">Filters</Text>
              {/* <View className="border border-gray-200 w-full flex" /> */}
              <TouchableOpacity
                onPress={closeDrawer}
                className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={16} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* ================= CATEGORIES ================= */}
            <Text className="text-gray-400 text-[11px] mb-4 uppercase tracking-wider">
              Categories
            </Text>

            <View className="space-y-3">
              {tabs.map((tab) => {
                const active = activeTab === tab;

                const iconMap: Record<string, any> = {
                  All: "layers-outline",
                  Social: "chatbubble-ellipses-outline",
                  Job: "briefcase-outline",
                  Receipt: "receipt-outline",
                  Spam: "alert-circle-outline",
                };

                const theme = categoryTheme[tab];
                const count = tabCounts[tab];

                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => {
                      setActiveTab(tab);
                      closeDrawer();
                    }}
                    activeOpacity={0.85}
                    className="flex-row items-center justify-between px-4 py-4 rounded-2xl"
                    style={{
                      backgroundColor: active ? theme.bg : "#f9fafb",
                    }}
                  >
                    {/* LEFT */}
                    <View className="flex-row items-center flex-1">
                      {/* ICON */}
                      <View
                        className="w-11 h-11 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: active ? theme.bg : "#e5e7eb",
                        }}
                      >
                        <Ionicons
                          name={iconMap[tab]}
                          size={18}
                          color={theme.color}
                        />
                      </View>

                      {/* LABEL */}
                      <Text
                        className="ml-4 text-base font-semibold"
                        style={{
                          color: active ? theme.color : "#6b7280",
                        }}
                      >
                        {tab}
                      </Text>
                    </View>

                    {/* BADGE */}
                    <View
                      className="px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: active ? theme.bg : "#e5e7eb",
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: theme.color,
                        }}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ================= RESET ================= */}
            {/* <TouchableOpacity
              onPress={() => {
                setActiveAccount("All Accounts");
                setActiveTab("All");
                closeDrawer();
              }}
              activeOpacity={0.85}
              className="mt-6 bg-green-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white text-xs font-semibold">
                Reset Filters
              </Text>
            </TouchableOpacity> */}
          </Animated.View>
        </View>
      )}
    </View>
  );
}
