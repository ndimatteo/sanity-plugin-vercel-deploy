import { nanoid } from 'nanoid'
import { SanityClient, SanityDocument } from 'sanity'
import { DeploySchema, SanityDeploySchema } from '../types'
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
