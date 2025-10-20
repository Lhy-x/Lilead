export type User = {
  id: string;
  email: string;
  name: string;
  companyName?: string | null;
  brandColor?: string | null;
  themePreference?: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};
