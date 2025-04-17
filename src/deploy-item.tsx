import axios from 'axios'
import { useEffect, useState, useCallback } from 'react'
import spacetime from 'spacetime'
import useSWR from 'swr'

import {
  ClockIcon,
  EditIcon,
  EllipsisVerticalIcon,
  ErrorOutlineIcon,
  BoltIcon,
  TrashIcon,
} from '@sanity/icons'
import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Dialog,
  Flex,
  Grid,
  Heading,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Popover,
  Stack,
  Text,
  Tooltip,
  useToast,
} from '@sanity/ui'

import { useClient } from './hook/useClient'

import { INITIAL_PENDING_PROJECT, IS_PRODUCTION } from './utils/constants'
import { authFetcher, getProjectById, getTeamById } from './utils'

import DeployHistory from './deploy-history'
import DeployStatus from './deploy-status'

import type {
  SanityVercelDeployment,
  StatusType,
  PendingProject,
} from './types'
import DeployDialogForm from './deploy-form'

type DeployItemProps = {
  deployment: SanityVercelDeployment
  isLocked?: boolean
}

const DeployItem = ({ deployment, isLocked }: DeployItemProps) => {
  const client = useClient()
  const { _id, name, project, team, url, accessToken, disableDeleteAction } =
    deployment

  // action states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeploying, setDeploying] = useState(false)

  // dialog states
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  // form field states
  const [pendingProject, setPendingProject] = useState<PendingProject>(
    INITIAL_PENDING_PROJECT
  )

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusType>('LOADING')
  const [timestamp, setTimestamp] = useState<string | null>(null)
  const [buildTime, setBuildTime] = useState<string | null>(null)

  const toast = useToast()

  const deployHookId = url?.split('/').pop()?.split('?').shift()

  const { data: projectData, isLoading: projectIsLoading } = useSWR(
    [
      `https://api.vercel.com/v9/projects/${project?.id}${
        team?.id ? `?teamId=${team?.id}` : ''
      }`,
      accessToken,
    ],
    ([url, token]) => authFetcher(url, token),
    {
      errorRetryCount: 3,
      onError: (err) => {
        console.log(err)
        setStatus('ERROR')
        setErrorMessage(err.response?.data?.error?.message)
        setIsLoading(false)
      },
    }
  )

  const { data: deploymentData } = useSWR(
    [
      `https://api.vercel.com/v6/deployments?projectId=${
        project?.id
      }&meta-deployHookId=${deployHookId}&limit=1${
        team?.id ? `&teamId=${team?.id}` : ''
      }`,
      accessToken,
    ],
    ([url, token]) => authFetcher(url, token),
    {
      errorRetryCount: 3,
      refreshInterval: isDeploying ? 5000 : 0,
      onError: (err) => {
        console.log(err)
        setStatus('ERROR')
        setErrorMessage(err.response?.data?.error?.message)
        setIsLoading(false)
      },
    }
  )

  const foundDeployHook = projectData?.link?.deployHooks?.find(
    (hook: any) => hook.id === deployHookId
  )

  const onDeploy = (_name: string, _url: string) => {
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
          description: `Triggered Deployment: ${_name}`,
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
          Authorization: `Bearer ${token}`,
        },
        params: {
          ...(team ? { teamId: team?.id } : {}),
        },
      })
      .then((res) => res.data)
      .then((res) => {
        setStatus('CANCELED')
        setDeploying(false)
        setIsLoading(false)
        setBuildTime(null)
        setTimestamp(res.canceledAt)
        toast.push({
          status: 'success',
          title: `Successfully canceled deployment`,
        })
      })
  }

  const onDelete = (_name: string, id: string) => {
    setIsLoading(true)
    client.delete(id).then(() => {
      toast.push({
        status: 'success',
        title: `Successfully deleted deployment: ${_name}`,
      })
    })
  }

  const onEdit = () => {
    setPendingProject({
      name,
      projectId: project?.id || '',
      teamId: team?.id || '',
      url,
      accessToken: accessToken,
      disableDeleteAction,
    })
    setIsEditOpen(true)
  }

  const onSubmitEdit = useCallback(async () => {
    let vercelTeamName
    let vercelProjectName

    setIsSubmitting(true)

    if (pendingProject.teamId) {
      try {
        const team = await getTeamById(
          pendingProject.teamId,
          pendingProject.accessToken
        )

        if (!team?.data?.id) {
          throw new Error('Vercel Team not found')
        }

        vercelTeamName = team.data.name
      } catch (error) {
        console.error(error)
        setIsSubmitting(false)

        toast.push({
          status: 'error',
          title: 'No Team found!',
          closable: true,
          description:
            'Make sure the Access Token you provided is valid and the Team ID matches the one you see in Vercel',
        })

        return
      }
    }

    try {
      const project = await getProjectById(
        pendingProject.projectId,
        pendingProject.accessToken,
        pendingProject.teamId
      )

      if (!project?.data?.id) {
        throw new Error('Vercel Project not found')
      }

      vercelProjectName = project.data.name
    } catch (error) {
      console.error(error)
      setIsSubmitting(false)

      toast.push({
        status: 'error',
        title: 'No Project found!',
        closable: true,
        description:
          'Make sure the Access Token you provided is valid and the Project ID matches to the one you see in Vercel',
      })

      return
    }

    client
      .patch(_id)
      .set({
        name: pendingProject.name,
        url: pendingProject.url,
        project: {
          id: pendingProject.projectId,
          name: vercelProjectName || undefined,
        },
        team: {
          id: pendingProject.teamId || undefined,
          name: vercelTeamName || undefined,
        },
        accessToken: pendingProject.accessToken,
        disableDeleteAction: pendingProject.disableDeleteAction,
      })
      .commit()
      .then(() => {
        toast.push({
          status: 'success',
          title: 'Success!',
          description: `Updated Deployment: ${pendingProject.name}`,
        })

        setIsEditOpen(false)
        setIsSubmitting(false)
      })
  }, [pendingProject, client])

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

  // build time ticker
  const tick = (_timestamp: string | null) => {
    if (_timestamp) {
      setBuildTime(spacetime.now().since(spacetime(_timestamp)).rounded)
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
    <Stack space={5}>
      <Flex wrap="nowrap" align="flex-start">
        <Stack space={2} flex={1}>
          <Flex wrap="wrap" align="center" gap={1}>
            <Box marginRight={1}>
              <Heading as="h2" size={1}>
                <Text weight="medium">{name}</Text>
              </Heading>
            </Box>

            {team?.id && (
              <Tooltip
                content={
                  <Text muted size={1}>
                    Vercel Team
                  </Text>
                }
                animate
                placement="top"
                portal
              >
                <Badge
                  tone="primary"
                  paddingX={3}
                  paddingY={2}
                  radius="full"
                  fontSize={0}
                >
                  {team?.name}
                </Badge>
              </Tooltip>
            )}

            {project?.name && (
              <Tooltip
                content={
                  <Text muted size={1}>
                    Vercel Project
                  </Text>
                }
                animate
                placement="top"
                portal
              >
                <Badge
                  tone="primary"
                  paddingX={3}
                  paddingY={2}
                  radius="full"
                  fontSize={0}
                >
                  {projectData?.name || project?.name}
                </Badge>
              </Tooltip>
            )}
          </Flex>
          <Tooltip
            content={
              <>
                {foundDeployHook && (
                  <Text muted size={1}>
                    <strong style={{ fontWeight: 600 }}>
                      {foundDeployHook.name}
                    </strong>{' '}
                    on{' '}
                    <strong style={{ fontWeight: 600 }}>
                      {foundDeployHook.ref}
                    </strong>{' '}
                    branch
                  </Text>
                )}
              </>
            }
            animate
            placement="top"
            portal
          >
            <Box paddingY={2}>
              <Code size={0} style={{ cursor: 'default' }}>
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
            </Box>
          </Tooltip>
          <Flex>
            <Button
              as={!projectIsLoading && projectData?.link ? 'a' : undefined}
              href={
                !projectIsLoading && projectData?.link
                  ? `https://github.com/${projectData?.link?.org}/${projectData?.link?.repo}`
                  : undefined
              }
              target="_blank"
              text={
                !projectIsLoading && projectData?.link
                  ? projectData?.link?.org + '/' + projectData?.link?.repo
                  : 'loading...'
              }
              icon={
                <svg
                  data-sanity-icon
                  aria-label="github"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 14 14"
                  height="1em"
                  width="1em"
                >
                  <path
                    d="M7 .175c-3.872 0-7 3.128-7 7 0 3.084 2.013 5.71 4.79 6.65.35.066.482-.153.482-.328v-1.181c-1.947.415-2.363-.941-2.363-.941-.328-.81-.787-1.028-.787-1.028-.634-.438.044-.416.044-.416.7.044 1.071.722 1.071.722.635 1.072 1.641.766 2.035.59.066-.459.24-.765.437-.94-1.553-.175-3.193-.787-3.193-3.456 0-.766.262-1.378.721-1.881-.065-.175-.306-.897.066-1.86 0 0 .59-.197 1.925.722a6.754 6.754 0 0 1 1.75-.24c.59 0 1.203.087 1.75.24 1.335-.897 1.925-.722 1.925-.722.372.963.131 1.685.066 1.86.46.48.722 1.115.722 1.88 0 2.691-1.641 3.282-3.194 3.457.24.219.481.634.481 1.29v1.926c0 .197.131.415.481.328C11.988 12.884 14 10.259 14 7.175c0-3.872-3.128-7-7-7z"
                    fill="currentColor"
                    fillRule="nonzero"
                  ></path>
                </svg>
              }
              mode="ghost"
              fontSize={0}
              space={3}
              paddingX={2}
              paddingY={2}
              disabled={projectIsLoading}
              radius="full"
              muted
              tone="neutral"
            />
          </Flex>
        </Stack>

        <Flex gap={2} align="center">
          {isLocked && (
            <Tooltip
              content={
                <Text muted size={1}>
                  Automatically added
                </Text>
              }
              animate
              placement="left"
              portal
            >
              <Button
                as="div"
                mode="ghost"
                tone="suggest"
                radius="full"
                icon={BoltIcon}
                style={{
                  cursor: 'default !important',
                }}
              />
            </Tooltip>
          )}

          <MenuButton
            id={`${_id}-actions`}
            popover={{
              portal: true,
              placement: 'bottom-end',
              tone: 'default',
              animate: true,
            }}
            button={
              <Button
                mode="ghost"
                icon={EllipsisVerticalIcon}
                disabled={isDeploying || isLoading}
                radius="full"
              />
            }
            menu={
              <Menu>
                <MenuItem
                  text="History"
                  icon={ClockIcon}
                  onClick={() => setIsHistoryOpen(true)}
                  disabled={!deploymentData?.deployments.length}
                  fontSize={1}
                />

                {/* Hide the edit action if locked in production */}
                {IS_PRODUCTION && isLocked ? null : (
                  <MenuItem
                    text="Edit"
                    icon={EditIcon}
                    tone="primary"
                    onClick={() => onEdit()}
                    fontSize={1}
                  />
                )}

                {/* Hide the delete action if disabled or locked in production */}
                {IS_PRODUCTION && (disableDeleteAction || isLocked) ? null : (
                  <>
                    <MenuDivider />
                    <MenuItem
                      text="Delete"
                      icon={TrashIcon}
                      tone="critical"
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      fontSize={1}
                    />
                  </>
                )}
              </Menu>
            }
          />
        </Flex>
      </Flex>

      <Flex wrap="nowrap" align="flex-end" justify="space-between">
        {accessToken && project?.id && (
          <Tooltip
            content={
              <Text muted size={1}>
                {spacetime(timestamp).format('nice-full')}
              </Text>
            }
            animate
            placement="right"
            fallbackPlacements={['top-start']}
            portal
          >
            <Box paddingRight={2}>
              <Flex align="center" gap={2}>
                <DeployStatus status={status} justify="flex-end">
                  {errorMessage && (
                    <Flex marginLeft={2}>
                      <Tooltip
                        content={
                          <Text muted size={1}>
                            {errorMessage ?? 'An error has occured'}
                          </Text>
                        }
                        placement="top"
                      >
                        <Card display="flex" tone="critical" radius="full">
                          <ErrorOutlineIcon width="1.5em" height="1.5em" />
                        </Card>
                      </Tooltip>
                    </Flex>
                  )}
                </DeployStatus>

                {isDeploying && buildTime && (
                  <Text align="right" size={0} weight="medium" muted>
                    {buildTime}
                  </Text>
                )}

                {!isDeploying && timestamp && (
                  <Text align="right" size={0} weight="medium" muted>
                    {spacetime.now().since(spacetime(timestamp)).rounded}
                  </Text>
                )}
              </Flex>
            </Box>
          </Tooltip>
        )}

        <Flex gap={2}>
          {isDeploying && (status === 'BUILDING' || status === 'QUEUED') && (
            <Button
              type="button"
              tone="critical"
              mode="ghost"
              onClick={() => {
                onCancel(deploymentData.deployments[0].uid, accessToken)
              }}
              paddingX={4}
              paddingY={3}
              radius={3}
              text="Cancel"
            />
          )}

          <Button
            type="button"
            tone="positive"
            disabled={isDeploying || isLoading}
            loading={isDeploying || isLoading}
            onClick={() => onDeploy(name, url)}
            paddingX={[4]}
            paddingY={[3]}
            radius={3}
            text="Deploy"
          />
        </Flex>
      </Flex>

      {/* Deployment Editor Dialog */}
      {isEditOpen && (
        <DeployDialogForm
          header="Edit Project Deployment"
          id="edit-project"
          values={pendingProject}
          setValues={setPendingProject}
          onClose={() => setIsEditOpen(false)}
          onSubmit={onSubmitEdit}
          onSubmitText="Update"
          loading={isSubmitting}
          disabled={isSubmitting}
          hideAccessToken
          hideDisableDeleteAction={IS_PRODUCTION && disableDeleteAction}
        />
      )}

      {/* Deployment History Dialog */}
      {isHistoryOpen && (
        <Dialog
          animate
          id="deploy-history"
          header={`Deployment History: ${name}`}
          onClickOutside={() => setIsHistoryOpen(false)}
          onClose={() => setIsHistoryOpen(false)}
          width={2}
        >
          <DeployHistory
            project={projectData}
            team={team}
            url={url}
            accessToken={accessToken}
          />
        </Dialog>
      )}

      {/* Deployment Confirm Delete Dialog */}
      {isConfirmDeleteOpen && (
        <Dialog
          animate
          id="deploy-confirm-delete"
          header="Delete Project Deployment"
          onClickOutside={() => setIsConfirmDeleteOpen(false)}
          onClose={() => setIsConfirmDeleteOpen(false)}
          width={1}
          footer={
            <Box padding={3}>
              <Grid columns={2} gap={3}>
                <Button
                  padding={3}
                  mode="ghost"
                  text="Cancel"
                  onClick={() => setIsConfirmDeleteOpen(false)}
                />
                <Button
                  padding={3}
                  text="Confirm Delete"
                  tone="critical"
                  loading={isSubmitting}
                  onClick={() => onDelete(name, _id)}
                />
              </Grid>
            </Box>
          }
        >
          <Stack space={4} padding={4}>
            <Text weight="medium">
              Are you sure you want to delete this Project Deployment:{' '}
              <strong>{name}</strong>?
            </Text>
            <Card padding={4} radius={3} tone="critical">
              <Text>
                <strong>Warning:</strong> This action is not reversible. Please
                be certain.
              </Text>
            </Card>
          </Stack>
        </Dialog>
      )}
    </Stack>
  )
}

export default DeployItem
