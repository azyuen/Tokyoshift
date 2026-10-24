#!/usr/bin/env python3
"""Create visual review sheets of ACTUAL TOKYO SHIFT backgrounds with master guides.

Sheets are QA aids, not proofs that painted vanishing points align.
The output does not modify source artwork or declare calibration complete.
"""
import json, pathlib, re, math
from PIL import Image,ImageDraw,ImageFont
ROOT=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/"docs/background-audit/inventory.json").read_text())
groups={
    "OUTDOOR_MEETS":["outdoor_meet","outdoor_oshiage","outdoor_central"],
    "WORKSHOPS":["workshop_core","workshop_tuner","workshop_crew","workshop_dyno"],
    "STORY_INTERIORS":["interior_ginza","interior_market","interior_office","interior_oshiage","interior_registration"],
}
OUT=ROOT/"docs/background-audit/sheets"
OUT.mkdir(parents=True,exist_ok=True)
TILE_W=336;TILE_H=205;IMG_W=328;IMG_H=176;COLS=4
COLOR_BG="#0d1521";COLOR_TEXT="#e6f2fa";COLOR_MUTED="#aabdcf"
def short_path(path):
    name=pathlib.Path(path).stem
    return re.sub(r"_(day|night)$","",name)
def key(row):
    p=row["path"]
    name=short_path(p)
    ph=0 if "_day." in p else 1 if "_night." in p else 2
    return (row["group"],name,ph)
def tile(sheet,pen,row,left,top,standards):
    path=ROOT/row["path"]
    with Image.open(path) as img:
        img=img.convert("RGB")
        ratio=min(IMG_W/img.width,IMG_H/img.height)
        w=max(1,round(img.width*ratio));h=max(1,round(img.height*ratio))
        thumb=img.resize((w,h),Image.Resampling.LANCZOS)
    bx=left+(TILE_W-w)//2
    by=top+3+(IMG_H-h)//2
    sheet.paste(thumb,(bx,by))
    # Lines use the image geometry, NOT the tile geometry.
    for fraction,color in standards:
        Y=round(by+h*fraction)
        pen.line([(bx,Y),(bx+w,Y)],fill=color,width=2)
    name=row["path"].split("/")[-1]
    pen.text((left+5,top+IMG_H+5),name[:43],fill=COLOR_TEXT)
    pen.text((left+5,top+IMG_H+19),f'{row["width"]} × {row["height"]} | {row["group"]}',fill=COLOR_MUTED)
for title,allowed in groups.items():
    rows=sorted([row for row in manifest["images"] if row["group"] in allowed],key=key)
    if not rows:continue
    nrows=math.ceil(len(rows)/COLS)
    W=COLS*TILE_W;H=73+nrows*TILE_H+30
    out=Image.new("RGB",(W,H),COLOR_BG)
    pen=ImageDraw.Draw(out)
    pen.text((16,12),"TOKYO SHIFT // "+title,fill="#ffffff")
    pen.text((16,30),"Real source assets. Lines are proposed family guides — perspective NOT yet artist-verified.",fill="#f5ce83")
    pen.text((16,46),"ORANGE back limit · CYAN normal ground · PINK near boundary",fill="#b2c7d7")
    bounds=[(.52 if title=="OUTDOOR_MEETS" else .54,"#f1a96e"),
       (.76 if title=="OUTDOOR_MEETS" else .78,"#6eefe8"),
       (.94 if title=="OUTDOOR_MEETS" else .95,"#f19bbb")]
    for n,row in enumerate(rows):
        col=n%COLS;line=n//COLS
        tile(out,pen,row,col*TILE_W,73+line*TILE_H,bounds)
    dest=OUT/(title.lower()+".webp")
    out.save(dest,"WEBP",quality=85,method=6)
    print(dest.relative_to(ROOT),out.size,dest.stat().st_size)
