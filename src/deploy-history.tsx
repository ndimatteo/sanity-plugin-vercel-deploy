import axios from 'axios'
import React, { useEffect, useState } from 'react'
import spacetime from 'spacetime'

import { TransferIcon } from '@sanity/icons'
import {
  Avatar,
  Box,
  Card,
  Flex,
  Inline,
  Label,
  Spinner,
  Stack,
  Text,
  Tooltip,
} from '@sanity/ui'

import DeployStatus from './deploy-status'
import type { Deployments, SanityDeploySchema } from './types'

interface DeployHistoryProps
  extends Omit<SanityDeploySchema, '_id' | 'name' | 'disableDeleteAction'> {}
const DeployHistory: React.FC<DeployHistoryProps> = ({
  url,
  vercelProject,
  vercelToken,
  vercelTeam,
}) => {
  const [deployments, setDeployments] = useState<Deployments[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const deployHookId = url?.split('/').pop()?.split('?').shift()

  useEffect(() => {
    if (!vercelProject) {
      return
    }
    setLoading(true)

    axios
      .get(
        `https://api.vercel.com/v5/now/deployments?projectId=${vercelProject}&meta-deployHookId=${deployHookId}&limit=6${
          vercelTeam?.id ? `&teamId=${vercelTeam?.id}` : ''
        }`,
        {
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${vercelToken}`,
          },
        }
      )
      .then(({ data }) => {
        setDeployments(data.deployments)
        setLoading(false)
        setError(false)
      })
      .catch((e) => {
        setLoading(false)
        setError(true)
        console.warn(e)
      })
  }, [url, vercelProject, vercelTeam?.id, vercelToken])

  if (loading) {
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
          Could not load deployments for {vercelProject}
        </Text>
      </Card>
    )
  }

  return (
    <Box as={'ul'} padding={0}>
      <Card as={'li'} padding={4} borderBottom>
        <Flex>
          <Box flex={3}>
            <Label muted>Preview URL</Label>
          </Box>
          <Box flex={1} marginLeft={2}>
            <Label muted>State</Label>
          </Box>
          <Box flex={3} marginLeft={2} style={{ maxWidth: '40%' }}>
            <Label muted>Commit</Label>
          </Box>
          <Box flex={2} marginLeft={2}>
            <Label align="right" muted>
              Deployed At
            </Label>
          </Box>
        </Flex>
      </Card>

      {deployments?.map((deployment) => (
        <Card key={deployment.uid} as={'li'} padding={4} borderBottom>
          <Flex align="center">
            <Box flex={3}>
              <Text weight="semibold">
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
                <Text>
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
                <Text size={2} muted>
                  <Inline space={3}>
                    <TransferIcon />
                    {deployment.meta?.githubCommitRef}
                  </Inline>
                </Text>
              </Stack>
            </Box>
            <Flex flex={2} justify="flex-end" marginLeft={2}>
              <Inline space={2}>
                <Text style={{ whiteSpace: 'nowrap' }} muted>
                  {spacetime.now().since(spacetime(deployment.created)).rounded}
                </Text>
                <Tooltip
                  content={
                    <Box padding={2}>
                      <Text muted size={1}>
                        {deployment.creator?.username}
                      </Text>
                    </Box>
                  }
                  fallbackPlacements={['right', 'left']}
                  placement="top"
                >
                  <Avatar
                    alt={deployment.creator?.username}
                    src={`https://vercel.com/api/www/avatar/${deployment.creator?.uid}?&s=48`}
                    size={1}
                  />
                </Tooltip>
              </Inline>
            </Flex>
          </Flex>
        </Card>
      ))}
    </Box>
  )
}

export default DeployHistory
