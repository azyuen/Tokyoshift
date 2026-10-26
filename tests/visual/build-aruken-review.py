"""Package real browser captures; never synthesize replacement gameplay images."""
from pathlib import Path
import json,base64,html,zipfile
root=Path('docs/story-audit');shots=root/'screenshots'
records=[]
for phase in ['before','after']:
 for mode in ['stage','dialogue','finale','hold']:
  p=shots/f'{phase}-{mode}'/'results.json'
  if p.exists():
   data=json.loads(p.read_text())
   for r in data['results']:
    if r.get('file') and not r.get('error'):records.append(dict(r,phase=phase,mode=mode,path=f'screenshots/{phase}-{mode}/'+r['file']))
lookup={(r['ch'],r['index'],r['device'],r['mode'],r['phase']):r for r in records}
css='''body{margin:0;background:#101824;color:#e7edf4;font:16px/1.5 system-ui}header,main{max-width:1320px;margin:auto;padding:24px}h1{font-size:36px;margin-bottom:8px}p{max-width:1000px;color:#bbc9d8}nav{position:sticky;top:0;background:#19273a;padding:16px;z-index:2;display:flex;gap:12px;flex-wrap:wrap}select,button{font:inherit;padding:8px;background:#233952;color:white;border:1px solid #65778e;border-radius:5px}article{margin:24px 0;background:#19273a;padding:16px;border-radius:8px}article h2{font-size:20px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{width:100%;height:auto;background:#060912}figure{margin:0}figcaption{padding:6px 0;color:#b0c2d7}a{color:#91d9df}@media(max-width:720px){.pair{grid-template-columns:1fr}header,main{padding:16px}}'''
intro='''<header><p>TOKYO SHIFT / PRESENTATION AUDIT</p><h1>Aruken Story Mode · Chapters 01–10</h1><p>Real Phaser captures at mobile 844 × 390 and tablet 1180 × 820. Before: R686. After: dedicated audit branch. Isolated presentation fixtures, not a complete gameplay playthrough or physical-device test. No merge or deployment.</p><p>Stage comparisons show cast scale, spacing, floors, crowds and car displays. Cutscene captures show the final dialogue page; all pages are advanced by the harness. Read CHANGELOG.md for chapter details and test limits.</p></header>'''
controls='''<nav><label>Chapter <select id="chapter"><option value="">All</option>'''+''.join(f'<option value="{i}">{i:02}</option>' for i in range(1,11))+'''</select></label><label>Viewport <select id="device"><option>mobile</option><option>tablet</option></select></label><label>View <select id="mode"><option value="">All</option><option>stage</option><option>dialogue</option><option>finale</option><option>hold</option></select></label><span id="count"></span></nav>'''
js='''<script>function filter(){let count=0;document.querySelectorAll('article').forEach(a=>{a.hidden=(chapter.value&&a.dataset.chapter!==chapter.value)||(a.dataset.device!==device.value)||(mode.value&&a.dataset.mode!==mode.value);if(!a.hidden)count++});document.getElementById('count').textContent=count+' comparisons'}for(const id of ['chapter','device','mode'])document.getElementById(id).addEventListener('change',filter);filter();</script>'''
featured={1:[18],2:[21],3:[15],4:[9],5:[107],6:[3],7:[53],8:[62,10],9:[44,55],10:[49,63]}
for standalone in [False,True]:
 parts=['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aruken story visual audit</title><style>'+css+'</style>',intro,controls,'<main>']
 selected=[]
 for r in records:
  if r['phase']!='after':continue
  if standalone and not (r['mode'] in ['finale','hold'] or r['mode']=='stage' and r['index'] in featured.get(r['ch'],[])):continue
  selected.append(r)
 for r in sorted(selected,key=lambda r:(r['ch'],r['mode'],r['index'],r['device'])):
  parts.append(f'<article data-chapter="{r["ch"]}" data-device="{r["device"]}" data-mode="{r["mode"]}"><h2>Chapter {r["ch"]:02} · {html.escape(r["title"])} · {r["mode"]} {r["index"]}</h2><div class="pair">')
  for phase in ['before','after']:
   item=lookup.get((r['ch'],r['index'],r['device'],r['mode'],phase))
   if item:
    src=item['path']
    if standalone:src='data:image/jpeg;base64,'+base64.b64encode((root/src).read_bytes()).decode()
    parts.append(f'<figure><figcaption>{phase.upper()} · {r["device"]}</figcaption><a href="{src}" target="_blank"><img loading="lazy" src="{src}" alt="{phase} chapter {r["ch"]} {r["mode"]}"></a></figure>')
   else:parts.append('<figure><figcaption>New interaction check</figcaption></figure>')
  parts.append('</div></article>')
 parts+=['</main>',js,'</html>']
 (root/('Aruken-review.html' if standalone else 'index.html')).write_text('\n'.join(parts))
(root/'capture-manifest.json').write_text(json.dumps(records,indent=2))
print(f'{len(records)} captures packaged into galleries')
