import { getSpecies } from "./catalog";

/** Resolve a species sprite URL (Vite public/). */
export function speciesSpriteUrl(speciesId: string): string | null {
  try {
    const species = getSpecies(speciesId);
    const path = species.spriteFront;
    if (!path) return null;
    const base = import.meta.env.BASE_URL || "/";
    return `${base}${path.replace(/^\//, "")}`;
  } catch {
    return null;
  }
}
