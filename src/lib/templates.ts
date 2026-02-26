export const TEMPLATES: Record<string, string> = {
  'product-photo':
    'Professional product photography of {product}, white background, studio lighting, high detail, commercial quality',
  'social-post':
    '{subject}, vibrant colors, eye-catching composition, social media optimized, {mood} mood',
  'portrait':
    'Professional portrait of {subject}, {style} style, {lighting} lighting, shallow depth of field',
  'landscape':
    '{scene}, {time_of_day}, dramatic {weather} sky, ultra-wide angle, cinematic',
  'hero-image':
    'Website hero image, {subject}, modern {style} design, professional, high resolution, 21:9 aspect ratio',
  'logo':
    'Minimalist logo design for {brand}, {style} style, clean lines, vector-quality, white background',
  'icon-set':
    'Set of {style} icons for {subject}, consistent style, clean design, flat colors',
};

/**
 * Expand a template with given variables.
 * Variables are specified as "key=value,key2=value2".
 * Unreplaced placeholders are left as-is with a warning.
 */
export function expandTemplate(
  templateName: string,
  vars: string,
): { prompt: string; warnings: string[] } {
  const template = TEMPLATES[templateName];
  if (!template) {
    const available = Object.keys(TEMPLATES).join(', ');
    throw new Error(
      `Unknown template "${templateName}". Available: ${available}`,
    );
  }

  const varsMap: Record<string, string> = {};
  if (vars) {
    for (const pair of vars.split(',')) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) continue;
      const key = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      if (key) varsMap[key] = val;
    }
  }

  let prompt = template;
  const warnings: string[] = [];

  // Replace all {key} placeholders
  prompt = prompt.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (varsMap[key] !== undefined) {
      return varsMap[key];
    }
    warnings.push(`Template variable {${key}} was not provided`);
    return match;
  });

  return { prompt, warnings };
}
