export type Message = {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
  };
  
  export type Participant = {
    user_id: string;
    last_seen_at: string | null;
  };
  