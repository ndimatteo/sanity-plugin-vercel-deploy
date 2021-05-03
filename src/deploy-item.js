import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ReactPolling from 'react-polling'

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
  Tooltip
} from '@sanity/ui'
import { EllipsisVerticalIcon, TrashIcon } from '@sanity/icons'

import styles from './deploy-item.css'

const deployItem = ({
  name,
  url,
  id,
  vercelProject,
  vercelToken,
  vercelTeam
}) => {
  const client = sanityClient.withConfig({ apiVersion: '2021-03-25' })

  const [isUpdating, setUpdating] = useState(vercelToken && vercelProject)
  const [isDeploying, setDeploying] = useState(false)
  const [status, setStatus] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [project, setProject] = useState(false)

  const statusRef = useRef()
  statusRef.current = false

  const toast = useToast()

  useEffect(() => {
    let isSubscribed = true
    if (vercelToken && vercelProject) {
      // get project ID from project name
      getProject(vercelProject)
        .then(res => {
          if (res.data.id) {
            setProject(res.data.id)
          }
        })
        .catch(err => {
          console.log(err)
          const errorMessage = err.response?.data?.error?.message

          setStatus('ERROR')
          statusRef.current = 'ERROR'

          if (errorMessage) {
            setErrorMsg(errorMessage)
          }

          setUpdating(false)
        })

      // get latest project deployment
      if (project) {
        getLatestDeployment().then(res => {
          console.log(res)
          if (isSubscribed) {
            const deployment = res.data.deployments[0]

            setUpdating(false)
            setStatus(deployment.state)

            if (
              deployment.state !== 'READY' &&
              deployment.state !== 'ERROR' &&
              deployment.state !== 'CANCELED'
            ) {
              setDeploying(true)
            }
          }
        })
      }
    }

    return () => (isSubscribed = false)
  }, [project])

  useEffect(() => {
    let isSubscribed = true
    if (
      (status === 'READY' || status === 'ERROR') &&
      isSubscribed &&
      vercelToken &&
      vercelProject
    ) {
      setDeploying(false)
    }

    return () => (isSubscribed = false)
  }, [status])

  const getLatestDeployment = async () => {
    const options = {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${vercelToken}`
      },
      url: `https://api.vercel.com/v5/now/deployments?projectId=${project}&limit=1${
        vercelTeam?.id ? `&teamId=${vercelTeam?.id}` : ''
      }`
    }

    return axios(options)
  }

  const getProject = id => {
    const options = {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${vercelToken}`
      },
      url: `https://api.vercel.com/v1/projects/${id}${
        vercelTeam?.id ? `?teamId=${vercelTeam?.id}` : ''
      }`
    }

    return axios(options)
  }

  const onDeploy = (name, url) => {
    setDeploying(true)
    setStatus('INITIATED')

    global
      .fetch(url, {
        method: 'POST'
      })
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
        console.log(err)
      })
  }

  const onRemove = (name, id) => {
    setUpdating(true)
    client.delete(id).then(res => {
      toast.push({
        status: 'success',
        title: `Successfully deleted deployment: ${name}`
      })
    })
  }

  return (
    <>
      <div className={styles.hook}>
        <div className={styles.hookDetails}>
          <h4 className={styles.hookTitle}>
            {`${name} `}
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
              {isDeploying ? (
                <ReactPolling
                  url="custom"
                  method="GET"
                  interval={3000}
                  retryCount={5}
                  onSuccess={res => {
                    const deployment = res.data.deployments[0]
                    // catch if initial deployment hasn't updated yet

                    if (
                      statusRef.current === false &&
                      deployment.state === 'READY'
                    ) {
                      return true
                    }

                    setStatus(deployment.state)
                    statusRef.current = deployment.state

                    return true
                  }}
                  onFailure={err => console.log(err)}
                  promise={getLatestDeployment}
                  render={({ isPolling }) => {
                    if (isPolling) {
                      return (
                        <div>
                          {status ? (
                            <span
                              className={styles.hookStatusIndicator}
                              data-indicator={status}
                            >
                              {titleCase(status)}
                            </span>
                          ) : (
                            <span
                              className={styles.hookStatusIndicator}
                              data-indicator="LOADING"
                            >
                              Loading
                            </span>
                          )}
                        </div>
                      )
                    } else {
                      return (
                        <div
                          className={styles.hookStatusIndicator}
                          data-indicator="INACTIVE"
                        >
                          Status Inactive
                        </div>
                      )
                    }
                  }}
                />
              ) : (
                <>
                  {status ? (
                    <span
                      className={styles.hookStatusIndicator}
                      data-indicator={status}
                    >
                      {errorMsg ? (
                        <>
                          {titleCase(status)}
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
                                    {errorMsg}
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
                        </>
                      ) : (
                        <>{titleCase(status)}</>
                      )}
                    </span>
                  ) : (
                    <span
                      className={styles.hookStatusIndicator}
                      data-indicator="LOADING"
                    >
                      Loading
                    </span>
                  )}
                </>
              )}
            </div>
          )}
          <Inline space={2}>
            <Button
              type="button"
              tone="positive"
              disabled={isDeploying || isUpdating}
              loading={isDeploying}
              onClick={() => onDeploy(name, url)}
              text="Deploy"
            />
            <MenuButton
              button={
                <Button
                  mode="bleed"
                  icon={EllipsisVerticalIcon}
                  disabled={isDeploying || isUpdating}
                />
              }
              portal
              menu={
                <Menu>
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
    </>
  )
}

const titleCase = str => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export default deployItem
