const clamp01 = v => Math.max(0, Math.min(1, v));

export default class TokyoExpresswayBackground {
  constructor(scene) {
    this.scene = scene;
    this.width = 1560;

    this.keys = {
      backdrop: 'ts_bg_backdrop_r7',
      rearBarrier: 'ts_bg_rear_barrier_r7',
      road: 'ts_bg_road_r7',
      foreground: 'ts_bg_foreground_r7',
    };

    this.createTextures();
    this.createLayers();
  }

  seededRandom(seed = 1337) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  canvasTexture(key, width, height, draw) {
    if (this.scene.textures.exists(key)) return;
    const texture = this.scene.textures.createCanvas(key, width, height);
    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height);
    texture.refresh();
  }

  createTextures() {
    this.createBackdropTexture();
    this.createRearBarrierTexture();
    this.createRoadTexture();
    this.createForegroundTexture();
  }

  createBackdropTexture() {
    this.canvasTexture(this.keys.backdrop, 2048, 300, (ctx, w, h) => {
      const rnd = this.seededRandom(20260920);

      // Pixel-banded night sky.
      const bands = [
        ['#050817', 0, 78],
        ['#071020', 78, 78],
        ['#09152a', 156, 72],
        ['#0a1a31', 228, 72],
      ];
      for (const [colour, y, bh] of bands) {
        ctx.fillStyle = colour;
        ctx.fillRect(0, y, w, bh);
      }

      // Sparse stars / aircraft lights.
      for (let i = 0; i < 90; i++) {
        const x = Math.floor(rnd() * w);
        const y = Math.floor(8 + rnd() * 128);
        const bright = rnd() > 0.86;
        ctx.fillStyle = bright ? '#9ed8ff' : '#41617c';
        ctx.fillRect(x, y, bright ? 2 : 1, bright ? 2 : 1);
      }

      // Low cloud blocks, intentionally chunky.
      ctx.globalAlpha = 0.34;
      for (let i = 0; i < 28; i++) {
        const x = Math.floor(rnd() * w);
        const y = Math.floor(38 + rnd() * 92);
        const cw = Math.floor(32 + rnd() * 92);
        const ch = Math.floor(5 + rnd() * 12);
        ctx.fillStyle = i % 3 === 0 ? '#18304c' : '#122842';
        ctx.fillRect(x, y, cw, ch);
        if (rnd() > 0.55) ctx.fillRect(x + 12, y - 5, Math.floor(cw * 0.55), 5);
      }
      ctx.globalAlpha = 1;

      // Distant city glow.
      ctx.fillStyle = '#10243a';
      ctx.fillRect(0, 214, w, 42);

      // Dense Tokyo-like building rhythm.
      let x = 0;
      let buildingIndex = 0;
      while (x < w) {
        const bw = Math.floor(34 + rnd() * 64);
        const bh = Math.floor(55 + rnd() * 132);
        const y = 236 - bh;
        const bodyColours = ['#10192a', '#111c2f', '#142038', '#0d1728'];
        ctx.fillStyle = bodyColours[buildingIndex % bodyColours.length];
        ctx.fillRect(x, y, bw, bh);

        ctx.fillStyle = '#1d2c45';
        ctx.fillRect(x + 4, y + 4, Math.max(8, bw - 8), 4);

        for (let wy = y + 15; wy < 230; wy += 15) {
          for (let wx = x + 8; wx < x + bw - 6; wx += 13) {
            const lit = rnd();
            if (lit < 0.16) {
              const c = rnd();
              ctx.fillStyle = c < 0.62 ? '#d9a85c' : c < 0.90 ? '#62bfe2' : '#cc4ca2';
              ctx.globalAlpha = 0.72;
              ctx.fillRect(wx, wy, 4, 3);
            }
          }
        }
        ctx.globalAlpha = 1;

        if (buildingIndex % 5 === 0) {
          ctx.fillStyle = '#de345d';
          ctx.fillRect(x + Math.floor(bw / 2), Math.max(3, y - 5), 2, 3);
        }

        x += bw + Math.floor(6 + rnd() * 14);
        buildingIndex++;
      }

      // One generic illuminated broadcast tower landmark.
      const tx = 1470;
      ctx.fillStyle = '#b33754';
      ctx.fillRect(tx, 68, 5, 145);
      ctx.fillRect(tx - 17, 207, 39, 5);
      ctx.fillStyle = '#e8a44f';
      for (let ty = 82; ty < 202; ty += 18) ctx.fillRect(tx - 2, ty, 9, 4);
      ctx.fillStyle = '#75d7ff';
      ctx.fillRect(tx + 1, 54, 3, 18);

      // Mid-distance elevated expressway, part of the combined backdrop.
      ctx.fillStyle = '#111821';
      ctx.fillRect(0, 207, w, 26);
      ctx.fillStyle = '#37414b';
      ctx.fillRect(0, 207, w, 3);
      ctx.fillStyle = '#d79b45';
      ctx.globalAlpha = 0.78;
      ctx.fillRect(0, 211, w, 2);
      ctx.globalAlpha = 1;

      for (let px = 95; px < w; px += 235) {
        ctx.fillStyle = '#18202a';
        ctx.fillRect(px, 231, 22, 69);
        ctx.fillStyle = '#303945';
        ctx.fillRect(px + 3, 231, 4, 69);
      }

      // Lamps along the elevated road.
      for (let lx = 45; lx < w; lx += 170) {
        ctx.fillStyle = '#202a35';
        ctx.fillRect(lx, 178, 3, 31);
        ctx.fillStyle = '#ffc568';
        ctx.globalAlpha = 0.88;
        ctx.fillRect(lx - 4, 175, 11, 4);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#ffb849';
        ctx.fillRect(lx - 11, 170, 25, 15);
        ctx.globalAlpha = 1;
      }

      // Generic overhead direction signs. No brands/logos.
      const signs = [
        [530, 178, 120, 39],
        [1110, 171, 145, 46],
        [1760, 179, 126, 38],
      ];
      for (const [sx, sy, sw, sh] of signs) {
        ctx.fillStyle = '#123a3d';
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = '#78a6a4';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);
        ctx.fillStyle = '#c5dbd7';
        ctx.fillRect(sx + 14, sy + 13, Math.floor(sw * 0.44), 3);
        ctx.fillRect(sx + 14, sy + 22, Math.floor(sw * 0.62), 3);
        ctx.beginPath();
        ctx.moveTo(sx + sw - 26, sy + 28);
        ctx.lineTo(sx + sw - 12, sy + 14);
        ctx.lineTo(sx + sw - 12, sy + 23);
        ctx.fill();
      }
    });
  }

  createRearBarrierTexture() {
    this.canvasTexture(this.keys.rearBarrier, 1024, 118, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);

      // Fence.
      ctx.fillStyle = '#121820';
      ctx.fillRect(0, 0, w, 34);
      ctx.strokeStyle = '#37434e';
      ctx.lineWidth = 2;
      for (let x = -34; x < w + 34; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 2);
        ctx.lineTo(x + 34, 34);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 34, 2);
        ctx.lineTo(x, 34);
        ctx.stroke();
      }
      ctx.fillStyle = '#4a5661';
      ctx.fillRect(0, 32, w, 3);

      // Concrete wall.
      ctx.fillStyle = '#343941';
      ctx.fillRect(0, 35, w, 79);
      ctx.fillStyle = '#454a50';
      ctx.fillRect(0, 35, w, 5);
      ctx.fillStyle = '#20252b';
      ctx.fillRect(0, 111, w, 7);

      // Expansion joints and stains.
      for (let x = 0; x < w; x += 128) {
        ctx.fillStyle = '#20242a';
        ctx.fillRect(x, 39, 2, 72);
        ctx.globalAlpha = 0.20;
        ctx.fillStyle = '#0e1116';
        ctx.fillRect(x + 6, 48, 5, 53);
        ctx.globalAlpha = 1;
      }

      // Amber reflectors.
      for (let x = 55; x < w; x += 205) {
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = '#ffae35';
        ctx.fillRect(x - 7, 57, 24, 15);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffc24d';
        ctx.fillRect(x, 61, 11, 6);
      }

      // Neutral chevrons.
      for (let x = 330; x < w; x += 420) {
        ctx.fillStyle = '#181c22';
        for (let n = 0; n < 3; n++) {
          const xx = x + n * 34;
          ctx.beginPath();
          ctx.moveTo(xx, 70);
          ctx.lineTo(xx + 18, 85);
          ctx.lineTo(xx, 100);
          ctx.lineTo(xx + 12, 100);
          ctx.lineTo(xx + 31, 85);
          ctx.lineTo(xx + 12, 70);
          ctx.fill();
        }
      }
    });
  }

  createRoadTexture() {
    this.canvasTexture(this.keys.road, 1024, 260, (ctx, w, h) => {
      const rnd = this.seededRandom(86);

      ctx.fillStyle = '#151a22';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1c222b';
      ctx.fillRect(0, 16, w, 190);
      ctx.fillStyle = '#10151c';
      ctx.fillRect(0, 207, w, 53);

      // Wet horizontal texture.
      ctx.globalAlpha = 0.34;
      for (let i = 0; i < 150; i++) {
        const y = Math.floor(rnd() * h);
        const x = Math.floor(rnd() * w);
        const len = Math.floor(12 + rnd() * 85);
        ctx.fillStyle = rnd() > 0.5 ? '#39434d' : '#26313c';
        ctx.fillRect(x, y, len, 1);
      }

      // Reflections are deliberately sparse and abstract.
      const reflectionColours = ['#e89535', '#3ea9d8', '#b63378', '#497dd8'];
      for (let i = 0; i < 18; i++) {
        const x = Math.floor(rnd() * w);
        const rw = Math.floor(5 + rnd() * 11);
        const rh = Math.floor(30 + rnd() * 120);
        ctx.fillStyle = reflectionColours[i % reflectionColours.length];
        ctx.globalAlpha = 0.08 + rnd() * 0.10;
        ctx.fillRect(x, Math.floor(rnd() * 70), rw, rh);
      }
      ctx.globalAlpha = 1;

      // Lane divider.
      ctx.fillStyle = '#d7dce0';
      ctx.globalAlpha = 0.56;
      for (let x = -20; x < w + 100; x += 185) ctx.fillRect(x, 106, 92, 4);
      ctx.globalAlpha = 1;

      // Small road studs.
      for (let x = 70; x < w; x += 185) {
        ctx.fillStyle = '#e6bd62';
        ctx.globalAlpha = 0.48;
        ctx.fillRect(x, 108, 4, 2);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#303844';
      ctx.fillRect(0, 202, w, 3);
    });
  }

  createForegroundTexture() {
    this.canvasTexture(this.keys.foreground, 1024, 94, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);

      // Near steel guardrail.
      ctx.fillStyle = '#0c1117';
      ctx.fillRect(0, 61, w, 33);

      ctx.fillStyle = '#313c46';
      ctx.fillRect(0, 24, w, 15);
      ctx.fillStyle = '#667480';
      ctx.fillRect(0, 24, w, 3);
      ctx.fillStyle = '#1b242c';
      ctx.fillRect(0, 39, w, 18);
      ctx.fillStyle = '#495660';
      ctx.fillRect(0, 55, w, 4);

      for (let x = 45; x < w; x += 210) {
        ctx.fillStyle = '#111820';
        ctx.fillRect(x, 9, 18, 85);
        ctx.fillStyle = '#495761';
        ctx.fillRect(x + 3, 9, 4, 85);

        ctx.fillStyle = '#e7a43d';
        ctx.globalAlpha = 0.25;
        ctx.fillRect(x - 5, 33, 28, 13);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffc152';
        ctx.fillRect(x + 4, 36, 10, 5);
      }
    });
  }

  createLayers() {
    this.backdrop = this.scene.add.tileSprite(0, 0, this.width, 300, this.keys.backdrop)
      .setOrigin(0, 0)
      .setDepth(0);

    this.road = this.scene.add.tileSprite(0, 278, this.width, 270, this.keys.road)
      .setOrigin(0, 0)
      .setDepth(1);

    this.rearBarrier = this.scene.add.tileSprite(0, 242, this.width, 118, this.keys.rearBarrier)
      .setOrigin(0, 0)
      .setDepth(2);

    this.foreground = this.scene.add.tileSprite(0, 500, this.width, 94, this.keys.foreground)
      .setOrigin(0, 0)
      .setDepth(9);

    // Very subtle cool overlay helps cars remain readable over busy city lights.
    this.scene.add.rectangle(780, 235, 1560, 470, 0x02060d, 0.05)
      .setDepth(2.5)
      .setScrollFactor(0);
  }

  update(cameraPx, speedKmh = 0) {
    // The four practical V1 layers:
    // combined backdrop / rear barrier / road / near foreground guardrail.
    this.backdrop.tilePositionX = cameraPx * 0.24;
    this.rearBarrier.tilePositionX = cameraPx * 0.90;
    this.road.tilePositionX = cameraPx;
    this.foreground.tilePositionX = cameraPx * 1.16;

    // Tiny speed-dependent alpha modulation makes reflections feel more alive
    // without changing the physics or adding blur.
    const speed = clamp01(speedKmh / 180);
    this.foreground.setAlpha(0.92 + speed * 0.08);
  }
}
