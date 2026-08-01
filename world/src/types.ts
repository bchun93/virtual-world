export type ZoneId =
  | "tidecove"
  | "ember-grove"
  | "glass-spire"
  | "mirror-archive"
  | "skyward-reach"
  | "quiet-hollow";

export interface Zone {
  id: ZoneId;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  glow: string;
  x: number;
  y: number;
  size: number;
}
