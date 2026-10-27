const {test}=require('node:test');const assert=require('node:assert/strict');const {createServer}=require('../management/server');
test('management endpoint authenticates, initializes MCP and denies unauthorized service changes',async t=>{
 const token='test-token-012345678901234567890123456';const server=createServer({token});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const url=`http://127.0.0.1:${server.address().port}/mcp`;
 assert.equal((await fetch(url,{method:'POST'})).status,401);
 const call=async(method,params)=>{const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});assert.equal(r.status,200);return r.json();};
 assert.equal((await call('initialize')).result.serverInfo.name,'essah-vps');
 const tools=(await call('tools/list')).result.tools;assert.equal(tools.length,2);assert.ok(!tools.some(t=>t.name==='restart_service'));
 const denied=await call('tools/call',{name:'restart_service',arguments:{service:'sshd.service'}});assert.equal(denied.result.isError,true);
 const status=await call('tools/call',{name:'server_status',arguments:{}});assert.ok(!status.result.isError);assert.match(status.result.content[0].text,/Mem:/);
});
test('stdio bridge carries MCP initialize and tool requests over authenticated HTTP',async t=>{
 const {spawn}=require('node:child_process');const {createInterface}=require('node:readline');const {once}=require('node:events');const path=require('node:path');
 const token='test-bridge-012345678901234567890123456';const server=createServer({token});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const child=spawn(process.execPath,[path.join(__dirname,'../management/client.js')],{env:{...process.env,ESSAH_MANAGEMENT_TOKEN:token,ESSAH_MANAGEMENT_URL:`http://127.0.0.1:${server.address().port}/mcp`},stdio:['pipe','pipe','pipe']});
 t.after(async()=>{child.kill();await new Promise(r=>server.close(r));});
 const lines=createInterface({input:child.stdout});t.after(()=>lines.close());
 async function call(id,method,params){const response=once(lines,'line',{signal:AbortSignal.timeout(5000)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');return JSON.parse((await response)[0]);}
 assert.equal((await call(1,'initialize',{})).result.serverInfo.name,'essah-vps');
 const r=await call(2,'tools/call',{name:'server_status',arguments:{}});assert.equal(r.id,2);assert.match(r.result.content[0].text,/Mem:/);
});
