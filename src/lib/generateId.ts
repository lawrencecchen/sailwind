import { customAlphabet } from "nanoid";
import { generateSlug } from "random-word-slugs";

const nanoid = customAlphabet("1234567890abcdef", 10);

export function generateId() {
  return generateSlug() + "-" + nanoid(3);
}
