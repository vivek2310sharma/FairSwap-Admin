import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const cases=[['missing',{}],['production-maintenance',{FAIRSWAP_DEPLOYMENT_ENV:'production',FAIRSWAP_SUPABASE_URL:'https://kriuhwppxgxsyyrbjsau.supabase.co',FAIRSWAP_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_fixture_not_a_real_key',FAIRSWAP_ADMIN_RELEASE_STATE:'maintenance'}],['preview-production-mismatch',{VERCEL:'1',VERCEL_ENV:'preview',FAIRSWAP_DEPLOYMENT_ENV:'production',FAIRSWAP_SUPABASE_URL:'https://kriuhwppxgxsyyrbjsau.supabase.co',FAIRSWAP_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_fixture_not_a_real_key',FAIRSWAP_ADMIN_RELEASE_STATE:'active'}]];
for(const [name,settings] of cases){
 const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};
 for(const key of ['FAIRSWAP_DEPLOYMENT_ENV','FAIRSWAP_SUPABASE_URL','FAIRSWAP_SUPABASE_PUBLISHABLE_KEY','FAIRSWAP_ADMIN_RELEASE_STATE','FAIRSWAP_AUTH_DIAGNOSTICS','VERCEL','VERCEL_ENV'])delete env[key];
 Object.assign(env,settings);
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3157'],{env,stdio:['ignore','pipe','pipe']});
 const exited=new Promise(resolve=>server.on('exit',resolve));let ready=false;
 server.stdout.on('data',chunk=>{if(chunk.toString().includes('Ready'))ready=true;});server.stderr.resume();
 try{
  for(let i=0;i<80&&!ready;i++)await sleep(100);assert(ready,'loopback server failed to become ready');
  const origin='http://127.0.0.1:3157';
  const page=await fetch(origin+'/auth/sign-in');assert.equal(page.status,200);const body=await page.text();assert(body.includes('Sign-in is disabled.'));assert(!body.includes('name="password"'));
  const access=await fetch(origin+'/admin/access');assert.equal(access.status,403);assert.match(access.headers.get('cache-control')??'',/no-store/);
  console.log(JSON.stringify({scenario:name,result:'PASS',signIn:page.status,protectedAccess:access.status,staffCredentials:'none',transport:'loopback HTTP only'}));
 }finally{server.kill();await exited;}
}
