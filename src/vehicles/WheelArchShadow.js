// Wheel-well darkness is body geometry, not tyre geometry. Trace the lower
// silhouette only around each axle; never enlarge tyre/contact/physics radii.
export function getWheelArchShadowStrips(alpha, width, height, visual) {
  const strips = [];
  for (const axle of ['rear', 'front']) {
    const centre = width + Number(visual.referenceGeometry?.[axle + 'X']);
    const diameter = Number(visual['reference' + axle[0].toUpperCase() + axle.slice(1) + 'WheelDiameter'] || visual.referenceWheelDiameter || 182);
    if (!Number.isFinite(centre)) continue;
    const left = Math.max(0, Math.round(centre - diameter * 0.70));
    const right = Math.min(width - 1, Math.round(centre + diameter * 0.70));
    const top = Math.max(0, Math.floor(height - diameter * 1.35));
    const bottomAt = x => {
      for (let y = height - 1; y >= top; y--) {
        if (alpha[y * width + x] > 24) return y;
      }
      return height;
    };
    // Stop at the higher adjacent sill/bumper, always above the road. This
    // avoids the black discs protruding underneath a car when arches are wide.
    const bottom = Math.min(bottomAt(left), bottomAt(right), Math.floor(height - diameter * 0.20));
    // Limit the fill to the actual opening at axle height. The wider probes
    // above measure the sill only; filling that whole span would blacken
    // unrelated transparent bumper cut-outs beside the arch.
    const row = Math.max(top, Math.min(height - 1, Math.round(height - diameter / 2)));
    let archLeft = Math.round(centre), archRight = archLeft;
    if (alpha[row * width + archLeft] > 24) continue;
    while (archLeft > left && alpha[row * width + archLeft] <= 24) archLeft--;
    while (archRight < right && alpha[row * width + archRight] <= 24) archRight++;
    for (let x = archLeft; x <= archRight; x++) {
      const y = bottomAt(x) - 1; // one pixel underlap hides anti-aliased seams
      if (y >= top && y < bottom) strips.push([x, y, bottom - y]);
    }
  }
  return strips;
}

export function ensureWheelArchShadowTexture(scene, bodyKey, paintKey, visual) {
  if (!visual.referenceStandard || !scene.textures.createCanvas || typeof document === 'undefined') return null;
  const geometry = visual.referenceGeometry || {};
  const key = bodyKey + '_archShadow_' + [geometry.rearX, geometry.frontX,
    visual.referenceRearWheelDiameter, visual.referenceFrontWheelDiameter].join('_');
  if (scene.textures.exists(key)) return key;
  const source = scene.textures.get(bodyKey).getSourceImage();
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  if (!width || !height) return null;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  if (!visual.singleBody && scene.textures.exists(paintKey)) {
    ctx.drawImage(scene.textures.get(paintKey).getSourceImage(), 0, 0);
  }
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];
  const strips = getWheelArchShadowStrips(alpha, width, height, visual);
  const texture = scene.textures.createCanvas(key, width, height);
  const target = texture.getContext();
  target.fillStyle = '#020304';
  for (const [x, y, length] of strips) target.fillRect(x, y, 1, length);
  texture.refresh();
  return key;
}
