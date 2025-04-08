import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			images: {
				sizes: [640, 828, 1200, 1920, 3840],
				formats: ['image/avif', 'image/webp'],
				minimumCacheTTL: 300,
				domains: ['example-app.vercel.app']
			}
		})
	}

	// config for static adapter
	// kit: {
	// 	adapter: adapter({
	// 		fallback: '404.html'
	// 	}),
	// 	paths: {
	// 		base: process.env.VITE_BUILD_GH_PAGES ? '/kzhang48/cpsc447-g15' : ''
	// 	}
	// }
};

export default config;
