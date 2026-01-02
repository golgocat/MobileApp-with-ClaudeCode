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
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChat } from "../../hooks/useChat";
import { DayContext, ChatMessage } from "../../services/gemini/chatService";

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
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
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
                  <ActivityIndicator size="small" color="#60a5fa" />
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
            placeholderTextColor="rgba(255,255,255,0.4)"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e3a5f",
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.6)",
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
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  suggestionsContainer: {
    width: "100%",
  },
  suggestionsTitle: {
    color: "rgba(255,255,255,0.5)",
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
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  suggestionText: {
    color: "#60a5fa",
    fontSize: 13,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#3b82f6",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: "white",
  },
  assistantText: {
    color: "rgba(255,255,255,0.9)",
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    gap: 8,
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 16,
    color: "white",
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
  },
  sendButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});
