
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { SidebarContent } from "./chat/SidebarContent";
import { ChatDetail } from "./chat/ChatDetail";
import { EmptyState } from "./chat/EmptyState";
import { Chat, AIService } from "./chat/types";
import { useServices } from "@/hooks/useServices";
import { useFolders } from "@/hooks/useFolders";
import { initialAIServices, sampleChats } from "./chat/chatData";

export function ChatArchive() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [services, setServices] = useState<AIService[]>(initialAIServices);
  const { toast } = useToast();
  const { services: serviceConnections, isLoading } = useServices();
  const { filteredFolders } = useFolders(sampleChats, searchQuery);

  // Sync services with connections from the useServices hook
  useEffect(() => {
    if (!isLoading && serviceConnections) {
      setServices(prev => 
        prev.map(service => {
          const connection = serviceConnections.find(
            sc => sc.service_name === service.name
          );
          return {
            ...service,
            isConnected: connection?.is_connected || false
          };
        })
      );
    }
  }, [serviceConnections, isLoading]);

  const handleConnectService = (serviceName: AIService["name"], isConnected: boolean) => {
    // Update local UI state
    setServices(prev =>
      prev.map(service =>
        service.name === serviceName
          ? { ...service, isConnected }
          : service
      )
    );

    toast({
      title: "Service connection updated",
      description: `${serviceName} has been ${isConnected ? 'connected' : 'disconnected'}.`,
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
    <div className="flex bg-background">
      <SidebarContent
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        services={services}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onConnectService={handleConnectService}
        filteredFolders={filteredFolders}
        expandedFolders={expandedFolders}
        onToggleFolder={toggleFolder}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        onCreateNote={handleCreateNewNote}
      />

      <div className="flex-1 p-6">
        {selectedChat ? (
          <ChatDetail
            chat={selectedChat}
            onCreateNote={handleCreateNewNote}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
