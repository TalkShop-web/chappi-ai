
import { useMemo } from "react";
import { Chat, TopicFolder } from "@/components/chat/types";

export function useFolders(chats: Chat[], searchQuery: string) {
  const topicFolders = useMemo(() => {
    const folders: Record<string, TopicFolder> = {};
    
    chats.forEach(chat => {
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
  }, [chats]);

  const filteredFolders = useMemo(() => 
    topicFolders.filter(folder =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.chats.some(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ), [topicFolders, searchQuery]
  );

  return { topicFolders, filteredFolders };
}
