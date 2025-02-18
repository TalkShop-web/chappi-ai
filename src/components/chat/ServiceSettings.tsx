
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIService } from "./types";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceSettingsProps {
  services: AIService[];
  onToggleSettings: () => void;
  showSettings: boolean;
}

export function ServiceSettings({ 
  services, 
  showSettings, 
  onToggleSettings 
}: ServiceSettingsProps) {
  const { user } = useAuth();
  const { services: serviceConnections, isLoading, updateService } = useServices();

  const handleServiceConnect = async (serviceName: AIService['name']) => {
    if (!user) {
      // You might want to show the auth modal here
      return;
    }

    const currentConnection = serviceConnections?.find(
      (s) => s.service_name === serviceName
    );

    await updateService.mutateAsync({
      serviceName,
      isConnected: !(currentConnection?.is_connected),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between w-full">
        <button
          onClick={onToggleSettings}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Integrations
        </button>
      </div>

      {showSettings && (
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="text-sm font-medium mb-3">Connected Services</h3>
          <div className="space-y-2">
            {isLoading ? (
              // Show skeletons while loading
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              services.map((service) => {
                const connection = serviceConnections?.find(
                  (s) => s.service_name === service.name
                );
                const isConnected = connection?.is_connected || false;

                return (
                  <button
                    key={service.name}
                    onClick={() => handleServiceConnect(service.name)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-md text-sm",
                      "transition-colors duration-200",
                      isConnected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{service.icon}</span>
                      {service.name}
                    </span>
                    <span className="text-xs">
                      {isConnected ? "Connected" : "Connect"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
