import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        host: '0.0.0.0',
        allowedHosts: [
            'localhost',
            '127.0.0.1',
            '169.254.0.21',
            '5173-i6871lolvjs2iq4u48kmt-44e25fd7.manusvm.computer',
        ],
        hmr: {
            clientPort: 443,
        },
    },
});
