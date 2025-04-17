import React, { useState } from 'react'
import useSWR from 'swr'
import spacetime from 'spacetime'

import { TransferIcon } from '@sanity/icons'
import {
  Avatar,
  Box,
  Card,
  Code,
  Flex,
  Label,
  Spinner,
  Stack,
  Text,
  Tooltip,
} from '@sanity/ui'

import { authFetcher } from './utils'

import DeployStatus from './deploy-status'

import type { VercelDeployment, SanityVercelDeployment } from './types'

interface DeployHistoryProps
  extends Omit<
    SanityVercelDeployment,
    '_id' | '_type' | 'name' | 'disableDeleteAction'
  > {}
const DeployHistory: React.FC<DeployHistoryProps> = ({
  url,
  project,
  team,
  accessToken,
}) => {
  const [loading, setIsLoading] = useState(false)

  const deployHookId = url?.split('/').pop()?.split('?').shift()

  const {
    data: { deployments } = { deployments: [] },
    isLoading,
    error,
  } = useSWR(
    [
      `https://api.vercel.com/v6/deployments?projectId=${
        project?.id
      }&meta-deployHookId=${deployHookId}&limit=10${
        team?.id ? `&teamId=${team?.id}` : ''
      }`,
      accessToken,
    ],
    ([url, token]) => authFetcher(url, token),
    {
      errorRetryCount: 3,
      onError: (err) => {
        console.log(err)
      },
    },
  )

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" paddingTop={3}>
        <Spinner size={4} />
        <Box padding={4}>
          <Text size={2}>loading deployment history...</Text>
        </Box>
      </Flex>
    )
  }

  if (error) {
    return (
      <Card padding={4} radius={2} shadow={1} tone="critical">
        <Text size={2} align="center">
          Could not load deployments for {project.id}
        </Text>
      </Card>
    )
  }

  if (!deployments.length) {
    return (
      <Card padding={4} radius={2} shadow={1} tone="critical">
        <Text size={2} align="center">
          No deployments for {project.id}
        </Text>
      </Card>
    )
  }

  return (
    <Box
      as={'ul'}
      padding={0}
      style={{
        maxHeight: '30rem',
      }}
    >
      <Card
        as={'li'}
        padding={4}
        borderBottom
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--card-bg-color)',
          zIndex: 1,
        }}
      >
        <Flex>
          <Box flex={3}>
            <Label muted>Preview URL</Label>
          </Box>
          <Box flex={1} marginLeft={2}>
            <Label muted>Status</Label>
          </Box>
          <Box flex={3} marginLeft={2} style={{ maxWidth: '50%' }}>
            <Label muted>Commit</Label>
          </Box>
          <Box flex={1} marginLeft={2}>
            <Label align="right" muted>
              Deployed At
            </Label>
          </Box>
        </Flex>
      </Card>

      {deployments?.map((deployment: VercelDeployment) => (
        <Card key={deployment.uid} as={'li'} padding={4} borderBottom>
          <Flex align="center">
            <Box flex={3}>
              <Text weight="medium">
                <Box
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <a
                    href={`https://${deployment.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit' }}
                  >
                    {deployment.url}
                  </a>
                </Box>
              </Text>
            </Box>
            <Box flex={1} marginLeft={2}>
              <Text>
                <DeployStatus status={deployment.state} />
              </Text>
            </Box>
            <Box flex={3} marginLeft={2} style={{ maxWidth: '40%' }}>
              <Stack space={2}>
                <Text size={1}>
                  <Box
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {deployment.meta?.githubCommitMessage}
                  </Box>
                </Text>
                <Flex gap={2} align="center">
                  <TransferIcon width="1em" height="1em" />
                  <Code size={1}>
                    <Box
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {deployment.meta?.githubCommitRef}
                    </Box>
                  </Code>
                </Flex>
              </Stack>
            </Box>
            <Flex flex={1} justify="flex-end" marginLeft={2}>
              <Flex gap={2} align="center">
                <Text size={1} style={{ whiteSpace: 'nowrap' }} muted>
                  {spacetime.now().since(spacetime(deployment.created)).rounded}
                </Text>
                <Tooltip
                  content={
                    <Text muted size={1}>
                      {deployment.creator?.username}
                    </Text>
                  }
                  animate
                  fallbackPlacements={['left']}
                  placement="top"
                  portal
                >
                  <Avatar
                    alt={deployment.creator?.username}
                    src={`https://vercel.com/api/www/avatar/${deployment.creator?.uid}?&s=48`}
                    size={1}
                  />
                </Tooltip>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      ))}
    </Box>
  )
}

export default DeployHistory
