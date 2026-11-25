import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";

interface HomeScreenProps {
  onStartTeleconsult: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartTeleconsult }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroSub}>Good morning,</Text>
        <Text style={styles.heroName}>Ananya Krishnan 👋</Text>
        <Text style={styles.heroInfo}>Blood: B+ • 28 yrs • Mild Asthma</Text>

        <View style={styles.upcomingBox}>
          <View>
            <Text style={styles.upcomingLabel}>Next Consultation Today</Text>
            <Text style={styles.upcomingDoctor}>Dr. Priya Sharma (Cardiologist)</Text>
            <Text style={styles.upcomingTime}>⏰ 11:30 AM • Video Telehealth</Text>
          </View>
          <TouchableOpacity style={styles.joinBtn} onPress={onStartTeleconsult}>
            <Text style={styles.joinBtnText}>Join Video</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions Grid */}
      <Text style={styles.sectionTitle}>Healthcare Quick Actions</Text>
      <View style={styles.grid}>
        {[
          { label: "Book Doctor", icon: "🩺", color: "#dbeafe" },
          { label: "Lab Checkup", icon: "🧪", color: "#f3e8ff" },
          { label: "Buy Medicine", icon: "💊", color: "#dcfce7" },
          { label: "Symptom AI", icon: "❤️", color: "#ccfbf1" },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={[styles.gridCard, { backgroundColor: item.color }]}>
            <Text style={styles.gridIcon}>{item.icon}</Text>
            <Text style={styles.gridLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Vitals Overview */}
      <Text style={styles.sectionTitle}>Live Biometrics</Text>
      <View style={styles.vitalsRow}>
        <View style={styles.vitalCard}>
          <Text style={styles.vitalTitle}>Heart Rate</Text>
          <Text style={styles.vitalValue}>78 bpm</Text>
          <Text style={styles.vitalStatus}>Normal</Text>
        </View>
        <View style={styles.vitalCard}>
          <Text style={styles.vitalTitle}>Blood Pressure</Text>
          <Text style={styles.vitalValue}>118/76</Text>
          <Text style={styles.vitalStatus}>Optimal</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16 },
  heroCard: {
    backgroundColor: "#2563eb",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  heroSub: { color: "#bfdbfe", fontSize: 12 },
  heroName: { color: "#ffffff", fontSize: 22, fontWeight: "bold", marginTop: 2 },
  heroInfo: { color: "#dbeafe", fontSize: 11, marginTop: 4 },
  upcomingBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upcomingLabel: { color: "#fde047", fontSize: 10, fontWeight: "bold" },
  upcomingDoctor: { color: "#ffffff", fontSize: 13, fontWeight: "bold", marginTop: 1 },
  upcomingTime: { color: "#e0e7ff", fontSize: 11, marginTop: 2 },
  joinBtn: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  joinBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#334155", marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  gridCard: {
    width: "48%",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  gridIcon: { fontSize: 24, marginBottom: 6 },
  gridLabel: { fontSize: 12, fontWeight: "bold", color: "#0f172a" },
  vitalsRow: { flexDirection: "row", gap: 10 },
  vitalCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  vitalTitle: { fontSize: 11, color: "#64748b" },
  vitalValue: { fontSize: 18, fontWeight: "bold", color: "#0f172a", marginTop: 4 },
  vitalStatus: { fontSize: 10, color: "#16a34a", fontWeight: "600", marginTop: 2 },
});
