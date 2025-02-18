
import { MessageSquare, Tag, Plus } from "lucide-react";
import { Chat } from "./types";

interface ChatDetailProps {
  chat: Chat;
  onCreateNote: (topic: string, sourceChat: Chat) => void;
}

export function ChatDetail({ chat, onCreateNote }: ChatDetailProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold">{chat.title}</h1>
          <button
            onClick={() => onCreateNote(chat.tags[0], chat)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {chat.source}
          </span>
          <span className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            {chat.tags.join(", ")}
          </span>
        </div>
      </div>
      <div className="prose prose-sm max-w-none">
        <p>{chat.preview}</p>
      </div>
    </div>
  );
}
