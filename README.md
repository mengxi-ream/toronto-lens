# CPSC447 Project

D3 Visualization for UBC CPSC447

[Live Demo](https://pages.github.students.cs.ubc.ca/kzhang48/cpsc447-g15/)

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

## How to deploy

```bash
pnpm gh-pages
```

Now only Kuiliang Zhang has access to deploy the website because the script is set to push to his GitHub Pages.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment. We use static adapter for this project.
