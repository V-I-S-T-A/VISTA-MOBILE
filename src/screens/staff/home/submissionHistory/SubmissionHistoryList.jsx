import { View, Text, TouchableOpacity } from "react-native";

const historyData = [
  {
    id: 1,
    title: "SITE: Annual Activity...",
    line1: "angelo.SITE@gmail.com",
    line2: "29 JAN 2026",
    logoText: "SITE",
    logoColor: "#1a5b82",
    status: "Pending"
  },
  {
    id: 2,
    title: "GDG-OC: Annual Act...",
    line1: "Angelo Binonggo",
    line2: "angelo.SITE@gmail.com",
    logoText: "GDG",
    logoColor: "#ea4335",
    status: "Under Review"
  },
  {
    id: 3,
    title: "UCS: Annual Activity...",
    line1: "Angelo Binonggo",
    line2: "angelo.SITE@gmail.com",
    logoText: "UCS",
    logoColor: "#000000",
    status: "Approved"
  },
  {
    id: 4,
    title: "USG: Annual Activity...",
    line1: "Angelo Binonggo",
    line2: "angelo.SITE@gmail.com",
    logoText: "USG",
    logoColor: "#fbbc05",
    status: "Rejected"
  },
  {
    id: 5,
    title: "GDG-OC: Annual Act...",
    line1: "Angelo Binonggo",
    line2: "angelo.SITE@gmail.com",
    logoText: "GDG",
    logoColor: "#ea4335",
    status: "Resubmission Required"
  },
  {
    id: 6,
    title: "SITE: Annual Activity...",
    line1: "Angelo Binonggo",
    line2: "angelo.SITE@gmail.com",
    logoText: "SITE",
    logoColor: "#1a5b82",
    status: "Pending"
  }
];

function LogoPlaceholder({ text, color }) {
  return (
    <View 
      className="w-14 h-14 rounded-full items-center justify-center mr-4" 
      style={{ backgroundColor: color + '15' }}
    >
      <Text className="font-extrabold text-[13px]" style={{ color: color }}>{text}</Text>
    </View>
  );
}

export default function SubmissionHistoryList({ searchQuery = "", statusFilter = "All Status" }) {
  const filteredData = historyData.filter(item => {
    // Search match
    const query = searchQuery.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(query) || 
                          item.line1.toLowerCase().includes(query) || 
                          item.line2.toLowerCase().includes(query);
                          
    // Status match
    const matchesStatus = statusFilter === "All Status" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (filteredData.length === 0) {
    return (
      <View className="py-10 items-center justify-center">
        <Text className="text-gray-500 font-medium">No submissions found.</Text>
      </View>
    );
  }

  return (
    <View className="mb-2">
      {filteredData.map((item) => (
        <View key={item.id} className="bg-white rounded-3xl p-5 mb-4 flex-row items-center shadow-sm">
          <LogoPlaceholder text={item.logoText} color={item.logoColor} />
          
          <View className="flex-1 justify-center">
            <Text className="text-vistaNavy font-bold text-[15px] mb-1">
              {item.title}
            </Text>
            <Text className="text-gray-500 text-[11px] mb-1">{item.line1}</Text>
            
            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-gray-500 text-[11px] font-medium">{item.line2}</Text>
              <TouchableOpacity>
                <Text className="text-[#3b82f6] text-[11px] font-semibold">View details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
