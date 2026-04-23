export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  display_name: string;
  avatar_url: string | null;
  city: string;
  latitude: number;
  longitude: number;
  user_type: 'business' | 'fun';
  bio: string | null;
  instagram_handle: string | null;
  twitter_handle: string | null;
  is_visible: boolean;
  tier: 'member' | 'paid';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface InviteCode {
  id: string;
  code: string;
  max_uses: number;
  uses_so_far: number;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  created_at: string;
  user_id: string;
  content: string;
  region?: string;
  location_name?: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}
