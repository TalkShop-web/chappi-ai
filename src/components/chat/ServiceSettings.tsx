
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface AIService {
  name: "ChatGPT" | "Claude" | "Gemini";
  isConnected: boolean;
  icon: string;
}

interface ServiceSettingsProps {
  services: AIService[];
  onServiceConnect: (serviceName: AIService["name"]) => void;
  showSettings: boolean;
  onToggleSettings: () => void;
}

export function ServiceSettings({ 
  services, 
  onServiceConnect, 
  showSettings, 
  onToggleSettings 
}: ServiceSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onToggleSettings}
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
                onClick={() => onServiceConnect(service.name)}
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
  );
}
