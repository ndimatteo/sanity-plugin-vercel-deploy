export const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' ? true : false
export const API_VERSION = '2025-01-01'
export const VERCEL_DEPLOY_TYPE = 'vercel_deploy'
export const VERCEL_DEPLOY_QUERY = `*[_type == "${VERCEL_DEPLOY_TYPE}"] | order(_createdAt)`
export const VERCEL_DEPLOY_SECRETS_QUERY = `*[_id == "secrets.vercelDeploy"]`

export const INITIAL_PENDING_PROJECT = {
  name: '',
  projectId: '',
  teamId: '',
  url: '',
  accessToken: '',
  disableDeleteAction: false,
}
