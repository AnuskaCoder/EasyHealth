import React, { useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { HomeScreen } from "./screens/HomeScreen";
import { TeleconsultScreen } from "./screens/TeleconsultScreen";
import { ChatbotScreen } from "./screens/ChatbotScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "teleconsult" | "chat">("home");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={styles.headerTitle}>EasyHealth Mobile</Text>
        </View>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>● 24×7 Active</Text>
        </View>
      </View>

      {/* Main Screen Content */}
      <View style={styles.screenContainer}>
        {activeTab === "home" && <HomeScreen onStartTeleconsult={() => setActiveTab("teleconsult")} />}
        {activeTab === "teleconsult" && <TeleconsultScreen onEnd={() => setActiveTab("home")} />}
        {activeTab === "chat" && <ChatbotScreen />}
      </View>

      {/* Bottom Tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "home" && styles.tabActive]}
          onPress={() => setActiveTab("home")}
        >
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === "home" && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "teleconsult" && styles.tabActive]}
          onPress={() => setActiveTab("teleconsult")}
        >
          <Text style={styles.tabIcon}>📹</Text>
          <Text style={[styles.tabLabel, activeTab === "teleconsult" && styles.tabLabelActive]}>Consult</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "chat" && styles.tabActive]}
          onPress={() => setActiveTab("chat")}
        >
          <Text style={styles.tabIcon}>🤖</Text>
          <Text style={[styles.tabLabel, activeTab === "chat" && styles.tabLabelActive]}>AI Assistant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 6,
    borderRadius: 8,
  },
  logoIcon: {
    fontSize: 14,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  liveBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    color: "#4ade80",
    fontSize: 10,
    fontWeight: "600",
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: "#2563eb",
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#2563eb",
    fontWeight: "bold",
  },
});
