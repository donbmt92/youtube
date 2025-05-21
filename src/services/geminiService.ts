/**
 * Gemini API Service
 * Manages communication with the Google Gemini API and maintains conversation history
 */

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationHistory {
  messages: ConversationMessage[];
  lastUpdated: Date;
}

// Store conversation histories by conversation ID
const conversationHistories: Record<string, ConversationHistory> = {};

/**
 * Send a prompt to Gemini API with conversation history
 * @param prompt The prompt to send
 * @param conversationId Optional conversation ID to maintain context
 * @returns The API response
 */
export const sendPromptWithHistory = async (
  prompt: string,
  conversationId?: string
): Promise<{ response: string }> => {
  try {
    // Generate a conversation ID if not provided
    const actualConversationId = conversationId || `conv_${Date.now()}`;
    
    // Get or create conversation history
    if (!conversationHistories[actualConversationId]) {
      conversationHistories[actualConversationId] = {
        messages: [],
        lastUpdated: new Date()
      };
    }
    
    const history = conversationHistories[actualConversationId];
    
    // Build the full prompt with conversation history
    let fullPrompt = prompt;
    
    if (history.messages.length > 0) {
      fullPrompt = `Lịch sử trò chuyện:\n${history.messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n\n')}\n\nPrompt hiện tại: ${prompt}`;
    }
    console.log(history.messages);
    console.log(fullPrompt);
    
    // Function to make API call with retry logic
    const makeApiCall = async (retryCount = 0): Promise<any> => {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fullPrompt
        }),
      });
      
      const data = await response.json();
      
      // If API call failed and we haven't exceeded retries
      if (data.error === "Failed to process with Gemini API") {
        console.log(`Retrying API call after failure (attempt ${retryCount + 1})`);
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        return makeApiCall(retryCount + 1);
      }
      
      return data;
    };
    
    // Make API call with retry logic
    const data = await makeApiCall();
    
    // Update conversation history
    history.messages.push({ role: 'user', content: prompt });
    
    if (data.response) {
      history.messages.push({ role: 'assistant', content: data.response });
    }
    
    history.lastUpdated = new Date();
    
    // We keep all messages until script completion
    
    return data;
  } catch (error) {
    console.error("Error sending prompt to Gemini API:", error);
    throw error;
  }
};

/**
 * Clear the conversation history for a specific conversation
 * @param conversationId The conversation ID to clear
 */
export const clearConversationHistory = (conversationId: string): void => {
  if (conversationHistories[conversationId]) {
    delete conversationHistories[conversationId];
  }
};

/**
 * Get all active conversation IDs
 * @returns Array of conversation IDs
 */
export const getActiveConversationIds = (): string[] => {
  return Object.keys(conversationHistories);
};

/**
 * Get conversation history for a specific conversation
 * @param conversationId The conversation ID
 * @returns The conversation history or null if not found
 */
export const getConversationHistory = (
  conversationId: string
): ConversationHistory | null => {
  return conversationHistories[conversationId] || null;
};
