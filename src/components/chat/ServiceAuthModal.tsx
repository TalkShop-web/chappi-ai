
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
  const { toast } = useToast();

  // Reset loading state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!service) return null;

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      await onConnect(service.name);
      
      // Success is handled by the parent component which will close the modal
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
      
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{service.icon}</span>
            Connect to {service.name}
          </DialogTitle>
          <DialogDescription>
            {service.name === "ChatGPT" && "Authenticate with your OpenAI account"}
            {service.name === "Claude" && "Authenticate with your Anthropic account"}
            {service.name === "Gemini" && "Authenticate with your Google account"}
            {service.name === "Perplexity" && "Authenticate with your Perplexity account"}
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
