export type AppId = 'web' | 'json-xml' | 'qrcode' | 'hashgen';

export interface AppDefinition {
  id: AppId;
  name: string;
  tagline: string;
  subdomain: string;
  accent: string;
  comingSoon?: boolean;
}
