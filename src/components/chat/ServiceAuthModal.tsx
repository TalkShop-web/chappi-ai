
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AIService } from './types';

interface ServiceAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: AIService | null;
  onConnect: (serviceName: AIService['name']) => Promise<void>;
}

export function ServiceAuthModal({ isOpen, onClose, service, onConnect }: ServiceAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the auth window is still open
    const checkWindow = setInterval(() => {
      if (authWindow && authWindow.closed) {
        clearInterval(checkWindow);
        setAuthWindow(null);
        setIsLoading(false);
      }
    }, 500);

    return () => {
      clearInterval(checkWindow);
    };
  }, [authWindow]);

  if (!service) return null;

  const handleConnect = async () => {
    setIsLoading(true);
    
    // Get the appropriate auth URL based on the service
    const authUrl = getAuthUrl(service.name);
    
    // Open the authentication window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const authWindowInstance = window.open(
      authUrl,
      `Connect to ${service.name}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!authWindowInstance) {
      setIsLoading(false);
      toast({
        title: "Connection Failed",
        description: "Could not open authentication window. Please allow popups for this site.",
        variant: "destructive"
      });
      return;
    }
    
    setAuthWindow(authWindowInstance);
    
    try {
      await onConnect(service.name);
      toast({
        title: "Authentication Started",
        description: `Please complete the authentication process for ${service.name} in the popup window.`
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : `Could not connect to ${service.name}`,
        variant: "destructive"
      });
      if (authWindowInstance && !authWindowInstance.closed) {
        authWindowInstance.close();
      }
      setAuthWindow(null);
      setIsLoading(false);
    }
  };

  const getAuthUrl = (serviceName: AIService['name']): string => {
    // These should be actual OAuth authorization URLs in a real app
    switch(serviceName) {
      case "ChatGPT":
        return 'https://auth.openai.com/oauth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI';
      case "Claude":
        return 'https://console.anthropic.com/account/keys';
      case "Gemini":
        return 'https://makersuite.google.com/app/apikey';
      case "Perplexity":
        return 'https://www.perplexity.ai/settings/api';
      default:
        return '#';
    }
  };

  const getServiceDescription = () => {
    switch(service.name) {
      case "ChatGPT": return "Authenticate with your OpenAI account";
      case "Claude": return "Authenticate with your Anthropic account";
      case "Gemini": return "Authenticate with your Google account";
      case "Perplexity": return "Authenticate with your Perplexity account";
      default: return "Authenticate with your account";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{service.icon}</span>
            Connect to {service.name}
          </DialogTitle>
          <DialogDescription>
            {getServiceDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You'll be redirected to {service.name} to authorize access to your account.
            No API keys are required. A popup window will open for authentication.
          </p>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : `Connect to ${service.name}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
