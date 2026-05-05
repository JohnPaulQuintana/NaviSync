import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  RefreshControl,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Email, inboxService } from "@/src/services/inbox.service";

/* ================= CONFIG ================= */
const tabs = ["All", "Job", "Receipt", "Spam"] as const;

const tabMeta: Record<string, { icon: any }> = {
  All: { icon: "mail" },
  Job: { icon: "briefcase" },
  Receipt: { icon: "receipt" },
  Spam: { icon: "warning" },
};

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

export default function InboxScreen() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [activeAccount, setActiveAccount] = useState("All Accounts");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= DRAWER ================= */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const categoryColors: Record<string, any> = {
    Job: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: "briefcase",
    },
    Receipt: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      icon: "receipt",
    },
    Spam: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: "warning",
    },
    All: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      icon: "mail",
    },
  };

  /* ================= FETCH ================= */
  const fetchEmails = async () => {
    try {
      setLoading(true);
      const data = await inboxService.getEmails();
      // console.log(data)
      setEmails(data);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmails();
    setRefreshing(false);
  };

  /* ================= ACCOUNTS ================= */
  const accounts = useMemo(() => {
    const unique = Array.from(new Set(emails.map((e) => e.account_email)));
    return ["All Accounts", ...unique];
  }, [emails]);

  /* ================= FILTER ================= */
  const filteredEmails = useMemo(() => {
    let result = emails;

    if (activeAccount !== "All Accounts") {
      result = result.filter((e) => e.account_email === activeAccount);
    }

    if (activeTab !== "All") {
      result = result.filter((e) => e.category === activeTab);
    }

    return result;
  }, [emails, activeTab, activeAccount]);

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

  /* ================= COUNTS ================= */
  const tabCounts = useMemo(() => {
    const base: Record<string, number> = {
      All: emails.length,
      Job: 0,
      Receipt: 0,
      Spam: 0,
    };

    emails.forEach((e) => {
      if (base[e.category] !== undefined) {
        base[e.category]++;
      }
    });

    return base;
  }, [emails]);

  useEffect(() => {
    fetchEmails();
  }, []);

  const getDateLabel = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(d, today)) return "Today";
    if (isSameDay(d, yesterday)) return "Yesterday";

    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  /* ================= THREAD GROUPING ================= */
  const sections = useMemo(() => {
    const map = new Map<string, Email[]>();

    filteredEmails.forEach((email) => {
      if (!map.has(email.thread_id)) {
        map.set(email.thread_id, []);
      }
      map.get(email.thread_id)!.push(email);
    });

    const threads = Array.from(map.values()).map((thread) => {
      const sorted = thread.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      return {
        thread_id: thread[0].thread_id,
        latest: sorted[0],
        count: thread.length,
      };
    });

    // sort newest first
    threads.sort(
      (a, b) =>
        new Date(b.latest.date).getTime() - new Date(a.latest.date).getTime(),
    );

    // group into sections
    const sectionMap: Record<string, any[]> = {};

    threads.forEach((t) => {
      const label = getDateLabel(t.latest.date);

      if (!sectionMap[label]) {
        sectionMap[label] = [];
      }

      sectionMap[label].push(t);
    });

    return Object.keys(sectionMap).map((label) => ({
      title: label,
      data: sectionMap[label],
    }));
  }, [filteredEmails]);

  /* ================= THREAD CARD ================= */
  const ThreadCard = ({ item }: any) => {
    const { latest, count } = item;
    console.log(latest);
    const category = categoryColors[latest.category] || categoryColors["All"];

    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      latest.from,
    )}&background=22C55E&color=fff`;

    return (
      <TouchableOpacity activeOpacity={0.9} className="mb-5">
        <View className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <View className="flex-row">
            {/* AVATAR */}
            <View className="w-12 h-12 rounded-full overflow-hidden mr-4">
              <Image source={{ uri: avatar }} className="w-full h-full" />
            </View>

            {/* CONTENT */}
            <View className="flex-1">
              {/* TOP ROW */}
              <View className="flex-row justify-between items-start">
                <Text
                  className="flex-1 pr-2 text-gray-900 font-semibold text-base leading-5"
                  numberOfLines={2}
                >
                  {latest.subject}
                </Text>

                {/* TIME BADGE */}
                <View className="ml-2 px-2 py-1 rounded-lg bg-gray-100">
                  <Text className="text-gray-600 text-[10px] font-medium">
                    {inboxService.formatDate(latest.date)}
                  </Text>
                </View>
              </View>

              {/* SENDER */}
              <Text className="text-gray-500 text-xs mt-1">{latest.from}</Text>

              {/* SNIPPET */}
              <Text
                className="text-gray-600 text-sm mt-3 leading-5"
                numberOfLines={2}
              >
                {latest.snippet}
              </Text>

              {/* BOTTOM ROW */}
              <View className="flex-row justify-between items-center mt-4">
                <View className="flex-row items-center gap-2 flex-wrap">
                  {/* CATEGORY TAG */}
                  <View className={`px-3 py-1 rounded-full ${category.bg}`}>
                    <Text
                      className={`text-[11px] font-medium ${category.text}`}
                    >
                      {latest.category}
                    </Text>
                  </View>

                  {/* THREAD COUNT */}
                  {count > 1 && (
                    <View className="px-3 py-1 rounded-full bg-gray-100">
                      <Text className="text-[11px] text-gray-600 font-medium">
                        {count} msgs
                      </Text>
                    </View>
                  )}
                </View>

                {/* ACCOUNT */}
                <Text
                  className="text-gray-400 text-[11px] max-w-[40%]"
                  numberOfLines={1}
                >
                  {latest.account_email}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* ================= LIST ================= */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.thread_id}
          renderItem={({ item }) => <ThreadCard item={item} />}
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
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#22C55E"
            />
          }
          ListEmptyComponent={
            loading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </>
            ) : (
              <View className="mt-20 items-center">
                <Text className="text-gray-400">No emails found</Text>
              </View>
            )
          }
          stickySectionHeadersEnabled
        />
      </Animated.View>

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

            {/* ================= ACCOUNTS ================= */}
            <Text className="text-gray-400 text-[10px] mb-2 uppercase tracking-wider">
              Accounts
            </Text>

            <View className="mb-5">
              {accounts.map((acc) => {
                const active = activeAccount === acc;

                return (
                  <TouchableOpacity
                    key={acc}
                    onPress={() => {
                      setActiveAccount(acc);
                      closeDrawer();
                    }}
                    activeOpacity={0.8}
                    className={`flex-row items-center justify-between px-3 py-3 rounded-xl mb-2 ${
                      active ? "bg-green-50" : "bg-gray-50"
                    }`}
                  >
                    {/* LEFT */}
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          active ? "bg-green-100" : "bg-gray-200"
                        }`}
                      >
                        <Ionicons
                          name="person"
                          size={14}
                          color={active ? "#16a34a" : "#6b7280"}
                        />
                      </View>

                      <Text
                        className={`ml-2 text-xs flex-1`}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {acc}
                      </Text>
                    </View>

                    {active && (
                      <Ionicons name="checkmark" size={14} color="#22C55E" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ================= CATEGORIES ================= */}
            <Text className="text-gray-400 text-[10px] mb-2 uppercase tracking-wider">
              Categories
            </Text>

            <View>
              {tabs.map((tab) => {
                const active = activeTab === tab;
                const meta = tabMeta[tab];

                const iconColors: Record<string, string> = {
                  All: "#6b7280",
                  Job: "#3b82f6",
                  Receipt: "#10b981",
                  Spam: "#ef4444",
                };

                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => {
                      setActiveTab(tab);
                      closeDrawer();
                    }}
                    activeOpacity={0.8}
                    className={`flex-row items-center justify-between px-3 py-3 rounded-xl mb-2 ${
                      active ? "bg-green-50" : "bg-gray-50"
                    }`}
                  >
                    {/* LEFT */}
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          active ? "bg-green-100" : "bg-gray-200"
                        }`}
                      >
                        <Ionicons
                          name={meta.icon}
                          size={14}
                          color={active ? "#16a34a" : iconColors[tab]}
                        />
                      </View>

                      <Text
                        className={`ml-2 text-xs ${
                          active
                            ? "text-green-700 font-semibold"
                            : "text-gray-600"
                        }`}
                      >
                        {tab}
                      </Text>
                    </View>

                    <Text className="text-[10px] text-gray-400">
                      {tabCounts[tab]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ================= RESET ================= */}
            <TouchableOpacity
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
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}
