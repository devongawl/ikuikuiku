import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  server: {
    open: true,
    fs: {
      // Allow serving files from outside the root
      allow: ['..']
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  resolve: {
    // Ensure symlinks are followed
    preserveSymlinks: true
  }
}); 