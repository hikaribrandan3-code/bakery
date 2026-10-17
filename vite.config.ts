import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { migaApi } from './server/api.mjs';
export default defineConfig({plugins:[react(),{name:'miga-api',configureServer(server){server.middlewares.use(migaApi({development:true}));}}],server:{host:'0.0.0.0',port:5184,strictPort:true},preview:{host:'0.0.0.0'}});
