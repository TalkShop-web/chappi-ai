
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AIService } from './types';

interface ServiceAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: AIService | null;
  onConnect: (serviceName: AIService['name']) => Promise<void>;
}

// This component is kept for reference but no longer used in the current implementation
export function ServiceAuthModal({ isOpen, onClose, service, onConnect }: ServiceAuthModalProps) {
  if (!service) return null;

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
            A new browser window will open for authentication.
          </p>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => onConnect(service.name)}
            >
              Connect to {service.name}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
