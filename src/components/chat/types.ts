
export interface Chat {
  id: string;
  title: string;
  preview: string;
  date: string;
  source: "ChatGPT" | "Claude" | "Gemini" | "Perplexity";
  tags: string[];
}

export interface TopicFolder {
  name: string;
  chats: Chat[];
  summary: string;
}

export interface AIService {
  name: "ChatGPT" | "Claude" | "Gemini" | "Perplexity";
  isConnected: boolean;
  icon: string;
}
