// Canonical character face coordinates shared by the portrait and race renderers.
// Coordinates are SOURCE pixels, measured from the upper-left of the actual
// sprite (NOT the cropped frame). Author a visual.faceAnchor override only for
// genuine exceptions: { x: 0.5, y: 0.14, headHeight: 0.19 }.
// Per-pose exceptions may live under visual.faceAnchor.poses[pose].
const CACHE = new Map();
const SAMPLE_LIMIT = 256;
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, Number(value)));

export function resolveCharacterFaceAnchor(source, spriteKey = '', visual = {}, pose = 'idle') {
  const width = Math.max(1, Number(source?.naturalWidth || source?.width || 1));
  const height = Math.max(1, Number(source?.naturalHeight || source?.height || 1));
  const key = String(spriteKey || source?.src || width + 'x' + height);
  let inferred = CACHE.get(key);

  if (!inferred) {
    // Safe fallback for non-browser tests and missing or tainted textures.
    inferred = { x: width * 0.5, y: height * 0.125, headHeight: height * 0.20 };
    if (typeof document !== 'undefined') {
      try {
        const ratio = Math.min(1, SAMPLE_LIMIT / Math.max(width, height));
        const sw = Math.max(1, Math.round(width * ratio));
        const sh = Math.max(1, Math.round(height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.clearRect(0, 0, sw, sh);
          ctx.drawImage(source, 0, 0, sw, sh);
          const pixels = ctx.getImageData(0, 0, sw, sh).data;
          let minX = sw, minY = sh, maxX = -1, maxY = -1;
          for (let y = 0; y < sh; y += 1) {
            for (let x = 0; x < sw; x += 1) {
              if (pixels[(y * sw + x) * 4 + 3] <= 12) continue;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
          if (maxX >= minX && maxY >= minY) {
            const subjectWidth = maxX - minX + 1;
            const subjectHeight = maxY - minY + 1;
            const subjectCentre = minX + subjectWidth / 2;
            const bandLeft = Math.max(minX, Math.floor(subjectCentre - subjectWidth * 0.16));
            const bandRight = Math.min(maxX, Math.ceil(subjectCentre + subjectWidth * 0.16));
            let crownY = minY;
            outer:
            for (let y = minY; y <= maxY; y += 1) {
              let hits = 0;
              for (let x = bandLeft; x <= bandRight; x += 1) {
                if (pixels[(y * sw + x) * 4 + 3] > 12 && ++hits >= 2) {
                  crownY = y;
                  break outer;
                }
              }
            }
            const faceY = Math.min(maxY, crownY + subjectHeight * 0.115);
            // Find the head's horizontal centre in a narrow strip near face
            // level, rather than using the (often asymmetrical) torso width.
            const stripTop = Math.max(0, Math.floor(faceY - subjectHeight * 0.017));
            const stripBottom = Math.min(sh - 1, Math.ceil(faceY + subjectHeight * 0.017));
            let headMinX = sw, headMaxX = -1;
            for (let y = stripTop; y <= stripBottom; y += 1) {
              for (let x = minX; x <= maxX; x += 1) {
                if (pixels[(y * sw + x) * 4 + 3] <= 12) continue;
                headMinX = Math.min(headMinX, x);
                headMaxX = Math.max(headMaxX, x);
              }
            }
            const faceX = headMaxX >= headMinX
              ? (headMinX + headMaxX + 1) / 2
              : subjectCentre;
            inferred = {
              x: faceX / ratio,
              y: faceY / ratio,
              headHeight: subjectHeight * 0.20 / ratio,
            };
          }
        }
      } catch (_) { /* Retain numeric fallback; no render may fail here. */ }
    }
    CACHE.set(key, inferred);
  }

  const base = visual?.faceAnchor || {};
  const poseKey = String(pose || 'idle').toLowerCase();
  const poses = base.poses || {};
  const keyPose = Object.keys(poses).find(k => k.toLowerCase() === poseKey);
  const override = { ...base, ...(keyPose ? poses[keyPose] : {}) };
  // All authored values are normalized to the *full sprite canvas*.
  return {
    x: Number.isFinite(Number(override.x)) ? clamp(override.x, 0, 1) * width : inferred.x,
    y: Number.isFinite(Number(override.y)) ? clamp(override.y, 0, 1) * height : inferred.y,
    headHeight: Number.isFinite(Number(override.headHeight))
      ? clamp(override.headHeight, 0.04, 0.50) * height : inferred.headHeight,
  };
}
