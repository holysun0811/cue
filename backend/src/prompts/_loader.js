import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROMPTS_DIR = dirname(fileURLToPath(import.meta.url));
const cache = new Map();

function loadTemplate(relativePath) {
  if (process.env.PROMPTS_NO_CACHE === '1') {
    return readFileSync(resolve(PROMPTS_DIR, relativePath), 'utf8');
  }
  let template = cache.get(relativePath);
  if (template === undefined) {
    template = readFileSync(resolve(PROMPTS_DIR, relativePath), 'utf8');
    cache.set(relativePath, template);
  }
  return template;
}

export function renderPrompt(relativePath, vars = {}) {
  const template = loadTemplate(relativePath);
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) {
      throw new Error(`renderPrompt: missing variable "${key}" for ${relativePath}`);
    }
    const value = vars[key];
    return value === null || value === undefined ? '' : String(value);
  });
}
