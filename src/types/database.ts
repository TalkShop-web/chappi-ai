
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceConnection {
  id: string;
  user_id: string;
  service_name: "ChatGPT" | "Claude" | "Gemini" | "Perplexity";
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}
