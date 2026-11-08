import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { baseline,candidate } from '../src/profiles.js';
import { orchestrate } from '../src/quality.js';
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
createServer((req,res)=>{
 if(req.url==='/api/report'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(orchestrate(baseline,candidate)));return;}
 res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);
}).listen(4173,'127.0.0.1',()=>console.log('Demo: http://127.0.0.1:4173'));
