import { definePlugin } from 'sanity'
import { route } from 'sanity/router'

import { default as deployIcon } from './deploy-icon'
import type { VercelDeployConfig } from './types'
import VercelDeploy from './vercel-deploy'

export const vercelDeployTool = definePlugin<VercelDeployConfig | void>(
  (options) => {
    const { name, title, icon, ...config } = options || {}

    return {
      name: 'sanity-plugin-vercel-deploy',
      tools: [
        {
          name: name || 'vercel-deploy',
          title: title || 'Deploy',
          icon: icon || deployIcon,
          component: VercelDeploy,
          options: config,
          router: route.create('/*'),
        },
      ],
    }
  }
)
