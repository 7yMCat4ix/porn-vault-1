import * as logger from "./logger";
import Actor from "./types/actor";
import CustomField from "./types/custom_field";
import Label from "./types/label";
import Movie from "./types/movie";
import Scene from "./types/scene";
import Studio from "./types/studio";

export function isSingleWord(str: string): boolean {
  return str.split(" ").length === 1;
}

function isRegex(str: string) {
  return str.startsWith("regex:");
}

export function ignoreSingleNames(arr: string[]): string[] {
  return arr.filter((str) => {
    if (!str.length) return false;

    // Check if string is a viable name
    if (!isRegex(str)) return !isSingleWord(str); // Cut it out if it's just one name
    // Otherwise, it's a regex, so leave it be
    return true;
  });
}

export function isMatchingItem(
  str: string,
  item: { name: string; aliases?: string[] },
  ignoreSingle: boolean
): boolean {
  logger.log(`Checking if ${item.name} matches ${str}`);

  const originalStr = stripStr(str);

  if (!ignoreSingle || !isSingleWord(item.name))
    if (originalStr.includes(stripStr(item.name))) return true;

  const aliases = ignoreSingle ? ignoreSingleNames(item.aliases || []) : item.aliases || [];

  return aliases.some((alias) => {
    if (isRegex(alias)) {
      logger.log("Regex: " + alias + " for " + originalStr);
      return new RegExp(alias.replace("regex:", ""), "i").test(originalStr);
    }
    return originalStr.includes(stripStr(alias));
  });
}

export function stripStr(str: string): string {
  return str.toLowerCase().replace(/[^a-zA-Z0-9'/\\,()[\]{}.-]/g, "");
}

// Returns IDs of extracted custom fields
export async function extractFields(str: string): Promise<string[]> {
  const foundFields = [] as string[];
  const allFields = await CustomField.getAll();

  allFields.forEach((field) => {
    if (stripStr(str).includes(stripStr(field.name))) {
      foundFields.push(field._id);
    }
  });
  return foundFields;
}

// Returns IDs of extracted labels
export async function extractLabels(str: string): Promise<string[]> {
  const foundLabels = [] as string[];
  const allLabels = await Label.getAll();

  allLabels.forEach((label) => {
    if (isMatchingItem(str, label, false)) {
      foundLabels.push(label._id);
    }
  });
  return foundLabels;
}

// Returns IDs of extracted actors
export async function extractActors(str: string): Promise<string[]> {
  const foundActors = [] as string[];
  const allActors = await Actor.getAll();

  allActors.forEach((actor) => {
    if (isMatchingItem(str, actor, true)) {
      foundActors.push(actor._id);
    }
  });
  return foundActors;
}

// Returns IDs of extracted studios
export async function extractStudios(str: string): Promise<string[]> {
  const allStudios = await Studio.getAll();
  return allStudios
    .filter((studio) => isMatchingItem(str, studio, false))
    .sort((a, b) => b.name.length - a.name.length)
    .map((s) => s._id);
}

// Returns IDs of extracted scenes
export async function extractScenes(str: string): Promise<string[]> {
  const allScenes = await Scene.getAll();
  return allScenes
    .filter((scene) => stripStr(str).includes(stripStr(scene.name)))
    .sort((a, b) => b.name.length - a.name.length)
    .map((s) => s._id);
}

// Returns IDs of extracted movies
export async function extractMovies(str: string): Promise<string[]> {
  const allMovies = await Movie.getAll();
  return allMovies
    .filter((movie) => stripStr(str).includes(stripStr(movie.name)))
    .sort((a, b) => b.name.length - a.name.length)
    .map((s) => s._id);
}
