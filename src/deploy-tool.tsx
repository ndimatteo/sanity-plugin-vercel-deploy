import { lazy } from 'react'
import { definePlugin } from 'sanity'
import { route } from 'sanity/router'

import { default as deployIcon } from './deploy-icon'
import type { VercelDeployConfig } from './types'

/**
 * @public
 */
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
          component: lazy(() => import('./vercel-deploy')),
          options: config,
          router: route.create('/*'),
        },
      ],
    }
  }
)
