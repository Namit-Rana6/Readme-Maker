/**
 * TypeScript re-export of platforms.js — keeps the TS frontend typed
 * while the Vercel API can import platforms.js directly without TS.
 */
// @ts-expect-error — plain JS module
import { PLATFORMS as _PLATFORMS, detectPlatform as _detect } from "./platforms.js";

export interface SocialPlatform {
  key:       string;
  label:     string;
  color:     string;
  textColor: string;
  iconPath:  string;
}

export interface PlatformDef extends SocialPlatform {
  match: RegExp;
}

export const PLATFORMS = _PLATFORMS as PlatformDef[];

export function detectPlatform(url: string): PlatformDef {
  return _detect(url) as PlatformDef;
}
