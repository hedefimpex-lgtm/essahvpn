// stdio MCP bridge for desktop clients that support custom MCP commands.
const readline=require('node:readline');
const endpoint=process.env.ESSAH_MANAGEMENT_URL||'http://127.0.0.1:8787/mcp';
const u=new URL(endpoint);
if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)))throw Error('Use HTTPS or a local SSH tunnel.');
const token=process.env.ESSAH_MANAGEMENT_TOKEN;if(!token)throw Error('Set ESSAH_MANAGEMENT_TOKEN.');
const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
let queue=Promise.resolve();
input.on('line',line=>{queue=queue.then(async()=>{let m;try{m=JSON.parse(line);const r=await fetch(endpoint,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream',Authorization:'Bearer '+token},body:JSON.stringify(m),signal:AbortSignal.timeout(45000)});if(r.status===202)return;if(!r.ok)throw Error('MCP HTTP '+r.status);const response=await r.json();process.stdout.write(JSON.stringify(response)+'\n');}catch{if(m?.id!==undefined)process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:m.id,error:{code:-32603,message:'VPS connection failed. Check SSH tunnel and management token.'}})+'\n');}});});
