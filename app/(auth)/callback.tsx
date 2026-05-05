import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  Animated,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [message, setMessage] = useState("Connecting Gmail...");

  const pulse = useRef(new Animated.Value(1)).current;

  /* ================= PULSE ================= */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  /* ================= DOT ANIMATION ================= */
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      );

    animate(dot1, 0).start();
    animate(dot2, 150).start();
    animate(dot3, 300).start();
  }, []);

  /* ================= FLOW ================= */
  useEffect(() => {
    const handle = async () => {
      console.log("CALLBACK PARAMS:", params);

      setTimeout(() => setMessage("Securing connection..."), 800);
      setTimeout(() => setMessage("Syncing inbox..."), 1600);

      await new Promise((r) => setTimeout(r, 2500));

      router.replace("/(tabs)");
    };

    handle();
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <StatusBar barStyle="light-content" />

      {/* BACKGROUND GLOW */}
      <View className="absolute -top-20 -right-20 w-72 h-72 bg-green-200 rounded-full opacity-40" />
      <View className="absolute top-40 -left-24 w-64 h-64 bg-green-300 rounded-full opacity-30" />
      <View className="absolute -bottom-10 -right-20 w-72 h-72 bg-green-200 rounded-full opacity-40" />

      {/* CONTENT */}
      <View className="items-center w-full">
        {/* ICON */}
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Image
            source={require("@/assets/images/icon-transparent.png")}
            className="w-96 h-96"
            resizeMode="contain"
          />
        </Animated.View>

        {/* LOADER CARD */}
        <View className="-mt-28 px-6 py-5 rounded-2xl w-full items-center">
          {/* <ActivityIndicator size="large" color="#22C55E" /> */}

          <Text className="text-green-700 text-center font-medium text-base mt-3">
            {message}
          </Text>
        </View>

        {/* ANIMATED DOTS (same design, now moving) */}
        <View className="flex-row gap-2 mt-2">
          <Animated.View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#22C55E",
              opacity: dot1,
            }}
          />
          <Animated.View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#22C55E",
              opacity: dot2,
            }}
          />
          <Animated.View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#22C55E",
              opacity: dot3,
            }}
          />
        </View>
      </View>
    </View>
  );
}