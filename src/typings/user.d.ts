export interface User {
  id: string;
  email: string;
  token: string;
  refreshToken?: string;
  // Optional profile fields
  name?: string;
  avatarUrl?: string;
}
