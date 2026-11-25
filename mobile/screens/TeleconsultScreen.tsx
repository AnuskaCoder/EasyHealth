import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";

interface TeleconsultScreenProps {
  onEnd: () => void;
}

export const TeleconsultScreen: React.FC<TeleconsultScreenProps> = ({ onEnd }) => {
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  return (
    <View style={styles.container}>
      {/* Remote Video Stream (Doctor) */}
      <View style={styles.videoStream}>
        <Text style={styles.doctorAvatar}>👩‍⚕️</Text>
        <Text style={styles.doctorName}>Dr. Priya Sharma (Cardiologist)</Text>
        <Text style={styles.callDuration}>● 06:14 Live Telehealth</Text>

        {/* PIP Self View */}
        <View style={styles.selfPip}>
          <Text style={styles.pipText}>{videoOn ? "👤 You" : "📷 Off"}</Text>
        </View>
      </View>

      {/* Control Actions */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={[styles.controlBtn, !micOn && styles.btnOff]}
          onPress={() => setMicOn(!micOn)}
        >
          <Text style={styles.btnIcon}>{micOn ? "🎙️" : "🔇"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, !videoOn && styles.btnOff]}
          onPress={() => setVideoOn(!videoOn)}
        >
          <Text style={styles.btnIcon}>{videoOn ? "📹" : "🚫"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endCallBtn} onPress={onEnd}>
          <Text style={styles.endCallText}>End Consult</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  videoStream: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  doctorAvatar: { fontSize: 72, marginBottom: 12 },
  doctorName: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  callDuration: { color: "#4ade80", fontSize: 12, marginTop: 4 },
  selfPip: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 80,
    height: 100,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  pipText: { color: "#ffffff", fontSize: 12 },
  controlsBar: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    padding: 18,
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  btnOff: { backgroundColor: "#dc2626" },
  btnIcon: { fontSize: 18 },
  endCallBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  endCallText: { color: "#ffffff", fontWeight: "bold", fontSize: 13 },
});
