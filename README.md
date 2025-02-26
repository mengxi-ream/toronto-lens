# CPSC447 Project

D3 Visualization for UBC CPSC447

## Developing

Once you've created a project and installed dependencies with `pnpm install` (or `npm install` or `yarn`), start a development server:

We recommend using pnpm to install dependencies, but you can use npm or yarn as well.

To run the development server, run the following command:

```bash
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev --open
```

## Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with `pnpm preview`.

## How to find the index.html entry point

After running `pnpm build`, you can find the index.html entry point in the `build` folder. You can use VSCode Live Server extension to view the website.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment. We use static adapter for this project.
