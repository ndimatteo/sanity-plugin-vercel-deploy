<h3 align="center">
  Vercel Deployment for Sanity
</h3>
<p align="center">
  <strong>Trigger Vercel Deploy Hooks from your Sanity Studio.</strong><br />
✨ LIVE status updates ✨ multiple deployments ✨ active polling ✨ Vercel Teams support ✨
</p>

![vercel-deploy-v2](https://user-images.githubusercontent.com/737188/117056293-28193f00-acea-11eb-97f6-4c133d5aa401.png)


## Install

Run the following command in your studio folder using the Sanity CLI:

```sh
sanity install vercel-deploy
```

⚠️ **Note:** If your Studio is not using the `@sanity/dashboard` part, you'll need to manually install this as well:

```sh
sanity install @sanity/dashboard
```

## Your first Vercel Deployment
Once installed, you should see a new "Deploy" tool in your Sanity Studio navbar.

Create a new deployment by clicking `Create New`.

Next, you'll be prompted to add the following:

> **`Title`**<br />
> A name for your deployment. This can be whatever you want, to help you organize your deployments. Typically, this should be the environment you are deploying to, like `Production` or `Staging`

> **`Vercel Project Name`**<br />
> This is the actual Project Name listed in your Vercel account. Navigate to your Project Settings within Vercel to find your Project Name.

> **`Vercel Team Slug`**<br />
> If your project is part of a Vercel Team you will need to fill out this field. Navigate to your Team from within Vercel, and use the URL slug (ie. vercel.com/`team-666`).


> **`Deploy Hook URL`**<br />
> This is the Vercel Deploy hook you want to trigger. You can set these up within your Vercel Project, under Settings -> Git and scroll down to the "Deploy Hooks" section. Create your desired hook (ie. "Production Deploy" on `master` branch)

> **`Vercel Token`**<br />
> This is a token from your Vercel Account (not project). Navigate to your Account Settings, and go to "Tokens". Create a new Token, giving it a recognizable name for what it's being used for, like "Sanity Deploy". A Token will be generated for you to copy **once**.

😎 Once you've created your deployment you can now trigger deploys at anytime!

## License

### MIT
> [nickdimatteo.com](https://nickdimatteo.com) &nbsp;&middot;&nbsp;
> Github [@ndimatteo](https://github.com/ndimatteo) &nbsp;&middot;&nbsp;
> Instagram [@ndimatteo](https://instagram.com/ndimatteo)
