import { DefaultSession } from "next-auth";
import { User as AppUser } from "@/lib/types/user";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: AppUser & DefaultSession["user"];
  }

  interface User extends AppUser {
    id: string; // Add id to make it non-empty and consistent
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends AppUser {
    id: string;
    role: string;
  }
}
