
import { ChevronRight, ChevronDown, FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chat } from "./types";

interface FolderViewProps {
  folder: {
    name: string;
    chats: Chat[];
    summary: string;
  };
  isExpanded: boolean;
  selectedChat: Chat | null;
  onToggleFolder: (name: string) => void;
  onSelectChat: (chat: Chat) => void;
  onCreateNote: (topic: string) => void;
}

export function FolderView({
  folder,
  isExpanded,
  selectedChat,
  onToggleFolder,
  onSelectChat,
  onCreateNote
}: FolderViewProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleFolder(folder.name)}
          className="flex-1 flex items-center gap-2 p-2 rounded-lg hover:bg-accent text-sm font-medium"
        >
          {isExpanded ? (
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
          onClick={() => onCreateNote(folder.name)}
          className="p-2 rounded-lg hover:bg-accent"
          title={`Create new note about ${folder.name}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      
      {isExpanded && (
        <div className="ml-6 mt-2 space-y-2">
          <p className="text-xs text-muted-foreground px-2">{folder.summary}</p>
          {folder.chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
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
  );
}
