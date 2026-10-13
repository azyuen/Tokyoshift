# Ref2 stock-car rollout

11 new regular cars, six corrected existing pairs and the supplied R34 pair. Existing car IDs and tuner associations are retained.

All corrected assets retain their authored pixels, 0.32 master scale and bottom-right origin. Small tyres use 182 source pixels; medium uses the existing 194-pixel L preset. Axle X positions were measured from combined body/paint openings at the tyre centre line.

R498: R34 now uses the shared 0.32 scale and bottom-right anchor on its existing 1200x500 canvas, as requested. Medium (194px) tyres use axle offsets -922/-248. The preview shows extra clearance above the tyres; artwork is unchanged.

New engine curves are game approximations calibrated to the requested peak kW, with separate engine IDs, boost, rev limits, mass, gearing and drivetrain traction. Auto Market prices follow existing game pricing, not real-world valuations. Existing regional progression is unchanged.

R499 body seating calibration (source PNG pixels; positive = lower car art):
R34 +36, 3000GT -23, Chaser +15, S2000 +13, 240Z -3,
Familia GT-R +3, Evo V +6, Evo VI +1.
These are `bodyRenderOffsetY` visual values: paint, fixed body shell,
driver silhouette and tuner decals move together while wheel axle X,
wheel diameter, wheel centre Y and tyre/road contact remain unchanged.
In runtime, the fixed wheels continue using the original virtual PNG-bottom
ground line. This preserves the user's hand-calibrated reference axles.

Tuner decals retain saved tuner-shop Y placement coordinates (the reference
PNG bottom-origin) so existing painted decals don't jump vertically.
All scenes now share the same decal registration with the reference art's
true source-canvas centre X, important for widths other than the AE86.
The `body-alignment.html` tool exports original source-pixel coordinates
and resets to these approved defaults.
