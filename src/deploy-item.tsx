import axios from 'axios'
import React, { useEffect, useState } from 'react'
import spacetime from 'spacetime'
import useSWR from 'swr'

import sanityClient from '@sanity/client'
import { ClockIcon, EllipsisVerticalIcon, TrashIcon } from '@sanity/icons'
import {
  Badge,
  Box,
  Button,
  Code,
  Dialog,
  Flex,
  Heading,
  Inline,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Text,
  Tooltip,
  useToast,
} from '@sanity/ui'

import DeployHistory from './deploy-history'
import DeployStatus from './deploy-status'
import type { SanityDeploySchema, StatusType } from './types'

const fetcher = (url: string, token: string) =>
  axios
    .get(url, {
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => res.data)

interface DeployItemProps extends SanityDeploySchema {}
const deployItem: React.FC<DeployItemProps> = ({
  name,
  url,
  _id,
  vercelProject,
  vercelToken,
  vercelTeam,
}) => {
  const client = sanityClient({ apiVersion: '2021-03-25' })

  const [isLoading, setIsLoading] = useState(true)
  const [isDeploying, setDeploying] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusType>('LOADING')
  const [timestamp, setTimestamp] = useState<string | null>(null)
  const [buildTime, setBuildTime] = useState<string | null>(null)

  const toast = useToast()

  const { data: projectData } = useSWR(
    [
      `https://api.vercel.com/v8/projects/${vercelProject}${
        vercelTeam?.id ? `?teamId=${vercelTeam?.id}` : ''
      }`,
      vercelToken,
    ],
    (url, token) => fetcher(url, token),
    {
      errorRetryCount: 3,
      onError: (err) => {
        const errorMessage = err.response?.data?.error?.message
        setStatus('ERROR')
        setErrorMessage(errorMessage)
        setIsLoading(false)
      },
    }
  )

  const { data: deploymentData } = useSWR(
    () => [
      `https://api.vercel.com/v5/now/deployments?projectId=${
        projectData.id
      }&meta-deployHookId=${url.split('/').pop()}&limit=1${
        vercelTeam?.id ? `&teamId=${vercelTeam?.id}` : ''
      }`,
      vercelToken,
    ],
    (url, token) => fetcher(url, token),
    {
      errorRetryCount: 3,
      refreshInterval: isDeploying ? 5000 : 0,
      onError: (err) => {
        const errorMessage = err.response?.data?.error?.message
        setStatus('ERROR')
        setErrorMessage(errorMessage)
        setIsLoading(false)
      },
    }
  )

  const onDeploy = (name: string, url: string) => {
    setStatus('INITIATED')
    setDeploying(true)
    setTimestamp(null)
    setBuildTime(null)

    axios
      .post(url)
      .then(() => {
        toast.push({
          status: 'success',
          title: 'Success!',
          description: `Triggered Deployment: ${name}`,
        })
      })
      .catch((err) => {
        setDeploying(false)
        toast.push({
          status: 'error',
          title: 'Deploy Failed.',
          description: `${err}`,
        })
      })
  }

  const onCancel = (id: string, token: string) => {
    setIsLoading(true)
    axios
      .patch(`https://api.vercel.com/v12/deployments/${id}/cancel`, null, {
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => res.data)
      .then((res) => {
        setStatus('CANCELED')
        setDeploying(false)
        setIsLoading(false)
        setBuildTime(null)
        setTimestamp(res.canceledAt)
      })
  }

  const onRemove = (name: string, id: string) => {
    setIsLoading(true)
    client.delete(id).then(() => {
      toast.push({
        status: 'success',
        title: `Successfully deleted deployment: ${name}`,
      })
    })
  }

  // set status when new deployment data comes in
  useEffect(() => {
    let isSubscribed = true

    if (deploymentData?.deployments && isSubscribed) {
      const latestDeployment = deploymentData.deployments[0]

      setStatus(latestDeployment?.state || 'READY')

      if (latestDeployment?.created) {
        setTimestamp(latestDeployment?.created)
      }

      setIsLoading(false)
    }

    return () => {
      isSubscribed = false
    }
  }, [deploymentData])

  // update deploy state after status is updated
  useEffect(() => {
    let isSubscribed = true

    if (isSubscribed) {
      if (status === 'READY' || status === 'ERROR' || status === 'CANCELED') {
        setDeploying(false)
      } else if (status === 'BUILDING' || status === 'INITIATED') {
        setDeploying(true)
      }
    }

    return () => {
      isSubscribed = false
    }
  }, [status])

  // count build time
  const tick = (timestamp: string | null) => {
    if (timestamp) {
      setBuildTime(spacetime.now().since(spacetime(timestamp)).rounded)
    }
  }

  useEffect(() => {
    let isTicking = true
    const timer = setInterval(() => {
      if (isTicking && isDeploying) {
        tick(timestamp)
      }
    }, 1000)

    if (!isDeploying) {
      clearInterval(timer)
    }

    return () => {
      isTicking = false
      clearInterval(timer)
    }
  }, [timestamp, isDeploying])

  return (
    <>
      <Flex align="center">
        <Box flex={1} paddingBottom={1}>
          <Stack space={2}>
            <Inline space={2}>
              <>
                <Heading as="h2" size={1}>
                  <Text weight="semibold">{name}</Text>
                </Heading>
                <Badge
                  tone="primary"
                  paddingX={3}
                  paddingY={2}
                  radius={6}
                  fontSize={0}
                >
                  {vercelProject}
                </Badge>
                {vercelTeam?.id && (
                  <Badge
                    mode="outline"
                    paddingX={3}
                    paddingY={2}
                    radius={6}
                    fontSize={0}
                  >
                    {vercelTeam?.name}
                  </Badge>
                )}
              </>
            </Inline>
            <Code size={1}>
              <Box
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {url}
              </Box>
            </Code>
          </Stack>
        </Box>
        <Flex wrap="nowrap" align="center" marginLeft={4}>
          <Inline space={2}>
            {vercelToken && vercelProject && (
              <Box marginRight={2}>
                <Stack space={2}>
                  <DeployStatus status={status} justify="flex-end">
                    {errorMessage && (
                      <Box marginLeft={2}>
                        <Tooltip
                          content={
                            <Box padding={2}>
                              <Text muted size={1}>
                                {errorMessage}
                              </Text>
                            </Box>
                          }
                          placement="top"
                        >
                          <Badge mode="outline" tone="critical">
                            ?
                          </Badge>
                        </Tooltip>
                      </Box>
                    )}
                  </DeployStatus>

                  <Text align="right" size={1} muted>
                    {isDeploying
                      ? buildTime || '--'
                      : timestamp
                      ? spacetime.now().since(spacetime(timestamp)).rounded
                      : '--'}
                  </Text>
                </Stack>
              </Box>
            )}

            <Button
              type="button"
              tone="positive"
              disabled={isDeploying || isLoading}
              loading={isDeploying || isLoading}
              onClick={() => onDeploy(name, url)}
              radius={3}
              text="Deploy"
            />

            {isDeploying && (status === 'BUILDING' || status === 'QUEUED') && (
              <Button
                type="button"
                tone="critical"
                onClick={() =>
                  onCancel(deploymentData.deployments[0].uid, vercelToken)
                }
                radius={3}
                text="Cancel"
              />
            )}

            <MenuButton
              id={_id}
              button={
                <Button
                  mode="bleed"
                  icon={EllipsisVerticalIcon}
                  disabled={isDeploying || isLoading}
                />
              }
              popover={{ portal: true, placement: 'bottom-end' }}
              menu={
                <Menu>
                  <MenuItem
                    text="History"
                    icon={ClockIcon}
                    onClick={() => setIsHistoryOpen(true)}
                    disabled={!deploymentData?.deployments.length}
                  />
                  <MenuItem
                    text="Delete"
                    icon={TrashIcon}
                    tone="critical"
                    onClick={() => onRemove(name, _id)}
                  />
                </Menu>
              }
            />
          </Inline>
        </Flex>
      </Flex>

      {isHistoryOpen && (
        <Dialog
          id="deploy-history"
          header={`Deployment History: ${name}`}
          onClickOutside={() => setIsHistoryOpen(false)}
          onClose={() => setIsHistoryOpen(false)}
          width={2}
        >
          <DeployHistory
            url={url}
            vercelProject={projectData.id}
            vercelToken={vercelToken}
            vercelTeam={vercelTeam}
            hookContext={deploymentData?.deployments[0]?.meta.deployHookName}
          />
        </Dialog>
      )}
    </>
  )
}

export default deployItem
