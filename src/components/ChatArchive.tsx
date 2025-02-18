import { useState, useMemo } from "react";
import { Search, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ServiceSettings } from "./chat/ServiceSettings";
import { FolderView } from "./chat/FolderView";
import { ChatDetail } from "./chat/ChatDetail";
import { Chat, AIService } from "./chat/types";

const aiServices: AIService[] = [
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
  }
];

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
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [services, setServices] = useState<AIService[]>(aiServices);
  const { toast } = useToast();

  const topicFolders = useMemo(() => {
    const folders: Record<string, TopicFolder> = {};
    
    sampleChats.forEach(chat => {
      chat.tags.forEach(tag => {
        if (!folders[tag]) {
          folders[tag] = {
            name: tag,
            chats: [],
            summary: `A collection of conversations about ${tag.toLowerCase()}`
          };
        }
        folders[tag].chats.push(chat);
      });
    });

    return Object.values(folders);
  }, []);

  const filteredFolders = topicFolders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.chats.some(chat => 
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleConnectService = (serviceName: AIService["name"]) => {
    setServices(prev =>
      prev.map(service =>
        service.name === serviceName
          ? { ...service, isConnected: !service.isConnected }
          : service
      )
    );

    toast({
      title: "Service connection updated",
      description: `${serviceName} has been ${services.find(s => s.name === serviceName)?.isConnected ? 'disconnected' : 'connected'}.`,
    });
  };

  const handleCreateNewNote = (topic: string, sourceChat?: Chat) => {
    if (!services.some(service => service.isConnected)) {
      toast({
        title: "No AI services connected",
        description: "Please connect at least one AI service to create new notes.",
        variant: "destructive"
      });
      setShowSettings(true);
      return;
    }

    toast({
      title: "Creating new note",
      description: `Expanding on ${topic}${sourceChat ? ` based on "${sourceChat.title}"` : ''}`,
    });
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderName)) {
        next.delete(folderName);
      } else {
        next.add(folderName);
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 border-r border-border bg-card p-4 flex flex-col">
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ServiceSettings
              services={services}
              onServiceConnect={handleConnectService}
              showSettings={showSettings}
              onToggleSettings={() => setShowSettings(!showSettings)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredFolders.map((folder) => (
            <FolderView
              key={folder.name}
              folder={folder}
              isExpanded={expandedFolders.has(folder.name)}
              selectedChat={selectedChat}
              onToggleFolder={toggleFolder}
              onSelectChat={setSelectedChat}
              onCreateNote={handleCreateNewNote}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 p-6">
        {selectedChat ? (
          <ChatDetail
            chat={selectedChat}
            onCreateNote={handleCreateNewNote}
          />
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
