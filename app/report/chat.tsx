import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useChat } from "../../hooks/useChat";
import { DayContext, ChatMessage } from "../../services/gemini/chatService";
import { COLORS, GRADIENTS, SHADOWS } from "../../constants/theme";

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          isUser ? styles.userText : styles.assistantText,
        ]}
      >
        {message.content}
      </Text>
    </View>
  );
}

function SuggestedQuestions({
  onSelect,
}: {
  onSelect: (question: string) => void;
}) {
  const questions = [
    "What activities are good for this weather?",
    "Should I bring an umbrella?",
    "Is it safe to go to the beach?",
    "What should I pack for this day?",
  ];

  return (
    <View style={styles.suggestionsContainer}>
      <Text style={styles.suggestionsTitle}>Suggested questions:</Text>
      <View style={styles.suggestionsRow}>
        {questions.map((q, i) => (
          <Pressable
            key={i}
            style={styles.suggestionButton}
            onPress={() => onSelect(q)}
          >
            <Text style={styles.suggestionText}>{q}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    date: string;
    destination: string;
    riskLevel: string;
    advice: string;
    rationale: string;
    forecastJson: string;
  }>();

  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  // Parse forecast from params
  let forecast = null;
  try {
    if (params.forecastJson) {
      forecast = JSON.parse(params.forecastJson);
    }
  } catch (e) {
    console.warn("Failed to parse forecast:", e);
  }

  const context: DayContext = {
    date: params.date || "",
    destination: params.destination || "",
    riskLevel: params.riskLevel || "",
    advice: params.advice || "",
    rationale: params.rationale || "",
    forecast,
  };

  const { messages, isLoading, error, sendMessage } = useChat(context);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const handleSuggestion = async (question: string) => {
    await sendMessage(question);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        {/* Header Info */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{params.destination}</Text>
          <Text style={styles.headerSubtitle}>{params.date}</Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Ask about this day</Text>
              <Text style={styles.emptySubtitle}>
                Get personalized advice about activities, packing, and more
              </Text>
              <SuggestedQuestions onSelect={handleSuggestion} />
            </View>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color={COLORS.accentBlue} />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask a question..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            editable={!isLoading}
          />
          <Pressable
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  suggestionsContainer: {
    width: "100%",
  },
  suggestionsTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: COLORS.glassBackground,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.cardSmall,
  },
  suggestionText: {
    color: COLORS.accentBlue,
    fontSize: 13,
    fontWeight: "500",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.accentBlue,
    borderBottomRightRadius: 4,
    ...SHADOWS.cardSmall,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.glassBackground,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    borderBottomLeftRadius: 4,
    ...SHADOWS.cardSmall,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "white",
  },
  assistantText: {
    color: COLORS.textPrimary,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.glassBackground,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    padding: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    gap: 8,
    ...SHADOWS.cardSmall,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.glassBackground,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 16,
    color: COLORS.textPrimary,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentBlue,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.cardSmall,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(74, 144, 217, 0.4)",
  },
  sendButtonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
});
