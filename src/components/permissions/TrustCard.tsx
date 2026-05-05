import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

export function TrustCard({ icon, title, description }: Props) {
  return (
    <View className="bg-green-50 border border-green-100 rounded-2xl p-4 flex-row items-start mb-3">
      <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
        <Ionicons name={icon} size={20} color="#16A34A" />
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-gray-900 font-semibold text-sm">
          {title}
        </Text>
        <Text className="text-gray-600 text-sm mt-1 leading-5">
          {description}
        </Text>
      </View>
    </View>
  );
}