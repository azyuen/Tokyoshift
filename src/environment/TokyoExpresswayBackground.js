const clamp01 = v => Math.max(0, Math.min(1, v));

export default class TokyoExpresswayBackground {
  constructor(scene, { timeOfDay = 'night', skylineKey = null, roadVariant = 0, skylineStartRatio = 0, skylineTravelPx = null } = {}) {
    this.scene = scene;
    this.width = 1560;
    this.skylineKey = skylineKey;
    this.roadVariant = Math.abs(Math.floor(Number(roadVariant) || 0)) % 4;
    this.skylineStartRatio = Phaser.Math.Clamp(Number(skylineStartRatio) || 0, 0, 1);
    this.skylineTravelPx = Number.isFinite(Number(skylineTravelPx)) ? Math.max(0, Number(skylineTravelPx)) : null;
    this.timeOfDay = ['day', 'twilight', 'night'].includes(timeOfDay)
      ? timeOfDay
      : 'night';

    const suffix = 'r253_' + this.timeOfDay + '_v' + this.roadVariant;
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

    this.canvasTexture(this.keys.rearBarrier, 1536, 118, (ctx, w, h) => {
      const rnd = this.seededRandom((this.timeOfDay === 'day' ? 25001 : 25002) + this.roadVariant * 101);
      ctx.clearRect(0, 0, w, h);

      // Per-race infrastructure variant: the regional skyline stays fixed,
      // while the expressway itself can feel like a genuinely different stretch.
      const fenceMode = this.roadVariant % 4;
      const accentShift = fenceMode * 22;

      // Open chain-link / anti-throw safety fence: no opaque backing, so authored
      // regional skylines remain visible through the mesh.
      ctx.strokeStyle = p.fenceBright;
      ctx.globalAlpha = this.timeOfDay === 'day' ? 0.72 : 0.82;
      ctx.lineWidth = 1;
      const meshStep = fenceMode === 1 ? 18 : fenceMode === 2 ? 30 : 24;
      const meshBottom = fenceMode === 1 ? 34 : 33;
      // Variant 3 deliberately has a long open/no-mesh run.
      const meshCutStart = fenceMode === 3 ? 420 : -1;
      const meshCutEnd = fenceMode === 3 ? 940 : -1;
      for (let x = -36; x < w + 36; x += meshStep) {
        if (x >= meshCutStart && x <= meshCutEnd) continue;
        ctx.beginPath(); ctx.moveTo(x, 2); ctx.lineTo(x + meshStep + 8, meshBottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + meshStep + 8, 2); ctx.lineTo(x, meshBottom); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Fence rails and upright posts give the mesh real structure.
      ctx.fillStyle = p.fenceBright;
      ctx.fillRect(0, 0, w, 2);
      ctx.fillRect(0, 32, w, 3);
      const postSpacing = fenceMode === 2 ? 190 : fenceMode === 3 ? 286 : 236;
      for (let x = 74 + fenceMode * 17; x < w; x += postSpacing) {
        ctx.fillStyle = p.fence;
        ctx.fillRect(x, 0, 5, 35);
        ctx.fillStyle = p.fenceBright;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x + 1, 0, 1, 35);
        ctx.globalAlpha = 1;
      }

      // Concrete crash wall.
      ctx.fillStyle = p.barrier;
      ctx.fillRect(0, 35, w, 79);
      ctx.fillStyle = p.barrierTop;
      ctx.fillRect(0, 35, w, 5);
      ctx.fillStyle = p.barrierDark;
      ctx.fillRect(0, 111, w, 7);

      // Expansion joints are deliberately irregular so the wall doesn't read
      // like a short repeating texture at race speed.
      let jointX = 35;
      while (jointX < w) {
        ctx.fillStyle = p.barrierDark;
        ctx.globalAlpha = 0.72;
        ctx.fillRect(Math.floor(jointX), 40, 2, 71);
        ctx.globalAlpha = 1;
        jointX += 116 + Math.floor(rnd() * 74);
      }

      // Reflectors and occasional expressway service/inspection plates.
      let markerX = 92 + accentShift;
      while (markerX < w) {
        ctx.fillStyle = this.timeOfDay === 'day' ? '#d2aa54' : '#ffc24d';
        ctx.globalAlpha = this.timeOfDay === 'day' ? 0.62 : 1;
        ctx.fillRect(Math.floor(markerX), 60, 11, 6);
        ctx.globalAlpha = 1;
        markerX += 178 + Math.floor(rnd() * 130);
      }

      const plates = fenceMode === 0 ? [438, 1188] : fenceMode === 1 ? [285, 1015] : fenceMode === 2 ? [566, 1320] : [350, 920, 1430];
      for (const x of plates) {
        ctx.fillStyle = p.barrierDark;
        ctx.globalAlpha = 0.68;
        ctx.fillRect(x, 76, 42, 22);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = p.barrierTop;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, 77, 40, 20);
        ctx.fillStyle = p.barrierTop;
        ctx.fillRect(x + 8, 83, 25, 2);
        ctx.fillRect(x + 8, 89, 16, 2);
      }

      // Occasional structural changes: a taller anti-throw frame, a short
      // solid/no-mesh maintenance bay, or a denser post section. These are
      // intentionally sparse so the skyline remains the hero.
      if (fenceMode === 1) {
        // Tall anti-throw / anti-climb panel.
        ctx.fillStyle = p.fence;
        ctx.fillRect(612, 0, 8, 35);
        ctx.fillRect(858, 0, 8, 35);
        ctx.fillStyle = p.fenceBright;
        ctx.fillRect(620, 4, 238, 3);
        ctx.fillRect(620, 29, 238, 3);
        for (let x = 628; x < 852; x += 16) ctx.fillRect(x, 5, 1, 24);
      } else if (fenceMode === 2) {
        // Solid acoustic/maintenance panel section.
        ctx.fillStyle = p.barrierDark;
        ctx.globalAlpha = 0.94;
        ctx.fillRect(620, 0, 360, 35);
        ctx.globalAlpha = 1;
        ctx.fillStyle = p.barrierTop;
        ctx.fillRect(648, 9, 250, 3);
        ctx.fillRect(648, 19, 188, 2);
      } else if (fenceMode === 3) {
        // Open maintenance span with heavier portal posts and route plate.
        ctx.fillStyle = p.fence;
        ctx.fillRect(410, 0, 9, 35);
        ctx.fillRect(950, 0, 9, 35);
        ctx.fillStyle = this.timeOfDay === 'day' ? '#355d66' : '#173a45';
        ctx.fillRect(660, 7, 116, 21);
        ctx.strokeStyle = p.fenceBright;
        ctx.strokeRect(661, 8, 114, 19);
        ctx.fillStyle = p.fenceBright;
        ctx.fillRect(674, 13, 70, 2);
        ctx.fillRect(674, 19, 44, 2);
      }

      // Restrained grime/drainage streaks along the lower wall.
      ctx.fillStyle = p.barrierDark;
      ctx.globalAlpha = this.timeOfDay === 'day' ? 0.14 : 0.22;
      for (let i = 0; i < 22; i++) {
        const x = Math.floor(rnd() * w);
        const streakH = 4 + Math.floor(rnd() * 17);
        ctx.fillRect(x, 107 - streakH, 1 + Math.floor(rnd() * 2), streakH);
      }
      ctx.globalAlpha = 1;
    });
  }

  createRoadTexture() {
    const p = this.palette();

    this.canvasTexture(this.keys.road, 1024, 260, (ctx, w, h) => {
      const rnd = this.seededRandom((this.timeOfDay === 'day' ? 25101 : 25102) + this.roadVariant * 97);

      ctx.fillStyle = p.road;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = p.roadAlt;
      ctx.fillRect(0, 16, w, 190);
      ctx.fillStyle = p.roadDark;
      ctx.fillRect(0, 241, w, 19);

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
      for (let x = -20; x < w + 100; x += 185) ctx.fillRect(x, 154, 92, 4);
      ctx.globalAlpha = 1;

      // Sparse highway furniture: repaired asphalt, cats-eyes and drain grates.
      // These stay subtle so cars remain the visual focus.
      ctx.globalAlpha = this.timeOfDay === 'day' ? 0.16 : 0.24;
      ctx.fillStyle = p.roadDark;
      for (const [px, py, pw] of [[142, 42, 92], [612, 171, 128], [845, 67, 74]]) {
        ctx.fillRect(px, py, pw, 2);
        ctx.fillRect(px + 9, py + 2, Math.max(18, pw - 28), 1);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = this.timeOfDay === 'day' ? '#d9d8c6' : '#c8c59d';
      ctx.globalAlpha = this.timeOfDay === 'day' ? 0.52 : 0.72;
      for (let x = 78; x < w; x += 252) ctx.fillRect(x, 156, 4, 2);
      ctx.globalAlpha = 1;

      ctx.fillStyle = p.roadDark;
      for (const x of [332, 934]) {
        ctx.fillRect(x, 194, 48, 7);
        ctx.fillStyle = p.roadTexture;
        for (let gx = x + 4; gx < x + 45; gx += 7) ctx.fillRect(gx, 195, 2, 5);
        ctx.fillStyle = p.roadDark;
      }

      // Lower lane edge: sit below the player-car tyres, then transition into
      // a darker shoulder band on the far side so the lane reads correctly.
      ctx.fillStyle = p.barrierTop;
      ctx.globalAlpha = 0.72;
      ctx.fillRect(0, 236, w, 3);
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.roadDark;
      ctx.fillRect(0, 224, w, 36);
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

    // Regional far-background panorama. Keep the procedural backdrop as a
    // fallback for regions/phases that do not yet have authored skyline art.
    this.skyline = null;
    if (this.skylineKey && this.scene.textures.exists(this.skylineKey)) {
      this.backdrop.setVisible(false);
      this.skyline = this.scene.add.image(0, 0, this.skylineKey)
        .setOrigin(0, 0)
        .setDepth(0);

      // Preserve the authored panorama aspect ratio at the established 341px
      // display height. A 4096x512 source therefore becomes ~2728px wide.
      const source = this.scene.textures.get(this.skylineKey)?.getSourceImage?.();
      const sourceW = Number(source?.width || 3072);
      const sourceH = Number(source?.height || 512);
      const displayH = 341;
      const displayW = displayH * (sourceW / Math.max(1, sourceH));
      this.skyline.setDisplaySize(displayW, displayH);

      this.skylineMaxTravel = Math.max(0, this.skyline.displayWidth - this.width);
      const desiredTravel = this.skylineTravelPx == null
        ? Math.min(820, this.skylineMaxTravel)
        : Math.min(this.skylineTravelPx, this.skylineMaxTravel);
      const spareForStart = Math.max(0, this.skylineMaxTravel - desiredTravel);
      this.skylineStartX = spareForStart * this.skylineStartRatio;
      this.skylineTravelLimit = desiredTravel;
      this.skyline.x = -this.skylineStartX;
    }

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
    if (this.skyline) {
      // 0.0131 gives ~400 px of far-background travel over a 1/4 mile at
      // Tokyo SHIFT's 76 px/m world scale: distant enough to feel enormous.
      const desiredTravel = cameraPx * 0.0131;
      const travel = Math.min(desiredTravel, this.skylineTravelLimit ?? this.skylineMaxTravel ?? 0);
      this.skyline.x = -(this.skylineStartX || 0) - travel;
    } else {
      this.backdrop.tilePositionX = cameraPx * 0.24;
    }
    this.rearBarrier.tilePositionX = cameraPx * 0.90;
    this.road.tilePositionX = cameraPx;
    this.foreground.tilePositionX = cameraPx * 1.16;

    const speed = clamp01(speedKmh / 180);
    this.foreground.setAlpha(0.92 + speed * 0.08);
  }
}
