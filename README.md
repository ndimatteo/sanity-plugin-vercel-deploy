<h3 align="center">
  Vercel Deployment for Sanity
</h3>
<p align="center">
  <strong>Trigger Vercel Deploy Hooks from your Sanity V3 Studio.</strong><br />
✨ LIVE status updates ✨ multiple deployments ✨ active polling ✨ Vercel Teams support ✨
</p>

![vercel-deploy-v3](https://user-images.githubusercontent.com/737188/214927717-ba84450f-8359-401c-acf0-08eeafc22881.png)

<br />

## 🔌 Install

```sh
yarn add sanity-plugin-vercel-deploy
# or npm
npm i sanity-plugin-vercel-deploy
```

> **Warning** <br />This is a **Sanity Studio V3** plugin. For the V2 version, please refer to the [studio-v2 branch](https://github.com/ndimatteo/sanity-plugin-vercel-deploy/tree/studio-v2).

<br />

## ⚙️ Configure

```ts
// `sanity.config.ts` / `sanity.config.js`:
import { defineConfig } from 'sanity'
import { vercelDeployTool } from 'sanity-plugin-vercel-deploy'

export default defineConfig({
  // ...
  plugins: [
    // ...
    vercelDeployTool(),
  ],
})
```

<br />

## 🚀 Your first Vercel Deployment

Once installed, you should see a new "Deploy" tool in your Sanity Studio navbar.

To create a new deployment, click the **"Add Project"** button. Next, you'll be prompted to add the following:

#### `Title`

A name for your deployment to help you organize your deployments. <br />
_Typically, this should be the environment you are deploying to, like `Production` or `Staging`_

#### `Vercel Project Name`

This is the slugified project name listed in your Vercel account. <br />
_You can find this in your Vercel Project under Settings → General → "Project Name"_

#### `Vercel Team Name` _(optional)_

If your project is part of a Vercel Team you must provide this value. <br />
_You can find this in your Vercel Team, under Settings → General → "Team Name"_

#### `Deploy Hook URL`

This is the Vercel Deploy hook you want to trigger builds with. <br />
_You can find this in your Vercel Project under Settings → Git → "Deploy Hooks"_

#### `Vercel Token`

This is a token from your Vercel Account (not project). <br />
_You can find this from your Vercel Account dropdown under Settings → "Tokens"_

<br />

## 🧪 Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

<br />

## 🤝 License

### MIT

> [nickdimatteo.com](https://nickdimatteo.com) &nbsp;&middot;&nbsp;
> Github [@ndimatteo](https://github.com/ndimatteo) &nbsp;&middot;&nbsp;
> Instagram [@ndimatteo](https://instagram.com/ndimatteo)
