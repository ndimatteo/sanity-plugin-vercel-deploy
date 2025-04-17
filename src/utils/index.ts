import { SanityClient } from 'sanity'
import { uuid } from '@sanity/uuid'
import axios from 'axios'

import { VERCEL_DEPLOY_TYPE } from './constants'

import type { SanityVercelDeployment, SanityVercelConfig } from '../types'

export const authFetcher = async (url: string, token: string) => {
  if (!token) throw new Error('Missing access token')
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return res.data
}

// fetch Team Name by ID
// Docs: https://vercel.com/docs/rest-api/reference/endpoints/teams/get-a-team
export const getTeamById = (teamId?: string, accessToken?: string) => {
  const url = new URL(`https://api.vercel.com/v2/teams/${teamId}`)

  return axios.get(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

// fetch Project Name by ID
// Docs: https://vercel.com/docs/rest-api/reference/endpoints/projects/find-a-project-by-id-or-name
export const getProjectById = (
  projectId?: string,
  accessToken?: string,
  teamId?: string,
) => {
  const url = new URL(`https://api.vercel.com/v9/projects/${projectId}`)

  if (teamId) {
    url.searchParams.append('teamId', teamId)
  }

  return axios.get(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export const createProject = (
  client: SanityClient,
  deployment: Omit<SanityVercelDeployment, '_id' | '_type'>,
): Promise<SanityVercelDeployment> => {
  const documentId = uuid()

  const doc: SanityVercelDeployment = {
    // Explicitly define an _id inside the vercel-deploy path to make sure it's not publicly accessible
    // This will protect users' tokens & project info. Read more: https://www.sanity.io/docs/ids
    _id: `vercel-deploy.${documentId}`,
    _type: VERCEL_DEPLOY_TYPE,
    ...deployment,
  }

  return client.create(doc)
}

export const saveVercelDeployAccessToken = (
  client: SanityClient,
  accessToken: string,
): Promise<SanityVercelConfig> => {
  const doc: SanityVercelConfig = {
    _id: 'secrets.vercelDeploy',
    _type: 'vercelDeploy.config',
    accessToken,
  }

  return client.createOrReplace(doc)
}
