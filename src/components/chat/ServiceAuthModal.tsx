
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { AIService } from './types';

interface ServiceAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: AIService | null;
  onConnect: (serviceName: AIService['name'], apiKey: string) => Promise<void>;
}

export function ServiceAuthModal({ isOpen, onClose, service, onConnect }: ServiceAuthModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!service) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: `Please enter a valid API key for ${service.name}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await onConnect(service.name, apiKey);
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${service.name}`
      });
      setApiKey('');
      onClose();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : `Could not connect to ${service.name}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getApiKeyPlaceholder = () => {
    switch(service.name) {
      case "ChatGPT": return "sk-...";
      case "Claude": return "sk-ant-...";
      case "Gemini": return "AIza...";
      case "Perplexity": return "pplx-...";
      default: return "Enter API Key";
    }
  };

  const getApiKeyDescription = () => {
    switch(service.name) {
      case "ChatGPT": return "Enter your OpenAI API key";
      case "Claude": return "Enter your Anthropic API key";
      case "Gemini": return "Enter your Google AI API key";
      case "Perplexity": return "Enter your Perplexity API key";
      default: return "Enter your API key";
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
            {getApiKeyDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleConnect} className="space-y-4">
          <Input
            type="password"
            placeholder={getApiKeyPlaceholder()}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
          
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
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
