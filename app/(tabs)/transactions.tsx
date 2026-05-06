import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  SectionList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { transactionService } from "@/src/services/transaction.service";

/* ================= CONFIG ================= */
const tabs = ["All", "GCASH", "MAYA", "BPI"] as const;
type Filter = "All" | "GCASH" | "MAYA" | "BPI";

const sourceTheme: Record<string, { color: string; bg: string }> = {
  All: { color: "#6b7280", bg: "#e5e7eb" },
  GCASH: { color: "#16a34a", bg: "#dcfce7" },
  MAYA: { color: "#2563eb", bg: "#dbeafe" },
  BPI: { color: "#f59e0b", bg: "#fef3c7" },
};
type Transaction = {
  id: string;
  merchant: string;
  amount: number;
  source: string;
  category?: string;
  subcategory?: string;
  created_at: string;
  transaction_time?: string;
  raw_text?: string;
};

type Section = {
  title: string;
  date: Date;
  data: (Transaction & { _time: Date })[];
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

/* ================= SCREEN ================= */
export default function TransactionsScreen() {
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Filter>("All");

  /* ================= DRAWER ================= */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

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

  /* ================= FETCH (FIXED) ================= */
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // IMPORTANT: always fetch FULL DATA for stable counts
      const res = await transactionService.getTransactions("All");

      console.log(res.data);
      setAllTransactions(res?.data || []);
    } catch (err) {
      console.log("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  /* ================= FILTERED DATA ================= */
  const transactions =
    activeTab === "All"
      ? allTransactions
      : allTransactions.filter((t) => t.source === activeTab);

  /* ================= GROUP BY DATE ================= */
  const groupByDate = (data: Transaction[]): Section[] => {
  const groups: Record<string, Section> = {};

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
    const date = new Date(item.transaction_time || item.created_at);
    const label = getLabel(date);

    if (!groups[label]) {
      groups[label] = {
        title: label,
        date,
        data: [],
      };
    }

    groups[label].data.push({
      ...item,
      _time: date,
    });
  });

  return Object.values(groups).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
};

  const groupedData = groupByDate(transactions);

  /* ================= STABLE COUNTS (FIXED) ================= */
  const getCounts = (data: any[]) => {
    const counts: Record<string, number> = {
      All: data.length,
      GCASH: 0,
      MAYA: 0,
      BPI: 0,
    };

    data.forEach((item) => {
      const src = item.source;
      if (counts[src] !== undefined) {
        counts[src]++;
      }
    });

    return counts;
  };

  const tabCounts = getCounts(allTransactions);

  /* ================= CARD ================= */
  const TransactionCard = ({ item }: any) => {
    const theme = sourceTheme[item.source] || sourceTheme.All;

    const date = new Date(item.transaction_time || item.created_at);

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const fullDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    //   Foramatted text
    const formatRawText = (text?: string) => {
      if (!text) return "";

      return text
        .replace(/\n+/g, " ") // replace new lines with space
        .replace(/\s+/g, " ") // collapse multiple spaces
        .trim();
    };

    return (
      <View className="bg-white rounded-2xl p-5 mb-3 border border-gray-100">
        {/* ================= TOP ================= */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-3">
            <Text className="text-gray-900 font-semibold text-base">
              {item.merchant}
            </Text>

            <Text className="text-gray-400 text-xs mt-1">
              {item.category || "Uncategorized"} •{" "}
              {item.subcategory || "No subcategory"}
            </Text>
          </View>

          <Text className="text-gray-900 font-bold text-base">
            ₱{Number(item.amount).toFixed(2)}
          </Text>
        </View>

        {/* ================= MIDDLE ================= */}
        <View className="flex-row justify-between items-center mt-3">
          {/* SOURCE BADGE */}
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: theme.bg }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: theme.color }}
            >
              {item.source}
            </Text>
          </View>

          <Text className="text-gray-400 text-xs">{time}</Text>
        </View>

        {/* ================= DETAILS SECTION ================= */}
        <View className="mt-3 pt-3 border-t border-gray-100">
          {/* DATE */}
          <Text className="text-gray-400 text-xs">{fullDate}</Text>

          {/* BALANCE */}
          {item.balance && (
            <Text className="text-gray-500 text-xs mt-1">
              Balance: ₱{Number(item.balance).toFixed(2)}
            </Text>
          )}

          {/* REFERENCE */}
          {item.reference && (
            <Text className="text-gray-500 text-xs mt-1">
              Ref: {item.reference}
            </Text>
          )}

          {/* RAW DEBUG (OPTIONAL BUT VERY USEFUL) */}
          {item.raw_text && (
            <Text
              className="text-gray-300 text-[10px] mt-2"
            //   numberOfLines={1}
            //   ellipsizeMode="tail"
            >
              {formatRawText(item.raw_text)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="px-6 pt-16 pb-4 flex-row justify-between items-center bg-green-600">
        <View className="flex-row items-center">
          <Image
            source={require("../../assets/images/icon.png")}
            className="w-10 h-10 mr-2 rounded-lg"
          />

          <View>
            <Text className="text-white text-2xl font-bold">NaviSync</Text>
            <Text className="text-gray-100 text-xs">Unified transactions</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={openDrawer}
          className="bg-white p-3 rounded-xl"
        >
          <Ionicons name="options-outline" size={18} color="green" />
        </TouchableOpacity>
      </View>

      {/* ================= LIST ================= */}
      <View className="flex-1 px-6 pt-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <SectionList<Transaction & { _time: Date }, Section>
            sections={groupedData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TransactionCard item={item} />}
            renderSectionHeader={({ section }) => (
              <View className="mb-3 mt-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-green-600 font-bold">
                    {section.title}
                  </Text>

                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-700 text-[10px] font-semibold">
                      {section.data.length} transactions
                    </Text>
                  </View>
                </View>
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
          <Animated.View
            style={{ opacity: backdropAnim }}
            className="absolute inset-0 bg-black/40"
          >
            <TouchableOpacity className="flex-1" onPress={closeDrawer} />
          </Animated.View>

          <Animated.View
            style={{ transform: [{ translateX: slideAnim }] }}
            className="absolute right-0 top-0 bottom-0 w-[75%] bg-white pt-16 px-6 rounded-l-3xl"
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-green-600 text-2xl font-bold">Filters</Text>

              <TouchableOpacity onPress={closeDrawer}>
                <Ionicons name="close" size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            {tabs.map((tab) => {
              const theme = sourceTheme[tab];
              const active = activeTab === tab;

              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => {
                    setActiveTab(tab);
                    closeDrawer();
                  }}
                  className="flex-row items-center justify-between py-4 px-3 rounded-2xl mb-2"
                  style={{
                    backgroundColor: active ? theme.bg : "#f9fafb",
                  }}
                >
                  <Text
                    className="font-semibold text-base"
                    style={{ color: active ? theme.color : "#374151" }}
                  >
                    {tab}
                  </Text>

                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: theme.color }}
                    >
                      {tabCounts[tab]}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </View>
      )}
    </View>
  );
}
