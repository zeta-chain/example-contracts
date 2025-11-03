import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force ethers to resolve to a single instance from the frontend's node_modules
      ethers: resolve(__dirname, 'node_modules/ethers'),
    },
    dedupe: ['ethers'],
  },
});
