import type { UserProfile } from "@/lib/domain/models";

export interface PasswordAuthInput {
  email: string;
  password: string;
}

export interface AuthenticationResult {
  user: UserProfile;
  accessToken?: string;
}

export interface TaskflowAuthProvider {
  authenticateWithPassword(input: PasswordAuthInput): Promise<AuthenticationResult>;
}
