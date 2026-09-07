export interface SocialPlatform {
  key: string;
  label: string;
  color: string;        // badge background
  textColor: string;    // badge text/icon color
  iconPath: string;     // SVG path(s) for the icon, drawn on 24×24 grid
}

export interface SocialLinkEntry {
  platform: SocialPlatform;
  url: string;
}

export interface SocialLinksConfig {
  links: SocialLinkEntry[];
  borderRadius?: number;
  background?: string;
  gap?: number;
  paddingX?: number;
  paddingY?: number;
}
