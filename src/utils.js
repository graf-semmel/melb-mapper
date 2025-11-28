import chroma from "chroma-js";

function getCSSVarColor(key) {
  const rootStyles = getComputedStyle(document.documentElement);
  return rootStyles.getPropertyValue(key).trim().replace("#", "");
}

export function setCSSVarColor(key, color) {
  document.documentElement.style.setProperty(key, color);
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

function logColor(label, color) {
  console.log(
    `%c ${label}`,
    `background: ${color}; color: white; padding: 2px 5px;`,
    color
  );
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
