// types/publicUser.ts
export type PublicUser = {
    id: string;
    name: string | null;
    avatar_url: string | null;
    verified?: boolean | null;
    username?: string | null;
  };
  