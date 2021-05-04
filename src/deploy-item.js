import React, { useState, useEffect } from 'react'
import axios from 'axios'
import useSWR from 'swr'
import spacetime from 'spacetime'

import sanityClient from 'part:@sanity/base/client'

import {
  useToast,
  Menu,
  MenuButton,
  MenuItem,
  Badge,
  Box,
  Button,
  Inline,
  Text,
  Tooltip,
  Dialog
} from '@sanity/ui'
import { EllipsisVerticalIcon, ClockIcon, TrashIcon } from '@sanity/icons'

import styles from './deploy-item.css'
import StatusIndicator from './deploy-status'
import DeployHistory from './deploy-history'

const fetcher = (url, token) =>
  axios
    .get(url, {
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => res.data)

const deployItem = ({
  name,
  url,
  id,
  vercelProject,
  vercelToken,
  vercelTeam
}) => {
  const client = sanityClient.withConfig({ apiVersion: '2021-03-25' })

  const [isLoading, setIsLoading] = useState(true)
  const [isDeploying, setDeploying] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [status, setStatus] = useState('LOADING')
  const [timestamp, setTimestamp] = useState(null)
  const [buildTime, setBuildTime] = useState(null)

  const toast = useToast()

  const { data: projectData } = useSWR(
    [
      `https://api.vercel.com/v1/projects/${vercelProject}${
        vercelTeam?.id ? `?teamId=${vercelTeam?.id}` : ''
      }`,
      vercelToken
    ],
    (url, token) => fetcher(url, token),
    {
      errorRetryCount: 3,
      onError: err => {
        const errorMessage = err.response?.data?.error?.message
        setStatus('ERROR')
        setErrorMessage(errorMessage)
        setIsLoading(false)
      }
    }
  )

  const { data: deploymentData } = useSWR(
    () => [
      `https://api.vercel.com/v5/now/deployments?projectId=${
        projectData.id
      }&meta-deployHookId=${url.split('/').pop()}&limit=1${
        vercelTeam?.id ? `&teamId=${vercelTeam?.id}` : ''
      }`,
      vercelToken
    ],
    (url, token) => fetcher(url, token),
    {
      errorRetryCount: 3,
      refreshInterval: isDeploying ? 5000 : 0,
      onError: err => {
        const errorMessage = err.response?.data?.error?.message
        setStatus('ERROR')
        setErrorMessage(errorMessage)
        setIsLoading(false)
      }
    }
  )

  const onDeploy = (name, url) => {
    setStatus('INITIATED')
    setDeploying(true)
    setTimestamp(null)
    setBuildTime(null)

    axios
      .post(url)
      .then(res => {
        toast.push({
          status: 'success',
          title: 'Success!',
          description: `Triggered Deployment: ${name}`
        })
      })
      .catch(err => {
        setDeploying(false)
        toast.push({
          status: 'error',
          title: 'Deploy Failed.',
          description: `${err}`
        })
      })
  }

  const onCancel = (id, token) => {
    setIsLoading(true)
    axios
      .patch(`https://api.vercel.com/v12/now/deployments/${id}/cancel`, null, {
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => res.data)
      .then(res => {
        setStatus('CANCELED')
        setDeploying(false)
        setIsLoading(false)
        setBuildTime(null)
        setTimestamp(res.canceledAt)
      })
  }

  const onRemove = (name, id) => {
    setIsLoading(true)
    client.delete(id).then(res => {
      toast.push({
        status: 'success',
        title: `Successfully deleted deployment: ${name}`
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

    return () => (isSubscribed = false)
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

    return () => (isSubscribed = false)
  }, [status])

  // count build time
  const tick = timestamp => {
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
      <div className={styles.hook}>
        <div className={styles.hookDetails}>
          <h4 className={styles.hookTitle}>
            <span>{name}</span>
            <Badge>{vercelProject}</Badge>

            {vercelTeam?.id && (
              <>
                {' '}
                <Badge tone="primary">{vercelTeam?.name}</Badge>
              </>
            )}
          </h4>
          <p className={styles.hookURL}>{url}</p>
        </div>
        <div className={styles.hookActions}>
          {vercelToken && vercelProject && (
            <div className={styles.hookStatus}>
              <StatusIndicator status={status}>
                {errorMessage && (
                  <Tooltip
                    content={
                      <Box padding={2}>
                        <Text muted size={1}>
                          <span
                            style={{
                              display: 'inline-block',
                              textAlign: 'center'
                            }}
                          >
                            {errorMessage}
                          </span>
                        </Text>
                      </Box>
                    }
                    placement="top"
                  >
                    <span className={styles.hookStatusError}>
                      <Badge mode="outline" tone="critical">
                        ?
                      </Badge>
                    </span>
                  </Tooltip>
                )}
              </StatusIndicator>

              <span className={styles.hookTime}>
                {isDeploying
                  ? buildTime || '--'
                  : timestamp
                  ? spacetime.now().since(spacetime(timestamp)).rounded
                  : '--'}
              </span>
            </div>
          )}
          <Inline space={2}>
            <Button
              type="button"
              tone="positive"
              disabled={isDeploying || isLoading}
              loading={isDeploying || isLoading}
              onClick={() => onDeploy(name, url)}
              text="Deploy"
            />
            {isDeploying && (status === 'BUILDING' || status === 'QUEUED') && (
              <Button
                type="button"
                tone="critical"
                onClick={() =>
                  onCancel(deploymentData.deployments[0].uid, vercelToken)
                }
                text="Cancel"
              />
            )}
            <MenuButton
              button={
                <Button
                  mode="bleed"
                  icon={EllipsisVerticalIcon}
                  disabled={isDeploying || isLoading}
                />
              }
              portal
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
                    onClick={() => onRemove(name, id)}
                  />
                </Menu>
              }
              placement="bottom"
            />
          </Inline>
        </div>
      </div>

      {isHistoryOpen && (
        <Dialog
          header={`Deployment History: ${name} (${deploymentData?.deployments[0]?.meta.deployHookName})`}
          onClickOutside={() => setIsHistoryOpen(false)}
          onClose={() => setIsHistoryOpen(false)}
          width={2}
        >
          <Box padding={4}>
            <DeployHistory
              url={url}
              vercelProject={projectData.id}
              vercelToken={vercelToken}
              vercelTeam={vercelTeam}
              hookContext={deploymentData?.deployments[0]?.meta.deployHookName}
            />
          </Box>
        </Dialog>
      )}
    </>
  )
}

export default deployItem
