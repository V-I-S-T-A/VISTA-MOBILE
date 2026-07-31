import { View, Text, TouchableOpacity } from "react-native";

const submissions = [
  {
    id: 1,
    title: "SITE: Annual Activity...",
    subtitle: "angelo.SITE@gmail.com",
    bottomLeft: "29 JAN 2026",
    logoText: "SITE",
    logoColor: "#1a5b82"
  },
  {
    id: 2,
    title: "GDG-OC: Annual Act...",
    subtitle: "Angelo Binonggo",
    bottomLeft: "angelo.SITE@gmail.com",
    logoText: "GDG",
    logoColor: "#ea4335"
  },
  {
    id: 3,
    title: "UCS: Annual Activity...",
    subtitle: "Angelo Binonggo",
    bottomLeft: "angelo.SITE@gmail.com",
    logoText: "UCS",
    logoColor: "#000000"
  },
  {
    id: 4,
    title: "USG: Annual Activity...",
    subtitle: "Angelo Binonggo",
    bottomLeft: "angelo.SITE@gmail.com",
    logoText: "USG",
    logoColor: "#fbbc05"
  },
  {
    id: 5,
    title: "GDG-OC: Annual Act...",
    subtitle: "Angelo Binonggo",
    bottomLeft: "angelo.SITE@gmail.com",
    logoText: "GDG",
    logoColor: "#ea4335"
  },
  {
    id: 6,
    title: "SITE: Annual Activity...",
    subtitle: "Angelo Binonggo",
    bottomLeft: "angelo.SITE@gmail.com",
    logoText: "SITE",
    logoColor: "#1a5b82"
  }
];

function LogoPlaceholder({ text, color }) {
  return (
    <View 
      className="w-[60px] h-[60px] rounded-full items-center justify-center mr-4" 
      style={{ backgroundColor: color + '15' }}
    >
      <Text className="font-extrabold text-sm" style={{ color: color }}>{text}</Text>
    </View>
  );
}

export default function StaffReviewList() {
  return (
    <View className="mb-4">
      {submissions.map((item) => (
        <View key={item.id} className="bg-white rounded-3xl p-5 mb-4 flex-row items-center">
          <LogoPlaceholder text={item.logoText} color={item.logoColor} />
          
          <View className="flex-1 justify-center">
            <Text className="text-vistaNavy font-bold text-[15px] mb-1">
              {item.title}
            </Text>
            <Text className="text-gray-500 text-xs mb-3">{item.subtitle}</Text>
            
            <View className="flex-row justify-between items-center mt-1">
              <Text className="text-gray-500 text-xs font-medium">{item.bottomLeft}</Text>
              <TouchableOpacity>
                <Text className="text-[#3b82f6] text-xs font-semibold">View details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
