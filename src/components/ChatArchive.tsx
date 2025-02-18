import { useState, useMemo } from "react";
import { Search, MessageSquare, Tag, ChevronRight, ChevronDown, FolderOpen, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Chat {
  id: string;
  title: string;
  preview: string;
  date: string;
  source: "ChatGPT" | "Claude" | "Gemini";
  tags: string[];
}

interface TopicFolder {
  name: string;
  chats: Chat[];
  summary: string;
}

interface AIService {
  name: "ChatGPT" | "Claude" | "Gemini";
  isConnected: boolean;
  icon: string;
}

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
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="ml-2 p-2 rounded-lg hover:bg-accent"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {showSettings && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-3">Connected Services</h3>
              <div className="space-y-2">
                {services.map((service) => (
                  <button
                    key={service.name}
                    onClick={() => handleConnectService(service.name)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-md text-sm",
                      "transition-colors duration-200",
                      service.isConnected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{service.icon}</span>
                      {service.name}
                    </span>
                    <span className="text-xs">
                      {service.isConnected ? "Connected" : "Connect"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {filteredFolders.map((folder) => (
            <div key={folder.name} className="mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFolder(folder.name)}
                  className="flex-1 flex items-center gap-2 p-2 rounded-lg hover:bg-accent text-sm font-medium"
                >
                  {expandedFolders.has(folder.name) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <FolderOpen className="h-4 w-4" />
                  <span>{folder.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {folder.chats.length}
                  </span>
                </button>
                <button
                  onClick={() => handleCreateNewNote(folder.name)}
                  className="p-2 rounded-lg hover:bg-accent"
                  title={`Create new note about ${folder.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {expandedFolders.has(folder.name) && (
                <div className="ml-6 mt-2 space-y-2">
                  <p className="text-xs text-muted-foreground px-2">{folder.summary}</p>
                  {folder.chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all duration-200",
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
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6">
        {selectedChat ? (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-semibold">{selectedChat.title}</h1>
                <button
                  onClick={() => handleCreateNewNote(selectedChat.tags[0], selectedChat)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Note</span>
                </button>
              </div>
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
