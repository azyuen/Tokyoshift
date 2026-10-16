#!/usr/bin/env python3
"""Compare Node test files with an isolated main checkout. Browser tests run separately."""
import argparse, concurrent.futures, hashlib, json, pathlib, re, subprocess
p=argparse.ArgumentParser();p.add_argument('--baseline',required=True);a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];baseline=pathlib.Path(a.baseline).resolve()
out=root/'artifacts/engineering/regressions';out.mkdir(parents=True,exist_ok=True)
files=sorted(x.name for x in (root/'tests').iterdir() if x.suffix in ('.mjs','.js') and 'playwright' not in x.read_text())
def run(job):
 label,folder,name=job
 if not (folder/'tests'/name).exists():return label,name,{'status':'absent'}
 try:
  r=subprocess.run(['node','--test','--test-reporter=tap','tests/'+name],cwd=folder,capture_output=True,text=True,timeout=120)
  log=r.stdout+r.stderr;status='pass' if r.returncode==0 else 'fail'
 except subprocess.TimeoutExpired as e:
  log=str(e);status='timeout'
 (out/(label+'-'+name+'.txt')).write_text(log)
 failed=re.findall(r'^not ok \d+ - (.*)$',log,re.M)
 errors=re.findall(r'^\s+error: (.*)$',log,re.M)
 counts={k:int(v) for k,v in re.findall(r'^# (tests|pass|fail|skipped) (\d+)$',log,re.M)}
 return label,name,{'status':status,'counts':counts,'failedTests':failed,'errors':[s[:600] for s in errors],'diagnosticExcerpt':log[:1400] if status!='pass' else '', 'missingFileErrors':bool(re.search(r'ENOENT|no such file|missing sprite|missing home-screen art',log,re.I)),'logSHA256':hashlib.sha256(log.encode()).hexdigest()}
result={'baseline':subprocess.check_output(['git','rev-parse','HEAD'],cwd=baseline,text=True).strip(),'engineering':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'scope':'Node tests only; sparse checkouts omit assets; browser tests excluded','files':{}}
jobs=[(label,folder,name) for name in files for label,folder in [('main',baseline),('engineering',root)]]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for label,name,data in pool.map(run,jobs):result['files'].setdefault(name,{})[label]=data
for v in result['files'].values():
 b=v['main'];e=v['engineering'];v['newFailedTests']=sorted(set(e.get('failedTests',[]))-set(b.get('failedTests',[])))
path=root/'docs/engineering/regression-comparison.json';path.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({label:{status:sum(v[label]['status']==status for v in result['files'].values()) for status in ['pass','fail','timeout','absent']} for label in ['main','engineering']}))
for name,v in result['files'].items():
 if v['newFailedTests']:print(name,json.dumps(v['newFailedTests']))
