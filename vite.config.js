import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/RizoWiki-2.0/',
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.{js,jsx}'],
  },
});
