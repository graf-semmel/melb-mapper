import chroma from "chroma-js";

export function initTheme(theme) {
  const { isDarkMode } = theme;
  initDarkMode(isDarkMode);

  const primaryColor = getCSSVarColor("--color-primary");
  const secondaryColor = getCSSVarColor("--color-secondary");
  // const secondaryColor = generateComplementaryColor(primaryColor);
  // setCSSVarColor("--color-primary", primaryColor);
  // setCSSVarColor("--color-secondary", secondaryColor);
  return generateColorPalette([primaryColor, secondaryColor], 5);
}

function initDarkMode(isDarkMode){
  if (isDarkMode) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

export function generateComplementaryColor(color) {
  // Get the HSL values
  var hsl = chroma(color).hsl();
  var hue = hsl[0];
  var saturation = hsl[1];
  var lightness = hsl[2];

  // Add 180 to the hue value to find the complement on the color wheel
  // The modulo operator (%) ensures the hue stays within the 0-360 range.
  var complementaryHue = (hue + 180) % 360;

  // Create the complementary color using the new hue and original saturation/lightness
  var complementaryColor = chroma.hsl(complementaryHue, saturation, lightness);

  // Output the result in a desired format (e.g., hex string)
  logColor("Complementary Color", complementaryColor.hex());
  return complementaryColor.hex();
}

export function generateColorPalette(colors, numColors) {
  const tmpColors =
    colors.length === 1 ? autoGradient(colors[0], numColors) : colors;
  colors = chroma
    .scale(chroma.bezier(tmpColors))
    .correctLightness()
    .colors(numColors);
  colors.forEach((color, index) => logColor(`Final Color ${index + 1}`, color));
  return colors;
}

function autoGradient(color, numColors) {
  const lab = chroma(color).lab();
  const lRange = 100 * (0.95 - 1 / numColors);
  const lStep = lRange / (numColors - 1);
  let lStart = (100 - lRange) * 0.5;
  const range = [];
  for (let i = 0; i < numColors; i++) {
    range.push(lStart + i * lStep);
  }
  let offset = 0;

  offset = 9999;
  for (let i = 0; i < numColors; i++) {
    let diff = lab[0] - range[i];
    if (Math.abs(diff) < Math.abs(offset)) {
      offset = diff;
    }
  }

  return range.map((l) => chroma.lab([l + offset, lab[1], lab[2]]));
}

export function logColor(label, color) {
  console.log(
    `%c ${label}`,
    `background: ${color}; color: white; padding: 2px 5px;`,
    color
  );
}

export function setCSSVarColor(key, color) {
  document.documentElement.style.setProperty(key, color);
}

export function getCSSVarColor(key) {
  const rootStyles = getComputedStyle(document.documentElement);
  return rootStyles.getPropertyValue(key).trim().replace("#", "");
}
