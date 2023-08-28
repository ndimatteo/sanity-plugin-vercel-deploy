import { Tool, definePlugin } from 'sanity'
import { route } from 'sanity/router'

import { default as deployIcon } from './deploy-icon'
import type { DefaultDeploy, VercelDeployConfig } from './types'
import {
  createDeploy,
  getProjectDeployNames,
  remapDeploySchemaFromDeployInfo,
} from './utils'
import { API_VERSION } from './utils/constants'
import VercelDeploy from './vercel-deploy'

export type VercelDeployOptions = VercelDeployConfig | void
const router = route.create('/*')
export const getBaseOptions = (opts: VercelDeployOptions): Tool => {
  return {
    name: opts?.name ?? 'vercel-deploy',
    title: opts?.title ?? 'Deploy',
    icon: opts?.icon ?? deployIcon,
    component: VercelDeploy,
    router,
  }
}
export const vercelDeployTool = definePlugin<VercelDeployOptions>((options) => {
  return {
    name: 'sanity-plugin-vercel-deploy',
    tools: (tools, ctx) => {
      if (options?.defaultDeploy) {
        const { defaultDeploy } = options

        const client = ctx.getClient({ apiVersion: API_VERSION })

        const handleProjectCreate = async (
          projectNames: string[],
          deploy: DefaultDeploy
        ) => {
          if (projectNames.includes(deploy.projectName)) return

          await createDeploy(client, {
            doc: remapDeploySchemaFromDeployInfo(deploy),
          })
        }

        getProjectDeployNames(client)
          .then((deployNames) => {
            return deployNames.map(({ vercelProject }) => vercelProject)
          })
          .then(async (names) => {
            if (Array.isArray(defaultDeploy)) {
              defaultDeploy.forEach(async (deploy) => {
                await handleProjectCreate(names, deploy)
              })
            } else {
              await handleProjectCreate(names, defaultDeploy)
            }
          })
      }

      return [...tools, getBaseOptions(options)]
    },
  }
})
