import http from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { resolve,extname } from 'node:path';
import { migaApi } from './api.mjs';
const root=resolve('dist'),api=migaApi();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>api(req,res,async()=>{try{
 const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+'/')&&path!==root){res.writeHead(403);return res.end();}
 let file=path;try{if(!(await stat(file)).isFile())file=resolve(root,'index.html');}catch{file=resolve(root,'index.html');}
 const data=await readFile(file);res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.end(data);
 }catch{res.writeHead(503);res.end('Run npm run build before npm start.');}}));
server.listen(Number(process.env.PORT||5184),'0.0.0.0',()=>console.log('MIGA running on port '+(process.env.PORT||5184)));
