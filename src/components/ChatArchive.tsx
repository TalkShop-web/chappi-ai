
import { useState } from "react";
import { Search, MessageSquare, Tag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  preview: string;
  date: string;
  source: "ChatGPT" | "Claude" | "Gemini";
  tags: string[];
}

const sampleChats: Chat[] = [
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

export function ChatArchive() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = sampleChats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-card p-4 flex flex-col">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200",
                "hover:bg-accent",
                selectedChat?.id === chat.id ? "bg-accent" : "bg-card"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-sm">{chat.title}</h3>
                <span className="text-xs text-muted-foreground">{chat.source}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{chat.preview}</p>
              <div className="flex gap-2 mt-2">
                {chat.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {selectedChat ? (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-2">{selectedChat.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {selectedChat.source}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {selectedChat.tags.join(", ")}
                </span>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <p>{selectedChat.preview}</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
