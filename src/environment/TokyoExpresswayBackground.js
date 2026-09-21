const clamp01 = v => Math.max(0, Math.min(1, v));

export default class TokyoExpresswayBackground {
  constructor(scene, { timeOfDay = 'night' } = {}) {
    this.scene = scene;
    this.width = 1560;
    this.timeOfDay = ['day', 'twilight', 'night'].includes(timeOfDay)
      ? timeOfDay
      : 'night';

    const suffix = 'r49_' + this.timeOfDay;
    this.keys = {
      backdrop: 'ts_bg_backdrop_' + suffix,
      rearBarrier: 'ts_bg_rear_barrier_' + suffix,
      road: 'ts_bg_road_' + suffix,
      foreground: 'ts_bg_foreground_' + suffix,
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

  palette() {
    if (this.timeOfDay === 'day') {
      return {
        sky: ['#9bd0e8', '#87c5e1', '#73b9dc', '#a8d1df'],
        cloud: ['#dceaf0', '#c9dee8'],
        haze: '#9fc2cf',
        buildings: ['#637581', '#71828d', '#566a78', '#80909a'],
        roof: '#8fa0aa',
        window: '#c8e3ec',
        expressway: '#5b6269',
        expresswayEdge: '#9aa5ac',
        lamp: '#d8e4e8',
        barrier: '#727980',
        barrierTop: '#929aa1',
        barrierDark: '#555c63',
        fence: '#59636c',
        fenceBright: '#7e8b94',
        road: '#3d444b',
        roadAlt: '#454c52',
        roadDark: '#343b42',
        roadTexture: '#596168',
        foreground: '#515c64',
        foregroundBright: '#8a969e',
        overlay: 0xd7eff7,
        overlayAlpha: 0.035,
        litChance: 0.035,
        starCount: 0,
      };
    }

    if (this.timeOfDay === 'twilight') {
      return {
        sky: ['#252c4b', '#3c3955', '#665064', '#a76b6c'],
        cloud: ['#4d5068', '#5e586c'],
        haze: '#765566',
        buildings: ['#273143', '#30394b', '#202a3a', '#394152'],
        roof: '#485369',
        window: '#e5b16a',
        expressway: '#2a3039',
        expresswayEdge: '#59636e',
        lamp: '#ffc36b',
        barrier: '#50565e',
        barrierTop: '#69717a',
        barrierDark: '#333941',
        fence: '#353e49',
        fenceBright: '#56616c',
        road: '#2a3038',
        roadAlt: '#303740',
        roadDark: '#222831',
        roadTexture: '#424a54',
        foreground: '#252e37',
        foregroundBright: '#5f6c76',
        overlay: 0x6e4057,
        overlayAlpha: 0.06,
        litChance: 0.12,
        starCount: 28,
      };
    }

    return {
      sky: ['#050817', '#071020', '#09152a', '#0a1a31'],
      cloud: ['#18304c', '#122842'],
      haze: '#10243a',
      buildings: ['#10192a', '#111c2f', '#142038', '#0d1728'],
      roof: '#1d2c45',
      window: '#d9a85c',
      expressway: '#111821',
      expresswayEdge: '#37414b',
      lamp: '#ffc568',
      barrier: '#343941',
      barrierTop: '#454a50',
      barrierDark: '#20252b',
      fence: '#121820',
      fenceBright: '#4a5661',
      road: '#151a22',
      roadAlt: '#1c222b',
      roadDark: '#10151c',
      roadTexture: '#39434d',
      foreground: '#1b242c',
      foregroundBright: '#667480',
      overlay: 0x02060d,
      overlayAlpha: 0.05,
      litChance: 0.16,
      starCount: 90,
    };
  }

  createTextures() {
    this.createBackdropTexture();
    this.createRearBarrierTexture();
    this.createRoadTexture();
    this.createForegroundTexture();
  }

  createBackdropTexture() {
    const p = this.palette();

    this.canvasTexture(this.keys.backdrop, 2048, 300, (ctx, w, h) => {
      const rnd = this.seededRandom(
        this.timeOfDay === 'day' ? 20260921 : this.timeOfDay === 'twilight' ? 20260922 : 20260920
      );

      const bandH = [78, 78, 72, 72];
      let y = 0;
      p.sky.forEach((colour, i) => {
        ctx.fillStyle = colour;
        ctx.fillRect(0, y, w, bandH[i]);
        y += bandH[i];
      });

      for (let i = 0; i < p.starCount; i++) {
        const x = Math.floor(rnd() * w);
        const sy = Math.floor(8 + rnd() * 128);
        ctx.fillStyle = this.timeOfDay === 'twilight' ? '#c8cae5' : '#9ed8ff';
        ctx.globalAlpha = this.timeOfDay === 'twilight' ? 0.42 : 0.8;
        ctx.fillRect(x, sy, rnd() > 0.86 ? 2 : 1, rnd() > 0.86 ? 2 : 1);
      }
      ctx.globalAlpha = 1;

      ctx.globalAlpha = this.timeOfDay === 'day' ? 0.42 : 0.34;
      for (let i = 0; i < 28; i++) {
        const x = Math.floor(rnd() * w);
        const cy = Math.floor(30 + rnd() * 98);
        const cw = Math.floor(32 + rnd() * 92);
        const ch = Math.floor(5 + rnd() * 12);
        ctx.fillStyle = p.cloud[i % p.cloud.length];
        ctx.fillRect(x, cy, cw, ch);
        if (rnd() > 0.55) ctx.fillRect(x + 12, cy - 5, Math.floor(cw * 0.55), 5);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = p.haze;
      ctx.fillRect(0, 214, w, 42);

      let x = 0;
      let buildingIndex = 0;
      while (x < w) {
        const bw = Math.floor(34 + rnd() * 64);
        const bh = Math.floor(55 + rnd() * 132);
        const by = 236 - bh;

        ctx.fillStyle = p.buildings[buildingIndex % p.buildings.length];
        ctx.fillRect(x, by, bw, bh);

        ctx.fillStyle = p.roof;
        ctx.fillRect(x + 4, by + 4, Math.max(8, bw - 8), 4);

        for (let wy = by + 15; wy < 230; wy += 15) {
          for (let wx = x + 8; wx < x + bw - 6; wx += 13) {
            if (rnd() < p.litChance) {
              if (this.timeOfDay === 'day') {
                ctx.fillStyle = p.window;
                ctx.globalAlpha = 0.5;
              } else {
                const c = rnd();
                ctx.fillStyle = c < 0.62 ? p.window : c < 0.90 ? '#62bfe2' : '#cc4ca2';
                ctx.globalAlpha = this.timeOfDay === 'twilight' ? 0.62 : 0.72;
              }
              ctx.fillRect(wx, wy, 4, 3);
            }
          }
        }
        ctx.globalAlpha = 1;

        if (buildingIndex % 5 === 0 && this.timeOfDay !== 'day') {
          ctx.fillStyle = '#de345d';
          ctx.fillRect(x + Math.floor(bw / 2), Math.max(3, by - 5), 2, 3);
        }

        x += bw + Math.floor(6 + rnd() * 14);
        buildingIndex++;
      }

      // Generic tower landmark.
      const tx = 1470;
      ctx.fillStyle = this.timeOfDay === 'day' ? '#a85f66' : '#b33754';
      ctx.fillRect(tx, 68, 5, 145);
      ctx.fillRect(tx - 17, 207, 39, 5);
      ctx.fillStyle = this.timeOfDay === 'day' ? '#c9d7dc' : '#e8a44f';
      for (let ty = 82; ty < 202; ty += 18) ctx.fillRect(tx - 2, ty, 9, 4);

      // Mid-distance elevated expressway.
      ctx.fillStyle = p.expressway;
      ctx.fillRect(0, 207, w, 26);
      ctx.fillStyle = p.expresswayEdge;
      ctx.fillRect(0, 207, w, 3);

      for (let px = 95; px < w; px += 235) {
        ctx.fillStyle = p.expressway;
        ctx.fillRect(px, 231, 22, 69);
        ctx.fillStyle = p.expresswayEdge;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(px + 3, 231, 4, 69);
        ctx.globalAlpha = 1;
      }

      for (let lx = 45; lx < w; lx += 170) {
        ctx.fillStyle = p.expressway;
        ctx.fillRect(lx, 178, 3, 31);
        ctx.fillStyle = p.lamp;
        ctx.globalAlpha = this.timeOfDay === 'day' ? 0.42 : 0.88;
        ctx.fillRect(lx - 4, 175, 11, 4);
        ctx.globalAlpha = 1;
      }

      const signs = [
        [530, 178, 120, 39],
        [1110, 171, 145, 46],
        [1760, 179, 126, 38],
      ];
      for (const [sx, sy, sw, sh] of signs) {
        ctx.fillStyle = this.timeOfDay === 'day' ? '#2f6c70' : '#123a3d';
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = '#8db1af';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);
        ctx.fillStyle = '#dbe9e6';
        ctx.fillRect(sx + 14, sy + 13, Math.floor(sw * 0.44), 3);
        ctx.fillRect(sx + 14, sy + 22, Math.floor(sw * 0.62), 3);
      }
    });
  }

  createRearBarrierTexture() {
    const p = this.palette();

    this.canvasTexture(this.keys.rearBarrier, 1024, 118, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = p.fence;
      ctx.fillRect(0, 0, w, 34);
      ctx.strokeStyle = p.fenceBright;
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

      ctx.fillStyle = p.fenceBright;
      ctx.fillRect(0, 32, w, 3);
      ctx.fillStyle = p.barrier;
      ctx.fillRect(0, 35, w, 79);
      ctx.fillStyle = p.barrierTop;
      ctx.fillRect(0, 35, w, 5);
      ctx.fillStyle = p.barrierDark;
      ctx.fillRect(0, 111, w, 7);

      for (let x = 0; x < w; x += 128) {
        ctx.fillStyle = p.barrierDark;
        ctx.fillRect(x, 39, 2, 72);
      }

      for (let x = 55; x < w; x += 205) {
        ctx.fillStyle = this.timeOfDay === 'day' ? '#d2aa54' : '#ffc24d';
        ctx.globalAlpha = this.timeOfDay === 'day' ? 0.55 : 1;
        ctx.fillRect(x, 61, 11, 6);
        ctx.globalAlpha = 1;
      }
    });
  }

  createRoadTexture() {
    const p = this.palette();

    this.canvasTexture(this.keys.road, 1024, 260, (ctx, w, h) => {
      const rnd = this.seededRandom(this.timeOfDay === 'day' ? 87 : 86);

      ctx.fillStyle = p.road;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = p.roadAlt;
      ctx.fillRect(0, 16, w, 190);
      ctx.fillStyle = p.roadDark;
      ctx.fillRect(0, 207, w, 53);

      ctx.globalAlpha = this.timeOfDay === 'day' ? 0.20 : 0.34;
      for (let i = 0; i < 150; i++) {
        const y = Math.floor(rnd() * h);
        const x = Math.floor(rnd() * w);
        const len = Math.floor(12 + rnd() * 85);
        ctx.fillStyle = p.roadTexture;
        ctx.fillRect(x, y, len, 1);
      }
      ctx.globalAlpha = 1;

      if (this.timeOfDay !== 'day') {
        const reflectionColours = ['#e89535', '#3ea9d8', '#b63378', '#497dd8'];
        for (let i = 0; i < 18; i++) {
          const x = Math.floor(rnd() * w);
          const rw = Math.floor(5 + rnd() * 11);
          const rh = Math.floor(30 + rnd() * 120);
          ctx.fillStyle = reflectionColours[i % reflectionColours.length];
          ctx.globalAlpha = this.timeOfDay === 'twilight' ? 0.05 + rnd() * 0.06 : 0.08 + rnd() * 0.10;
          ctx.fillRect(x, Math.floor(rnd() * 70), rw, rh);
        }
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = this.timeOfDay === 'day' ? '#f0f1ec' : '#d7dce0';
      ctx.globalAlpha = this.timeOfDay === 'day' ? 0.78 : 0.56;
      for (let x = -20; x < w + 100; x += 185) ctx.fillRect(x, 106, 92, 4);
      ctx.globalAlpha = 1;

      ctx.fillStyle = p.barrierTop;
      ctx.fillRect(0, 202, w, 3);
    });
  }

  createForegroundTexture() {
    const p = this.palette();

    this.canvasTexture(this.keys.foreground, 1024, 94, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = p.barrierDark;
      ctx.fillRect(0, 61, w, 33);

      ctx.fillStyle = p.foreground;
      ctx.fillRect(0, 24, w, 15);
      ctx.fillStyle = p.foregroundBright;
      ctx.fillRect(0, 24, w, 3);
      ctx.fillStyle = p.barrierDark;
      ctx.fillRect(0, 39, w, 18);
      ctx.fillStyle = p.foreground;
      ctx.fillRect(0, 55, w, 4);

      for (let x = 45; x < w; x += 210) {
        ctx.fillStyle = p.barrierDark;
        ctx.fillRect(x, 9, 18, 85);
        ctx.fillStyle = p.foreground;
        ctx.fillRect(x + 3, 9, 4, 85);

        ctx.fillStyle = this.timeOfDay === 'day' ? '#d6b866' : '#ffc152';
        ctx.fillRect(x + 4, 36, 10, 5);
      }
    });
  }

  createLayers() {
    const p = this.palette();

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

    this.scene.add.rectangle(780, 235, 1560, 470, p.overlay, p.overlayAlpha)
      .setDepth(2.5)
      .setScrollFactor(0);
  }

  update(cameraPx, speedKmh = 0) {
    this.backdrop.tilePositionX = cameraPx * 0.24;
    this.rearBarrier.tilePositionX = cameraPx * 0.90;
    this.road.tilePositionX = cameraPx;
    this.foreground.tilePositionX = cameraPx * 1.16;

    const speed = clamp01(speedKmh / 180);
    this.foreground.setAlpha(0.92 + speed * 0.08);
  }
}
