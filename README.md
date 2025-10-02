> 🇵🇸 **Statement of Solidarity** 🇵🇸<br /> I stand in unwavering support of the Palestinian people and their right to freedom, safety, and self-determination.

> 🚫 I do not support Vercel or its leadership — whose public actions and statements have aligned with the oppression and genocide of Palestinians. **As a result, this plugin is no longer maintained and will not receive future updates or support.**

> ✊ This plugin remains available for legacy use, but I encourage all users to explore alternative hosting platforms that better align with human rights and ethical responsibility.

<h3 align="center">
  <img src="https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png" height="40">
  <br />
  Vercel Deployments for Sanity
</h3>
<p align="center">
  <strong>Deploy. Monitor. Repeat — without leaving the Studio.</strong><br />
✨ One-click deploys ✨ LIVE status updates ✨ Automatic configuration ✨
</p>

![sanity-plugin-vercel-deploy-v4](https://cdn.sanity.io/images/5ngo93jw/production/51e176d24e118b356a6f628658f9b23cdb5fe382-3318x2072.png)

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
    vercelDeployTool({
      // Optional preconfigured projects
      projects: [
        {
          name: 'Production',
          projectId: '<project_id>',
          teamId: '<team_id>',
          url: '<deploy_hook_url>',
        },
      ],
    }),
  ],
})
```

<br />

## 🚀 Your first Vercel Deployment

Once installed, you should see a new "Deploy" tool in your Sanity Studio navbar.

To create a new project deployment, click the **"Add Project"** button. You'll be prompted to add the following:

#### `Display Name`

A name for your deployment to help you organize your deployments in Sanity. <br />
_This can be the environment you are deploying to, like `Production` or `Staging`_

#### `Project ID`

This is the project ID listed in the Vercel Project settings. <br />
_You can find this in your Vercel Project under Settings → General → "Project ID"_

#### `Team ID` _(optional)_

If your project is part of a Vercel Team you must provide the Team’s ID. <br />
_You can find this in your Vercel Team, under Settings → General → "Team ID"_

#### `Deploy Hook URL`

This is the Vercel Deploy hook you want to trigger builds with. <br />
_You can find this in your Vercel Project under Settings → Git → "Deploy Hooks"_

#### `Access Token`

This is a valid, scoped token from your Vercel Personal Account (not team or project). <br />
_You can find this in your Vercel Account dropdown under Account Settings → "Tokens"_

#### `Prevent deletion in production?` _(optional)_

This option disables the "Delete" action in the UI for `production` [environments of the Studio](https://www.sanity.io/docs/environment-variables#7f90f065848c).

<br />

## ⚡️ Preconfigured Projects

Projects can be preconfigured by defining a projects array in the tool’s options ([see example code above](#%EF%B8%8F-configure)).

> **Warning** <br />_Never_ include your Access Token in the Studio or plugin config – this [exposes your token in the client bundle](https://www.sanity.io/docs/environment-variables#c22c023216f9). Instead, you’ll be prompted to add it securely as a Studio Secret when the tool is first initialized. Once added, it can be updated anytime from the tool’s UI, next to the “Add Project” button.

> **Note** <br />The "Edit" and "Delete" actions are disabled in `production` environments of the Studio for all preconfigured projects.

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
