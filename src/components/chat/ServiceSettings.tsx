
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIService } from "./types";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

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
  const { services: serviceConnections, isLoading, updateService, initiateAuthFlow } = useServices();
  const { toast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = useState<string | null>(null);

  const handleServiceConnect = async (serviceName: AIService['name']) => {
    // If already authenticating another service, prevent multiple windows
    if (isAuthenticating) return;
    
    const currentConnection = serviceConnections?.find(
      (s) => s.service_name === serviceName
    );
    
    const isCurrentlyConnected = currentConnection?.is_connected || false;

    // If already connected, we'll disconnect
    if (isCurrentlyConnected) {
      try {
        await updateService.mutateAsync({
          serviceName,
          isConnected: false,
        });
        
        // Update the UI state in the parent component
        onConnectService(serviceName, false);
      } catch (error) {
        console.error("Failed to update service connection:", error);
        toast({
          title: "Connection failed",
          description: "Could not update the service connection. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      // For connecting services, we'll open the auth window directly
      try {
        setIsAuthenticating(serviceName);
        
        // Open the auth window directly, regardless of user authentication
        await initiateAuthFlow(serviceName);
        
        // Only update database if user is logged in
        if (user) {
          await updateService.mutateAsync({
            serviceName,
            isConnected: true,
          });
        }
        
        // Update the UI state in the parent component
        onConnectService(serviceName, true);
        
        toast({
          title: "Service Connected",
          description: `Successfully connected to ${serviceName}.`
        });
      } catch (error) {
        console.error("Failed to connect service:", error);
        toast({
          title: "Connection failed",
          description: error instanceof Error ? error.message : `Could not connect to ${serviceName}`,
          variant: "destructive"
        });
      } finally {
        setIsAuthenticating(null);
      }
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
                const isAuthenticatingThis = isAuthenticating === service.name;

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
                    disabled={isAuthenticating !== null}
                  >
                    <span className="flex items-center gap-2">
                      <span>{service.icon}</span>
                      {service.name}
                    </span>
                    <span className="text-xs">
                      {isAuthenticatingThis 
                        ? "Connecting..." 
                        : isConnected 
                          ? "Connected" 
                          : "Connect"}
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
