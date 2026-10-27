// Minimal authenticated MCP endpoint. Run behind a VPN/SSH tunnel or HTTPS reverse proxy.
const http=require('node:http');const crypto=require('node:crypto');const {execFile}=require('node:child_process');const {promisify}=require('node:util');const exec=promisify(execFile);
const definitions=[{name:'server_status',description:'Read Linux server uptime, memory and disk usage',inputSchema:{type:'object',properties:{},additionalProperties:false}},{name:'list_services',description:'List running systemd services',inputSchema:{type:'object',properties:{},additionalProperties:false}},{name:'restart_service',description:'Restart an explicitly allowlisted service (only when configured by the administrator)',inputSchema:{type:'object',properties:{service:{type:'string'}},required:['service'],additionalProperties:false}}];
async function execute(name,args,allowed){
 if(name==='server_status'){const results=await Promise.all([exec('uptime',[],{timeout:10000}),exec('free',['-m'],{timeout:10000}),exec('df',['-h','/'],{timeout:10000})]);return results.map(r=>r.stdout).join('\n');}
 if(name==='list_services')return (await exec('systemctl',['list-units','--type=service','--state=running','--no-pager'],{timeout:10000,maxBuffer:1048576})).stdout;
 if(name==='restart_service'){
 const service=args?.service;if(typeof service!=='string'||!/^[a-zA-Z0-9_.@-]+\.service$/.test(service)||!allowed.includes(service))throw Error('Service restart is not allowed by the administrator.');
 await exec('sudo',['-n','systemctl','restart',service],{timeout:30000});return 'Restarted '+service;
 }throw Error('Unknown tool');
}
function createServer({token,allowed=[]}){
 if(typeof token!=='string'||token.length<32)throw Error('ESSAH_MANAGEMENT_TOKEN must have at least 32 characters.');
 return http.createServer(async(req,res)=>{
 const auth=req.headers.authorization||'';const expected='Bearer '+token;
 if(Buffer.byteLength(auth)!==Buffer.byteLength(expected)||!crypto.timingSafeEqual(Buffer.from(auth),Buffer.from(expected))){res.writeHead(401);return res.end('Unauthorized');}
 if(req.url!=='/mcp'||req.method!=='POST'){res.writeHead(404);return res.end();}
 let text='';try{for await(const chunk of req){text+=chunk;if(text.length>65536){res.writeHead(413);return res.end();}}}catch{return;}
 let msg;try{msg=JSON.parse(text);}catch{res.writeHead(400);return res.end('Invalid JSON');}
 res.setHeader('Content-Type','application/json');
 if(!msg||msg.jsonrpc!=='2.0'||typeof msg.method!=='string'){res.writeHead(400);return res.end(JSON.stringify({error:'Invalid JSON-RPC request'}));}
 if(msg.id===undefined){res.writeHead(202);return res.end();}
 let result;
 try{
 if(msg.method==='initialize')result={protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'essah-vps',version:'0.1.0'}};
 else if(msg.method==='ping')result={};
 else if(msg.method==='tools/list')result={tools:definitions.filter(t=>t.name!=='restart_service'||allowed.length)};
 else if(msg.method==='tools/call'){try{result={content:[{type:'text',text:await execute(msg.params?.name,msg.params?.arguments,allowed)}]};}catch{result={isError:true,content:[{type:'text',text:'Operation failed or is not allowed. Check server permissions and service allowlist.'}]};}}
 else {res.end(JSON.stringify({jsonrpc:'2.0',id:msg.id,error:{code:-32601,message:'Method not found'}}));return;}
 res.end(JSON.stringify({jsonrpc:'2.0',id:msg.id,result}));
 }catch{res.writeHead(500);res.end(JSON.stringify({error:'Internal error'}));}
 });
}
if(require.main===module){const server=createServer({token:process.env.ESSAH_MANAGEMENT_TOKEN,allowed:(process.env.ESSAH_ALLOWED_SERVICES||'').split(',').filter(Boolean)});server.listen(Number(process.env.ESSAH_MANAGEMENT_PORT||8787),'127.0.0.1',()=>console.log('Essah MCP listening on 127.0.0.1 (use SSH tunnel or HTTPS reverse proxy)'));}
module.exports={createServer};
