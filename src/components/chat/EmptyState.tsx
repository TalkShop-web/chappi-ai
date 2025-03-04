
import { MessageSquare } from "lucide-react";

export function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Select a conversation to view details</p>
      </div>
    </div>
  );
}
