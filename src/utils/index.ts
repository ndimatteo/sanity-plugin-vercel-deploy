import { nanoid } from 'nanoid'
import { SanityClient, SanityDocument } from 'sanity'
import { DefaultDeploy, DeploySchema, SanityDeploySchema } from '../types'
import { WEBHOOK_TYPE } from './constants'

export type DeployInfo = {
  doc: DeploySchema
}

export const createDeploy = (
  client: SanityClient,
  opts: DeployInfo
): Promise<SanityDocument & SanityDeploySchema> => {
  const { doc } = opts

  return client.create({
    // Explicitly define an _id inside the vercel-deploy path to make sure it's not publicly accessible
    // This will protect users' tokens & project info. Read more: https://www.sanity.io/docs/ids
    _id: `vercel-deploy.${nanoid()}`,
    _type: WEBHOOK_TYPE,
    ...doc,
  })
}

export const getProjectDeployNames = (
  client: SanityClient
): Promise<{ vercelProject: string }[]> => {
  const WEBHOOK_QUERY = `*[_type == "${WEBHOOK_TYPE}"] { vercelProject } | order(_createdAt)`

  return client.fetch<Array<{ vercelProject: string }>>(WEBHOOK_QUERY)
}

export const remapDeploySchemaFromDeployInfo = (
  deploy: DefaultDeploy
): DeploySchema => {
  return {
    name: deploy.name,
    url: deploy.url,
    vercelProject: deploy.projectName,
    vercelTeam: {
      name: deploy.teamName,
      id: undefined,
      slug: undefined,
    },
    vercelToken: deploy.token,
    disableDeleteAction: deploy.disableDelete,
  }
}
