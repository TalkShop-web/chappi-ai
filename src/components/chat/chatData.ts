
import { AIService, Chat } from "./types";

export const initialAIServices: AIService[] = [
  {
    name: "ChatGPT",
    isConnected: false,
    icon: "🤖"
  },
  {
    name: "Claude",
    isConnected: false,
    icon: "🧠"
  },
  {
    name: "Gemini",
    isConnected: false,
    icon: "✨"
  },
  {
    name: "Perplexity",
    isConnected: false,
    icon: "🔮"
  }
];

export const sampleChats: Chat[] = [
  {
    id: "1",
    title: "Understanding Quantum Computing",
    preview: "An in-depth discussion about quantum computing principles...",
    date: "2024-03-20",
    source: "ChatGPT",
    tags: ["Technology", "Physics"]
  },
  {
    id: "2", 
    title: "Creative Writing Tips",
    preview: "Exploring various techniques for creative writing...",
    date: "2024-03-19",
    source: "Claude",
    tags: ["Writing", "Creativity"]
  },
  {
    id: "3",
    title: "Machine Learning Basics",
    preview: "Introduction to fundamental concepts in ML...",
    date: "2024-03-18",
    source: "Gemini",
    tags: ["AI", "Technology"]
  }
];
