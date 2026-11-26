import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { processClinicalQuery } from "../../src/services/clinicalAiEngine";

type ChatEntry = { id: string; sender: "bot" | "user"; text: string };

const mobileGuestContext = {
  profile: {
    id: "mobile-guest",
    name: "",
    age: 0,
    gender: "Other" as const,
    dob: "",
    phone: "",
    email: "",
    bloodGroup: "",
    height: 0,
    weight: 0,
    allergies: [],
    chronicConditions: [],
    emergencyContact: "",
  },
  reports: [],
  medications: [],
};

export const ChatbotScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hello! I can help with common health questions and explain general next steps. Your mobile health records are not connected here, and I can't diagnose or replace a clinician. What would you like help with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    const query = input.trim();
    if (!query || loading) return;
    const userMsg: ChatEntry = { id: Date.now().toString(), sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const isHealthSummary = /health summary|my health|overall health|health status/i.test(query);
      const answer = isHealthSummary
        ? "Your health profile and reports are not connected to this mobile demo, so I can't generate a personal health summary. Please use the web app's Medical Records and Profile pages or speak with your clinician."
        : processClinicalQuery(query, mobileGuestContext).answer;
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: answer,
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Sources badge */}
      <View style={styles.topBadge}>
        <Text style={styles.badgeText}>General information only · Not a diagnosis</Text>
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
        {loading && <Text style={styles.typingText}>Reviewing your question…</Text>}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask clinical question..."
          placeholderTextColor="#94a3b8"
          editable={!loading}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={[styles.sendBtn, loading && styles.sendBtnDisabled]} onPress={handleSend} disabled={loading}>
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
  sendBtnDisabled: { opacity: 0.5 },
  typingText: { color: "#64748b", fontSize: 12, fontStyle: "italic" },
});
