// types/host.ts
import { PublicUser } from "./publicUser";

export type Host = PublicUser & {
  username: string; // required here
};