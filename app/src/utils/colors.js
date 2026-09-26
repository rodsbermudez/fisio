// Helpers para cores dinâmicas por tenant

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

export function rgbString({ r, g, b }) {
  return `${r} ${g} ${b}`;
}

export function blendWithWhite(rgb, amount) {
  return {
    r: Math.round(rgb.r + (255 - rgb.r) * amount),
    g: Math.round(rgb.g + (255 - rgb.g) * amount),
    b: Math.round(rgb.b + (255 - rgb.b) * amount),
  };
}

export function blendWithBlack(rgb, amount) {
  return {
    r: Math.round(rgb.r * (1 - amount)),
    g: Math.round(rgb.g * (1 - amount)),
    b: Math.round(rgb.b * (1 - amount)),
  };
}

const DEFAULT_BLUE = '#0284C7';

export function buildBrandCssVariables(hex = DEFAULT_BLUE) {
  const rgb = hexToRgb(hex);
  const hover = blendWithBlack(rgb, 0.15);
  const light = blendWithWhite(rgb, 0.88);
  const accent = blendWithWhite(rgb, 0.35);

  return {
    '--brand-rgb': rgbString(rgb),
    '--brand-hover-rgb': rgbString(hover),
    '--brand-light-rgb': rgbString(light),
    '--brand-accent-rgb': rgbString(accent),
  };
}

export const ADMIN_BRAND_CSS = {
  '--brand-rgb': '249 115 22',
  '--brand-hover-rgb': '234 88 12',
  '--brand-light-rgb': '255 247 237',
  '--brand-accent-rgb': '251 146 60',
};
