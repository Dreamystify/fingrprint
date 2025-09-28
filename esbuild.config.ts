/**
 * @fileoverview esbuild configuration for @dreamystify/fingrprint
 * 
 * This configuration handles ES module bundling for the fingrprint 
 * distributed ID generation library.
 * 
 * @author Corey Lylyk
 * @version 2.0.0
 */

import { build, type BuildOptions } from 'esbuild';

const config: BuildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  outdir: 'lib',
  platform: 'node',
  target: 'ES2022',
  sourcemap: true,
  external: ['ioredis', 'big-integer', 'redis']
};

async function buildLibrary() {
  try {
    console.log(`🚀 Building @dreamystify/fingrprint...`);
    const startTime = Date.now();
    
    await build(config);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ Build completed successfully in ${duration}ms!`);
    console.log(`📦 Output: lib/index.js`);
    console.log(`🎯 Format: ES modules`);
    console.log(`🔧 Target: ${config.target}`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildLibrary();
}

export default config;