const clamp01 = v => Math.max(0, Math.min(1, v));

export default class TokyoExpresswayBackground {
  constructor(scene, {
    timeOfDay = 'night',
    skylineKey = null,
    roadVariant = 0,
    skylineStartRatio = 0,
    skylineTravelPx = null,
    roadsideRegion = '',
    roadsideSeed = 1,
    worldPxPerM = 76,
  } = {}) {
    this.scene = scene;
    this.width = 1560;
    this.skylineKey = skylineKey;
    this.roadVariant = Math.abs(Math.floor(Number(roadVariant) || 0)) % 4;
    this.skylineStartRatio = Phaser.Math.Clamp(Number(skylineStartRatio) || 0, 0, 1);
    this.skylineTravelPx = Number.isFinite(Number(skylineTravelPx)) ? Math.max(0, Number(skylineTravelPx)) : null;
    this.roadsideRegion = String(roadsideRegion || '').trim().toUpperCase();
    this.roadsideSeed = Math.max(1, Math.floor(Number(roadsideSeed) || 1));
    this.worldPxPerM = Math.max(1, Number(worldPxPerM) || 76);
    this.roadsideSegmentM = 100;
    this.roadsideParallax = 0.90;
    this.roadsidePlan = [];
    this.roadsideRng = this.seededRandom(
      0x5f3759df ^ (this.roadsideSeed * 2654435761) ^ (this.roadVariant * 1013)
    );
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


      // Sparse highway furniture: repaired asphalt, cats-eyes and drain grates.
      // These stay subtle so cars remain the visual focus.
      ctx.globalAlpha = this.timeOfDay === 'day' ? 0.16 : 0.24;
      ctx.fillStyle = p.roadDark;
      for (const [px, py, pw] of [[142, 42, 92], [612, 171, 128], [845, 67, 74]]) {
        ctx.fillRect(px, py, pw, 2);
        ctx.fillRect(px + 9, py + 2, Math.max(18, pw - 28), 1);
      }
      ctx.globalAlpha = 1;


      ctx.fillStyle = p.roadDark;
      for (const x of [332, 934]) {
        ctx.fillRect(x, 194, 48, 7);
        ctx.fillStyle = p.roadTexture;
        for (let gx = x + 4; gx < x + 45; gx += 7) ctx.fillRect(gx, 195, 2, 5);
        ctx.fillStyle = p.roadDark;
      }

      // R423 road geometry. R301 moved the entire road layer down by 62 px
      // to reveal more skyline, but the painted lane divider stayed at its old
      // texture coordinate and therefore ended up far too low on screen.
      //
      // Keep the road layer at y=340. The shoulders are subtle grey bands
      // only; the centre dashed divider is the sole white road marking.
      //   screen y 340-356  : upper grey shoulder
      //   screen y 432      : dashed lane divider (just below top-lane tyres)
      //   screen y 514-524  : lower grey shoulder, inset farther below
      //                         the near car's tyres and 8 px thinner.
      const shoulderColour = this.timeOfDay === 'day' ? '#777d82' : '#505860';
      const dividerWhite = this.timeOfDay === 'day' ? '#f0f1ec' : '#d7dce0';

      ctx.globalAlpha = 0.94;
      ctx.fillStyle = shoulderColour;
      ctx.fillRect(0, 0, w, 16);
      ctx.fillRect(0, 174, w, 10);

      ctx.globalAlpha = this.timeOfDay === 'day' ? 0.82 : 0.68;
      ctx.fillStyle = dividerWhite;
      for (let x = -20; x < w + 100; x += 185) {
        ctx.fillRect(x, 92, 92, 4);
      }

      // Small reflectors follow the dashed divider rather than the old,
      // accidentally lowered y=156 position.
      ctx.fillStyle = this.timeOfDay === 'day' ? '#d9d8c6' : '#c8c59d';
      ctx.globalAlpha = this.timeOfDay === 'day' ? 0.52 : 0.72;
      for (let x = 78; x < w; x += 252) ctx.fillRect(x, 94, 4, 2);
      ctx.globalAlpha = 1;
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

  roadsideWeights() {
    const profiles = {
      ODAIBA:    { wbeam: 44, thrie: 22, foliage: 18, ridge: 10, concrete: 6 },
      YOKOHAMA:  { wbeam: 42, thrie: 24, foliage: 16, ridge: 10, concrete: 8 },
      TATSUMI:   { wbeam: 34, thrie: 18, foliage: 28, ridge: 12, concrete: 8 },
      DAIKOKU:   { wbeam: 34, thrie: 18, foliage: 27, ridge: 13, concrete: 8 },
      SHINAGAWA: { wbeam: 36, thrie: 20, foliage: 15, ridge: 14, concrete: 15 },
      SHIBUYA:   { wbeam: 30, thrie: 15, foliage: 10, ridge: 15, concrete: 30 },
      SHINJUKU:  { wbeam: 28, thrie: 14, foliage: 8,  ridge: 15, concrete: 35 },
    };

    return profiles[this.roadsideRegion] || {
      wbeam: 40,
      thrie: 20,
      foliage: 15,
      ridge: 15,
      concrete: 10,
    };
  }

  pickRoadsideStyle(previous = null) {
    const weights = this.roadsideWeights();

    // Let a stretch continue into the next 100 m block sometimes, so the road
    // feels authored rather than changing furniture at every exact interval.
    if (previous && this.roadsideRng() < 0.28) return previous;

    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, weight]) => sum + Number(weight || 0), 0);
    let roll = this.roadsideRng() * total;

    for (const [key, weight] of entries) {
      roll -= Number(weight || 0);
      if (roll <= 0) return key;
    }

    return entries[0]?.[0] || 'wbeam';
  }

  ensureRoadsidePlan(index) {
    const target = Math.max(0, Math.floor(Number(index) || 0));
    while (this.roadsidePlan.length <= target) {
      const previous = this.roadsidePlan.length
        ? this.roadsidePlan[this.roadsidePlan.length - 1]
        : null;
      this.roadsidePlan.push(this.pickRoadsideStyle(previous));
    }
  }

  roadsideHash(segmentIndex, salt = 0) {
    const seed =
      (Number(segmentIndex || 0) + 1) * 12.9898 +
      (Number(salt || 0) + 1) * 78.233 +
      this.roadsideSeed * 0.0137;
    const value = Math.sin(seed) * 43758.5453123;
    return value - Math.floor(value);
  }

  drawWBeam(g, x1, x2, segmentIndex, segmentStartX = x1) {
    const p = this.palette();
    const baseY = 354;
    const postTop = 309;

    // Vary post rhythm by segment and anchor it to the segment's world-space
    // origin. This avoids the "frozen fence" / strobing effect at certain speeds.
    const spacing = 86 + Math.floor(this.roadsideHash(segmentIndex, 2) * 31);
    const phase = 24 + Math.floor(this.roadsideHash(segmentIndex, 3) * 42);
    const firstPostIndex = Math.floor((x1 - segmentStartX - phase) / spacing) - 1;
    const lastPostIndex = Math.ceil((x2 - segmentStartX - phase) / spacing) + 1;

    g.fillStyle(0x12171c, this.timeOfDay === 'day' ? 0.18 : 0.34);
    g.fillRect(x1, baseY - 1, x2 - x1, 4);

    for (let postIndex = firstPostIndex; postIndex <= lastPostIndex; postIndex += 1) {
      const x = segmentStartX + phase + postIndex * spacing;
      if (x < x1 - 10 || x > x2 + 10) continue;

      const width = 4 + Math.floor(this.roadsideHash(segmentIndex, 30 + postIndex) * 3);
      const postDark = Phaser.Display.Color.HexStringToColor(p.fence).color;
      const postBright = Phaser.Display.Color.HexStringToColor(p.fenceBright).color;
      g.fillStyle(postDark, 1);
      g.fillRect(x, postTop, width, baseY - postTop + 1);
      g.fillStyle(postBright, 0.52);
      g.fillRect(x + 1, postTop, 1, baseY - postTop);

      // Occasional painted inspection stripe / reflector on the upright.
      const markRoll = this.roadsideHash(segmentIndex, 90 + postIndex);
      if (markRoll > 0.78) {
        g.fillStyle(markRoll > 0.90
          ? (this.timeOfDay === 'day' ? 0xd9d9d2 : 0xdce8ec)
          : (this.timeOfDay === 'day' ? 0xd2ad58 : 0xffc85b), 0.92);
        g.fillRect(x - 1, postTop + 13, width + 2, 4);
      }
    }

    const rail = Phaser.Display.Color.HexStringToColor(
      this.timeOfDay === 'day' ? '#b6c0c7' : '#76828c'
    ).color;
    const dark = Phaser.Display.Color.HexStringToColor(
      this.timeOfDay === 'day' ? '#7c878f' : '#3d4852'
    ).color;

    g.fillStyle(dark, 1);
    g.fillRect(x1, 313, x2 - x1, 11);
    g.fillStyle(rail, 1);
    g.fillRect(x1, 311, x2 - x1, 5);
    g.fillRect(x1, 320, x2 - x1, 5);
    g.fillStyle(dark, 0.72);
    g.fillRect(x1, 316, x2 - x1, 2);
    g.fillRect(x1, 325, x2 - x1, 2);

    // Reflector spacing also changes by segment, breaking up visual cadence.
    const markerStep = 248 + Math.floor(this.roadsideHash(segmentIndex, 5) * 92);
    const markerPhase = Math.floor(this.roadsideHash(segmentIndex, 6) * markerStep);
    const firstMarker = Math.floor((x1 - segmentStartX - markerPhase) / markerStep) - 1;
    const lastMarker = Math.ceil((x2 - segmentStartX - markerPhase) / markerStep) + 1;
    for (let markerIndex = firstMarker; markerIndex <= lastMarker; markerIndex += 1) {
      const x = segmentStartX + markerPhase + markerIndex * markerStep;
      if (x < x1 - 12 || x > x2 + 12) continue;
      g.fillStyle(this.timeOfDay === 'day' ? 0xd8bd72 : 0xffc85b, 0.9);
      g.fillRect(x, 312, 7 + (Math.abs(markerIndex) % 3), 4);
    }

    // Sparse dark maintenance plates make long stretches read as unique.
    if (this.roadsideHash(segmentIndex, 11) > 0.58) {
      const plateX = segmentStartX + 180 + this.roadsideHash(segmentIndex, 12) * 980;
      if (plateX > x1 - 40 && plateX < x2 + 40) {
        g.fillStyle(dark, 0.88);
        g.fillRect(plateX, 315, 28, 9);
        g.fillStyle(rail, 0.78);
        g.fillRect(plateX + 5, 318, 12, 2);
      }
    }
  }

  drawThrieBeam(g, x1, x2, segmentIndex, segmentStartX = x1) {
    this.drawWBeam(g, x1, x2, segmentIndex, segmentStartX);

    const rail = this.timeOfDay === 'day' ? 0xc1c9ce : 0x84909a;
    const dark = this.timeOfDay === 'day' ? 0x7f8990 : 0x414b54;

    g.fillStyle(dark, 1);
    g.fillRect(x1, 301, x2 - x1, 10);
    g.fillStyle(rail, 1);
    g.fillRect(x1, 299, x2 - x1, 5);
    g.fillStyle(dark, 0.7);
    g.fillRect(x1, 304, x2 - x1, 2);
  }

  drawLowRidge(g, x1, x2, segmentIndex) {
    const p = this.palette();
    const top = 332;
    const bottom = 357;
    const concrete = Phaser.Display.Color.HexStringToColor(p.barrier).color;
    const bright = Phaser.Display.Color.HexStringToColor(p.barrierTop).color;
    const dark = Phaser.Display.Color.HexStringToColor(p.barrierDark).color;

    g.fillStyle(concrete, 1);
    g.fillRect(x1, top, x2 - x1, bottom - top);
    g.fillStyle(bright, 1);
    g.fillRect(x1, top, x2 - x1, 4);
    g.fillStyle(dark, 1);
    g.fillRect(x1, bottom - 4, x2 - x1, 4);

    const jointStep = 210;
    const offset = (segmentIndex * 37) % jointStep;
    for (let x = x1 - offset; x < x2; x += jointStep) {
      g.fillStyle(dark, 0.55);
      g.fillRect(x, top + 4, 2, bottom - top - 8);
    }
  }

  drawFoliage(g, x1, x2, segmentIndex, segmentStartX = x1) {
    this.drawLowRidge(g, x1, x2, segmentIndex);

    const dark = this.timeOfDay === 'day' ? 0x315b39 : 0x173322;
    const mid = this.timeOfDay === 'day' ? 0x48784c : 0x245039;
    const light = this.timeOfDay === 'day' ? 0x659665 : 0x35694a;
    const warm = this.timeOfDay === 'day' ? 0x789f68 : 0x3e7250;

    // Each 100 m segment gets its own cell size and phase. Individual clusters
    // then jitter inside those cells, so the foliage never becomes a repeating
    // metronome at one particular road speed.
    const cell = 46 + Math.floor(this.roadsideHash(segmentIndex, 20) * 18);
    const phase = Math.floor(this.roadsideHash(segmentIndex, 21) * cell);
    const firstCell = Math.floor((x1 - segmentStartX - phase) / cell) - 2;
    const lastCell = Math.ceil((x2 - segmentStartX - phase) / cell) + 2;

    for (let cellIndex = firstCell; cellIndex <= lastCell; cellIndex += 1) {
      const gapRoll = this.roadsideHash(segmentIndex, 1000 + cellIndex * 7);
      if (gapRoll < 0.14) continue; // deliberate little gaps in the planting

      const jitter = (this.roadsideHash(segmentIndex, 1001 + cellIndex * 7) - 0.5) * 24;
      const x = segmentStartX + phase + cellIndex * cell + jitter;
      if (x < x1 - 46 || x > x2 + 46) continue;

      const sizeRoll = this.roadsideHash(segmentIndex, 1002 + cellIndex * 7);
      const shapeRoll = this.roadsideHash(segmentIndex, 1003 + cellIndex * 7);
      const h = 14 + Math.floor(sizeRoll * 16);
      const w = 28 + Math.floor(shapeRoll * 25);
      const yJitter = Math.floor((this.roadsideHash(segmentIndex, 1004 + cellIndex * 7) - 0.5) * 8);

      g.fillStyle(dark, 1);
      g.fillCircle(x + 6, 336 - h * 0.34 + yJitter, Math.max(6, h * 0.50));
      g.fillCircle(x + Math.floor(w * 0.62), 336 - h * 0.43 + yJitter, Math.max(7, h * 0.58));

      if (shapeRoll > 0.36) {
        g.fillCircle(x + Math.floor(w * 0.34), 330 - h * 0.52 + yJitter, Math.max(5, h * 0.43));
      }

      g.fillStyle(mid, 1);
      g.fillCircle(x + 11, 331 - h * 0.39 + yJitter, Math.max(5, h * 0.42));
      g.fillCircle(x + Math.floor(w * 0.70), 333 - h * 0.35 + yJitter, Math.max(5, h * 0.40));

      g.fillStyle(shapeRoll > 0.72 ? warm : light, this.timeOfDay === 'day' ? 0.72 : 0.50);
      g.fillRect(x + 5, 321 - Math.floor(sizeRoll * 5) + yJitter, 5 + Math.floor(shapeRoll * 4), 4);
      if (gapRoll > 0.55) {
        g.fillRect(x + Math.floor(w * 0.58), 325 - Math.floor(shapeRoll * 4) + yJitter, 5, 3);
      }

      // Very occasional flower/sign colour fleck: tiny, but useful at speed.
      const fleck = this.roadsideHash(segmentIndex, 1005 + cellIndex * 7);
      if (fleck > 0.91) {
        g.fillStyle(this.timeOfDay === 'day' ? 0xd5c572 : 0xb4c87a, 0.8);
        g.fillRect(x + Math.floor(w * 0.45), 326 + yJitter, 3, 3);
      }
    }
  }

  drawConcreteBarrier(g, x1, x2, segmentIndex) {
    const p = this.palette();
    const top = 286;
    const bottom = 360;
    const concrete = Phaser.Display.Color.HexStringToColor(p.barrier).color;
    const bright = Phaser.Display.Color.HexStringToColor(p.barrierTop).color;
    const dark = Phaser.Display.Color.HexStringToColor(p.barrierDark).color;

    g.fillStyle(concrete, 1);
    g.fillRect(x1, top, x2 - x1, bottom - top);
    g.fillStyle(bright, 1);
    g.fillRect(x1, top, x2 - x1, 5);
    g.fillStyle(dark, 1);
    g.fillRect(x1, bottom - 7, x2 - x1, 7);

    const jointStep = 154;
    const offset = (segmentIndex * 61) % jointStep;
    for (let x = x1 - offset; x < x2; x += jointStep) {
      g.fillStyle(dark, 0.68);
      g.fillRect(x, top + 6, 2, bottom - top - 13);
    }

    const markerStep = 270;
    for (let x = x1 + ((segmentIndex * 83) % markerStep); x < x2; x += markerStep) {
      g.fillStyle(this.timeOfDay === 'day' ? 0xd3ae62 : 0xffc24d, 0.9);
      g.fillRect(x, top + 22, 10, 6);
    }
  }

  drawRoadside(cameraPx = 0) {
    if (!this.roadside) return;

    const g = this.roadside;
    g.clear();

    const segmentPx =
      this.worldPxPerM *
      this.roadsideSegmentM *
      this.roadsideParallax;
    const scrollPx = Number(cameraPx || 0) * this.roadsideParallax;

    // Start two complete blocks before the race origin so staging at x<0 never
    // reveals an empty left edge.
    const virtualScroll = scrollPx + segmentPx * 2;
    const firstIndex = Math.max(0, Math.floor(virtualScroll / segmentPx) - 1);
    const lastIndex = firstIndex + Math.ceil(this.width / segmentPx) + 3;

    this.ensureRoadsidePlan(lastIndex);

    for (let index = firstIndex; index <= lastIndex; index++) {
      const worldX1 = index * segmentPx;
      const worldX2 = worldX1 + segmentPx;
      const screenX1 = worldX1 - virtualScroll;
      const screenX2 = worldX2 - virtualScroll;

      if (screenX2 < -20 || screenX1 > this.width + 20) continue;

      const x1 = Math.max(-24, screenX1);
      const x2 = Math.min(this.width + 24, screenX2);
      if (x2 <= x1) continue;

      const style = this.roadsidePlan[index] || 'wbeam';

      if (style === 'thrie') {
        this.drawThrieBeam(g, x1, x2, index, screenX1);
      } else if (style === 'foliage') {
        this.drawFoliage(g, x1, x2, index, screenX1);
      } else if (style === 'ridge') {
        this.drawLowRidge(g, x1, x2, index);
      } else if (style === 'concrete') {
        this.drawConcreteBarrier(g, x1, x2, index);
      } else {
        this.drawWBeam(g, x1, x2, index, screenX1);
      }

      // Small end post / seam makes a material change feel physically joined.
      if (screenX2 > 0 && screenX2 < this.width) {
        g.fillStyle(0x202830, 0.72);
        g.fillRect(Math.floor(screenX2) - 2, 300, 4, 58);
      }
    }
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

    this.road = this.scene.add.tileSprite(0, 340, this.width, 270, this.keys.road)
      .setOrigin(0, 0)
      .setDepth(1);

    // Roadside infrastructure is drawn as long 100 m world-space segments.
    // This replaces the old full-height repeating concrete wall and lets the
    // skyline remain visible through open guardrail / foliage stretches.
    this.roadside = this.scene.add.graphics()
      .setDepth(2)
      .setScrollFactor(0);
    this.drawRoadside(0);

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
    this.drawRoadside(cameraPx);
    this.road.tilePositionX = cameraPx;
    this.foreground.tilePositionX = cameraPx * 1.16;

    const speed = clamp01(speedKmh / 180);
    this.foreground.setAlpha(0.92 + speed * 0.08);
  }
}
