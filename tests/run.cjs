// Runs every tests/*.test.cjs in a fresh Node process.
// A test fails if it crashes, exits non-zero, or reports page errors (lines like `errors [...]` that are not empty).
const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path');
const files=fs.readdirSync(__dirname).filter(f=>f.endsWith('.test.cjs')).sort();
let failed=0;
for(const f of files){
  const r=spawnSync(process.execPath,[path.join(__dirname,f)],{encoding:'utf8',timeout:60000});
  const out=(r.stdout||'')+(r.stderr||'');
  const pageErrors=out.split('\n').filter(l=>/^errors\d?\s/.test(l)&&!/\[\]\s*$/.test(l));
  const crashed=r.status!==0||/\b(TypeError|ReferenceError|SyntaxError)\b/.test(out);
  const ok=!crashed&&!pageErrors.length;
  console.log(`${ok?'PASS':'FAIL'}  ${f}`);
  if(!ok){failed++;console.log(out.split('\n').map(l=>'      '+l).join('\n'))}
}
console.log(`\n${files.length-failed}/${files.length} test files passed`);
process.exit(failed?1:0);
