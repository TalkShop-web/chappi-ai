
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIService } from "./types";

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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Integrations
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
