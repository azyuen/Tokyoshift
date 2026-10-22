#!/usr/bin/env python3
"""Tokyo SHIFT R645: audit actual versioned background files, without modifying assets.

Run from repository root: python3 scripts/audit_backgrounds.py --json ...
Uses only Python stdlib (PNG/WebP headers). Perspective/horizon is ARTISTIC,
and must be visually calibrated; image dimensions alone cannot establish it.
"""
from __future__ import annotations
import argparse, collections, hashlib, json, pathlib, struct
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
EXTS = {".png", ".webp", ".jpg", ".jpeg"}
def dimensions(path):
    with path.open("rb") as f:
        header=f.read(32)
    if header[:8]==b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II",header[16:24]),"PNG"
    if header[:4]==b"RIFF" and header[8:12]==b"WEBP":
        typ=header[12:16]
        if typ==b"VP8X":
            return (1+int.from_bytes(header[24:27],"little"),
                    1+int.from_bytes(header[27:30],"little")),"WEBP"
        if typ==b"VP8 ":
            return (struct.unpack("<H",header[26:28])[0]&0x3fff,
                    struct.unpack("<H",header[28:30])[0]&0x3fff),"WEBP"
    return None,"UNKNOWN"

def group(path):
    p=path.as_posix()
    if p.startswith("assets/Meet/Day/") or p.startswith("assets/Meet/Night/"):
        return "outdoor_meet"
    if p.startswith("assets/Locations/TunerShops/"):
        return "workshop_tuner"
    if p.startswith("assets/Garage/shinonome_"):
        if "office" in p: return "interior_office"
        if "dyno" in p: return "workshop_dyno"
        if "crewspace" in p:return "workshop_crew"
        return "workshop_core"
    if p.startswith("assets/Oshiage/"):
        if "skytree" in p:return "outdoor_oshiage"
        return "interior_oshiage"
    if p.startswith("assets/CentralTokyo/dragcomplex/"):
        return "interior_registration"
    if p.startswith("assets/CentralTokyo/dragstrip/"):
        return "race_multilayer"
    if p.startswith("assets/CentralTokyo/"):
        if "trainstation" in p or "dragstrip" in p:return "outdoor_central"
        if "ginza" in p:return "interior_ginza"
        return "interior_market"
    if p.startswith("assets/Race/Skylines/"):
        return "race_skyline"
    return None

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--json",dest="json_file")
    parser.add_argument("--markdown")
    args=parser.parse_args()
    rows=[]
    for path in sorted((ROOT/"assets").rglob("*")):
        if not path.is_file() or path.suffix.lower() not in EXTS:continue
        rel=path.relative_to(ROOT)
        category=group(rel)
        if not category:continue
        dims,kind=dimensions(path)
        data=path.read_bytes()
        rows.append(dict(path=rel.as_posix(),group=category,
            width=dims[0] if dims else None,height=dims[1] if dims else None,
            ratio=round(dims[0]/dims[1],6) if dims else None,
            format=kind,bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
    groups=collections.defaultdict(list)
    for row in rows:groups[row["group"]].append(row)
    summary={}
    for g,items in sorted(groups.items()):
        sizes=collections.Counter((i["width"],i["height"]) for i in items)
        summary[g]=dict(count=len(items),dimensions=[
            dict(width=w,height=h,count=n) for ((w,h),n) in sizes.most_common()
        ],ratio_count=len(set(i["ratio"] for i in items)))
    byhash=collections.defaultdict(list)
    for item in rows:byhash[item["sha256"]].append(item["path"])
    duplicates=[v for v in byhash.values() if len(v)>1]
    pairs=[]
    for row in rows:
        p=row["path"]
        if "_day." not in p:continue
        corresponding=p.replace("_day.","_night.").replace("/Day/","/Night/")
        matches=[x for x in rows if x["path"]==corresponding]
        if matches:
            other=matches[0]
            pairs.append(dict(day=p,night=corresponding,
                dimensions_match=(row["width"],row["height"])==
                    (other["width"],other["height"])))
    out=dict(date=datetime.now(timezone.utc).isoformat(),
        notes="Perspective/horizon/vanishing points have NOT been measured visually",
        summary=summary,day_night_pairs=pairs,
        mismatched_pairs=[p for p in pairs if not p["dimensions_match"]],
        byte_identical_duplicates=duplicates,images=rows)
    if args.json_file:
        p=ROOT/args.json_file;p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text(json.dumps(out,indent=2)+"\n")
    report=[
        "# Tokyo SHIFT — background image inventory",
        "",
        "**Source:** actual PNG/WebP headers in repository. This does NOT",
        "verify perspective lines or artist-painted vanishing points.",
        "",
        "| Group | Files | Raw canvas dimensions (count) | Aspect ratios |",
        "| --- | ---: | --- | ---: |",
    ]
    for g,entry in summary.items():
        sizes=", ".join(f'{x["width"]}×{x["height"]} ({x["count"]})'
            for x in entry["dimensions"])
        report.append(f'| {g} | {entry["count"]} | {sizes} | {entry["ratio_count"]} |')
    report.extend(["",f'**Day/night pairs found:** {len(pairs)}; '
        f'**dimension mismatches:** {len(out["mismatched_pairs"])}.',
        f'**Byte-identical duplicate groups:** {len(duplicates)}.',
        "",
        "## Day/night dimensional mismatches",
        ""])
    report.extend(
        [f'- `{p["day"]}` versus `{p["night"]}`'
         for p in out["mismatched_pairs"]] or ["None found."]
    )
    report.extend(["","## Actual images by group",""])
    for g,items in sorted(groups.items()):
        report.extend([f"### {g}","",
            "| File | Width | Height | Ratio |",
            "| --- | ---: | ---: | ---: |"])
        report.extend(f'| `{x["path"]}` | {x["width"]} | {x["height"]} | {x["ratio"]} |' for x in items)
        report.append("")
    if args.markdown:
        p=ROOT/args.markdown;p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text("\n".join(report)+"\n")
    print("TOKYO_BACKGROUND_AUDIT_START")
    print(json.dumps(dict(summary=summary,
        pair_mismatches=out["mismatched_pairs"],duplicate_groups=duplicates),
        separators=(",",":")))
    print("TOKYO_NONMASTER_IMAGES_START")
    print(json.dumps([dict(path=x["path"],group=x["group"],
        width=x["width"],height=x["height"]) for x in rows
        if x["group"] in {
            "workshop_core","workshop_crew","workshop_dyno",
            "workshop_tuner","outdoor_meet","outdoor_oshiage",
        } and (x["width"],x["height"])!=(1672,941)]))
    print("TOKYO_NONMASTER_IMAGES_END")
    print("TOKYO_BACKGROUND_AUDIT_END")
    print(f'Checked {len(rows)} background images; {len(pairs)} day/night pairs; '
          f'{len(out["mismatched_pairs"])} dimensional mismatches.')

if __name__=="__main__":main()
