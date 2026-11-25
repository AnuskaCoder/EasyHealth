import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";

export const ChatbotScreen: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "bot",
      text: "Hello! I am your EasyHealth AI Clinical Companion grounded in WHO & AHA guidelines. How can I help with your reports or health questions today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now().toString(), sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Based on your latest CBC report, your Hemoglobin is 11.4 g/dL (mild iron-deficiency anemia). Combining dietary iron with Vitamin C and continuing your Ferrous Sulphate dosage is advised.",
        },
      ]);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Sources badge */}
      <View style={styles.topBadge}>
        <Text style={styles.badgeText}>🛡️ Grounded in WHO &amp; AHA Clinical Guidelines</Text>
      </View>

      <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.msgBubble,
              m.sender === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text
              style={[
                styles.msgText,
                m.sender === "user" ? styles.userText : styles.botText,
              ]}
            >
              {m.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask clinical question..."
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  topBadge: {
    backgroundColor: "#dbeafe",
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
  },
  badgeText: { color: "#1e40af", fontSize: 11, fontWeight: "bold" },
  chatArea: { flex: 1 },
  chatContent: { padding: 14, gap: 10 },
  msgBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "85%",
  },
  userBubble: {
    backgroundColor: "#2563eb",
    alignSelf: "flex-end",
    borderBottomRightRadius: 2,
  },
  botBubble: {
    backgroundColor: "#ffffff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  msgText: { fontSize: 12, lineHeight: 18 },
  userText: { color: "#ffffff" },
  botText: { color: "#1e293b" },
  inputBar: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12,
    color: "#0f172a",
  },
  sendBtn: {
    backgroundColor: "#2563eb",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { color: "#ffffff", fontSize: 14 },
});
