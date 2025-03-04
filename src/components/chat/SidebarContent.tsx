
import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { ServiceSettings } from "./ServiceSettings";
import { FolderView } from "./FolderView";
import { Chat, AIService, TopicFolder } from "./types";

interface SidebarContentProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  services: AIService[];
  showSettings: boolean;
  onToggleSettings: () => void;
  onConnectService: (serviceName: AIService["name"], isConnected: boolean) => void;
  filteredFolders: TopicFolder[];
  expandedFolders: Set<string>;
  onToggleFolder: (folderName: string) => void;
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onCreateNote: (topic: string, sourceChat?: Chat) => void;
}

export function SidebarContent({
  searchQuery,
  onSearchChange,
  services,
  showSettings,
  onToggleSettings,
  onConnectService,
  filteredFolders,
  expandedFolders,
  onToggleFolder,
  selectedChat,
  onSelectChat,
  onCreateNote
}: SidebarContentProps) {
  return (
    <div className="w-80 border-r border-border bg-card p-4 flex flex-col">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col space-y-4">
          <SearchBar 
            searchQuery={searchQuery} 
            onSearchChange={onSearchChange} 
          />
          <ServiceSettings
            services={services}
            showSettings={showSettings}
            onToggleSettings={onToggleSettings}
            onConnectService={onConnectService}
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
            onToggleFolder={onToggleFolder}
            onSelectChat={onSelectChat}
            onCreateNote={onCreateNote}
          />
        ))}
      </div>
    </div>
  );
}
