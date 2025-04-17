import React from 'react'

export type StatusType =
  | 'LOADING'
  | 'ERROR'
  | 'INITIATED'
  | 'CANCELED'
  | 'READY'
  | 'BUILDING'
  | 'QUEUED'

export interface VercelTeam {
  [key: string]: unknown
  name?: string
  id?: string
  slug?: string
}

export interface VercelProject {
  [key: string]: unknown
  name?: string
  id?: string
}

export interface VercelDeployment {
  [key: string]: unknown
  uid: string
  created: string
  state: string
  url: string
  creator: {
    [key: string]: unknown
    username?: string
  }
  meta: {
    [key: string]: unknown
    githubCommitMessage: string
    githubCommitRef: string
  }
}

export interface SanityVercelConfig {
  _id: 'secrets.vercelDeploy'
  _type: 'vercelDeploy.config'
  accessToken: string
}

export interface SanityVercelDeployment {
  _id: string
  _type: string
  name: string
  url: string
  project: VercelProject
  team: VercelTeam
  accessToken: string
  disableDeleteAction: boolean
}

export interface PendingProject {
  name: string
  projectId?: string
  teamId?: string
  url: string
  accessToken: string
  disableDeleteAction?: boolean
}

export interface VercelDeployConfig {
  icon?: React.ComponentType
  name?: string
  title?: string
  projects?: Array<Omit<PendingProject, 'accessToken'>>
}
