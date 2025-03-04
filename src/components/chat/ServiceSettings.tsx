
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIService } from "./types";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ServiceSettingsProps {
  services: AIService[];
  onToggleSettings: () => void;
  showSettings: boolean;
  onConnectService: (serviceName: AIService['name'], isConnected: boolean) => void;
}

export function ServiceSettings({ 
  services, 
  showSettings, 
  onToggleSettings,
  onConnectService
}: ServiceSettingsProps) {
  const { user } = useAuth();
  const { services: serviceConnections, isLoading, updateService } = useServices();
  const { toast } = useToast();

  const handleServiceConnect = async (serviceName: AIService['name']) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to connect services.",
        variant: "destructive"
      });
      return;
    }

    const currentConnection = serviceConnections?.find(
      (s) => s.service_name === serviceName
    );
    
    const newConnectionState = !(currentConnection?.is_connected);
    
    try {
      await updateService.mutateAsync({
        serviceName,
        isConnected: newConnectionState,
      });
      
      // Update the UI state in the parent component
      onConnectService(serviceName, newConnectionState);
    } catch (error) {
      console.error("Failed to update service connection:", error);
      toast({
        title: "Connection failed",
        description: "Could not update the service connection. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between w-full">
        <Button
          onClick={onToggleSettings}
          className="w-full flex items-center justify-center gap-2"
          variant="default"
        >
          <Settings className="h-4 w-4" />
          Integrations
        </Button>
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
                  <Button
                    key={service.name}
                    onClick={() => handleServiceConnect(service.name)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-md text-sm",
                      "transition-colors duration-200",
                      isConnected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                    variant={isConnected ? "default" : "secondary"}
                  >
                    <span className="flex items-center gap-2">
                      <span>{service.icon}</span>
                      {service.name}
                    </span>
                    <span className="text-xs">
                      {isConnected ? "Connected" : "Connect"}
                    </span>
                  </Button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
