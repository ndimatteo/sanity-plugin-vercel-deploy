import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  Flex,
  Grid,
  Spinner,
  Stack,
  Text,
  TextInput,
  ThemeProvider,
  ToastProvider,
  useToast,
} from '@sanity/ui'
import { buildTheme } from '@sanity/ui/theme'
import { BoltIcon, CogIcon } from '@sanity/icons'
import { FormField, useColorSchemeValue } from 'sanity'

import { useClient } from './hook/useClient'
import { useClientSubscription } from './hook/useClientSubscription'

import {
  VERCEL_DEPLOY_QUERY,
  VERCEL_DEPLOY_SECRETS_QUERY,
  INITIAL_PENDING_PROJECT,
} from './utils/constants'
import {
  createProject,
  getProjectById,
  getTeamById,
  saveVercelDeployAccessToken,
} from './utils'

import DeployItem from './deploy-item'

import type { Tool } from 'sanity'
import type {
  SanityVercelDeployment,
  SanityVercelConfig,
  VercelDeployConfig,
  PendingProject,
} from './types'
import DeployDialogForm from './deploy-form'

type VercelDeployProps = {
  tool: Tool<VercelDeployConfig>
}

let hasInitializedPredefinedProjects = false

const VercelDeploy = ({ tool }: VercelDeployProps) => {
  const client = useClient()
  const scheme = useColorSchemeValue()
  const theme = useMemo(() => buildTheme(), [])
  const toast = useToast()

  const { data: deployments, isLoading } =
    useClientSubscription<SanityVercelDeployment>(VERCEL_DEPLOY_QUERY)

  // action states
  const [isSubmitting, setIsSubmitting] = useState(false)

  // dialog states
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)

  // form field states
  const [pendingProject, setPendingProject] = useState<PendingProject>(
    INITIAL_PENDING_PROJECT
  )

  // predefined project states
  const predefinedProjects = tool?.options?.projects
  const { data: secrets, isLoading: isLoadingSecrets } =
    useClientSubscription<SanityVercelConfig>(VERCEL_DEPLOY_SECRETS_QUERY)
  const accessToken = secrets?.[0]?.accessToken
  const missingAccessToken =
    predefinedProjects?.length && !isLoadingSecrets && !accessToken
  const [pendingAccessToken, setPendingAccessToken] = useState('')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const accessTokenFieldRef = useRef<HTMLInputElement>(null)

  const onSubmit = useCallback(
    async (pendingProject: PendingProject, automated?: boolean) => {
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
            description: automated
              ? 'Make sure the Access Token you provided is valid'
              : 'Make sure the Access Token you provided is valid and the Team ID matches the one you see in Vercel',
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
          description: automated
            ? 'Make sure the Access Token you provided is valid'
            : 'Make sure the Access Token you provided is valid and the Project ID matches to the one you see in Vercel',
        })

        return
      }

      createProject(client, {
        name: pendingProject.name,
        url: pendingProject.url,
        project: {
          id: pendingProject.projectId || undefined,
          name: vercelProjectName || undefined,
        },
        team: {
          id: pendingProject.teamId || undefined,
          name: vercelTeamName || undefined,
        },
        accessToken: pendingProject.accessToken,
        disableDeleteAction: pendingProject.disableDeleteAction ? true : false,
      }).then(() => {
        toast.push({
          status: 'success',
          title: 'Success!',
          description: `Created Deployment: ${pendingProject.name}`,
        })
        setIsNewProjectOpen(false)
        setIsSubmitting(false)
        setPendingProject(INITIAL_PENDING_PROJECT) // Reset the pending webhook state
      })
    },
    [client]
  )

  // Setup predefined Projects
  const initializePredefinedProjects = useCallback(
    async (accessToken: string) => {
      if (hasInitializedPredefinedProjects || !predefinedProjects?.length)
        return
      hasInitializedPredefinedProjects = true

      const existingUrls = deployments
        ? new Set(deployments.map((p) => p.url))
        : new Set()
      const missingProjects = predefinedProjects.filter(
        (project) => !existingUrls.has(project.url)
      )

      if (missingProjects.length) {
        toast.push({
          status: 'info',
          title: 'Adding predefined projects...',
        })

        missingProjects.forEach(async (pendingProject) => {
          onSubmit({ ...pendingProject, accessToken }, true)
        })
      }
    },
    [deployments, onSubmit]
  )

  const onAddToken = useCallback(
    async (accessToken: string, initializeProjects?: boolean) => {
      setIsSubmitting(true)

      saveVercelDeployAccessToken(client, accessToken).then(() => {
        hasInitializedPredefinedProjects = false
        setIsSubmitting(false)
        setIsConfigOpen(false)
        setPendingAccessToken('')
        toast.push({
          status: 'success',
          title: 'Successfully updated Vercel Access Token',
        })

        if (initializeProjects) {
          initializePredefinedProjects(accessToken)
        }
      })
    },
    [client, initializePredefinedProjects]
  )

  // attempt to initialize predefined projects when accessToken is found
  useEffect(() => {
    if (accessToken && !isLoading && !isLoadingSecrets) {
      initializePredefinedProjects(accessToken)
    }
  }, [accessToken, isLoading, isLoadingSecrets])

  // change focus on config dialog
  useEffect(() => {
    if (isConfigOpen || missingAccessToken) {
      requestAnimationFrame(() => {
        accessTokenFieldRef.current?.focus()
      })
    }
  }, [isConfigOpen, missingAccessToken])

  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <Container display="grid" width={6} style={{ minHeight: '100%' }}>
          <Flex direction="column">
            <Card padding={3} borderBottom>
              <Flex align="center">
                <Flex flex={1} align="center">
                  <svg
                    fill="currentColor"
                    viewBox="0 0 76 65"
                    height="1rem"
                    width="1rem"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                  </svg>
                  <Card display="flex" marginX={1} style={{ opacity: 0.25 }}>
                    <svg
                      viewBox="0 0 24 24"
                      height="1rem"
                      width="1rem"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      shapeRendering="geometricPrecision"
                    >
                      <path d="M16.88 3.549L7.12 20.451" />
                    </svg>
                  </Card>
                  <Card>
                    <Text as="h1" size={1} weight="medium">
                      Vercel Deployments
                    </Text>
                  </Card>
                </Flex>

                <Flex gap={2}>
                  <Button
                    type="button"
                    fontSize={1}
                    tone="primary"
                    padding={2}
                    radius={2}
                    text="Add Project"
                    onClick={() => setIsNewProjectOpen(true)}
                  />

                  {predefinedProjects?.length && (
                    <Button
                      icon={CogIcon}
                      onClick={() => setIsConfigOpen(true)}
                      padding={2}
                      radius={2}
                      mode="ghost"
                    />
                  )}
                </Flex>
              </Flex>
            </Card>

            <Card flex={1}>
              <Grid as={'ul'} columns={[1, 1, 1, 2]} gap={3} padding={3}>
                {isLoading || isLoadingSecrets ? (
                  <Card as={'li'} padding={4} column={[1, 2]}>
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      paddingTop={3}
                    >
                      <Spinner size={4} />
                      <Box padding={4}>
                        <Text size={2}>Loading Projects...</Text>
                      </Box>
                    </Flex>
                  </Card>
                ) : deployments?.length ? (
                  deployments.map((deployment) => {
                    const isLocked = predefinedProjects?.some(
                      (project) => project.url === deployment.url
                    )

                    return (
                      <Card
                        key={deployment._id}
                        as={'li'}
                        padding={4}
                        radius={4}
                        shadow={2}
                        tone="default"
                        muted
                      >
                        <DeployItem
                          deployment={deployment}
                          isLocked={isLocked}
                        />
                      </Card>
                    )
                  })
                ) : (
                  <Card as={'li'} padding={5} paddingTop={6} column={[1, 2]}>
                    <Flex direction="column" align="center" justify="center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        width="150"
                        viewBox="0 0 260 235"
                      >
                        <path
                          fill={scheme === 'dark' ? 'transparent' : 'white'}
                          fillRule="evenodd"
                          stroke="var(--card-border-color)"
                          strokeDasharray="4 4"
                          strokeWidth="2"
                          d="M107.36 2.48l105.7 185.47H2.66L108.35 2.48z"
                          clipRule="evenodd"
                        />
                        <ellipse
                          cx="182.68"
                          cy="156.48"
                          fill="transparent"
                          rx="74.32"
                          ry="74.52"
                        />
                        <path
                          stroke="var(--card-border-color)"
                          strokeWidth="2"
                          d="M256.5 156.48c0 40.88-33.05 74.02-73.82 74.02-40.77 0-73.83-33.14-73.83-74.02 0-40.87 33.06-74.01 73.83-74.01 40.77 0 73.82 33.14 73.82 74.01z"
                        />

                        <mask
                          id="a"
                          width="149"
                          height="150"
                          x="108"
                          y="81"
                          maskUnits="userSpaceOnUse"
                        >
                          <ellipse
                            cx="182.68"
                            cy="156.48"
                            fill="white"
                            rx="74.32"
                            ry="74.52"
                          />
                        </mask>
                        <g mask="url(#a)">
                          <path
                            fill={scheme === 'dark' ? 'white' : 'black'}
                            fillRule="evenodd"
                            d="M108.36 2.48l105.7 185.47H2.66L108.35 2.48z"
                            clipRule="evenodd"
                          />
                        </g>
                      </svg>

                      <Flex direction="column" align="center" padding={4}>
                        <Text size={3} weight="medium">
                          No deployments created yet
                        </Text>
                        <Box padding={4}>
                          <Button
                            fontSize={2}
                            paddingX={4}
                            paddingY={3}
                            tone="primary"
                            radius={3}
                            text="Add Project"
                            onClick={() => setIsNewProjectOpen(true)}
                          />
                        </Box>

                        <Text size={1} weight="medium" muted>
                          <a
                            href="https://github.com/ndimatteo/sanity-plugin-vercel-deploy#-your-first-vercel-deployment"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--card-muted-fg-color, inherit)',
                            }}
                          >
                            Need help?
                          </a>
                        </Text>
                      </Flex>
                    </Flex>
                  </Card>
                )}
              </Grid>
            </Card>
          </Flex>
        </Container>

        {isNewProjectOpen && (
          <DeployDialogForm
            header="New Project Deployment"
            id="new-project"
            values={pendingProject}
            setValues={setPendingProject}
            onClose={() => setIsNewProjectOpen(false)}
            onSubmit={() => onSubmit(pendingProject)}
            onSubmitText="Create"
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        )}

        {(isConfigOpen || missingAccessToken) && (
          <Dialog
            animate
            id="vercel-access-token"
            width={1}
            footer={
              <Box padding={3}>
                <Grid columns={accessToken ? 2 : 1} gap={3}>
                  {accessToken && (
                    <Button
                      padding={3}
                      mode="ghost"
                      text="Cancel"
                      onClick={() => {
                        setIsConfigOpen(false)
                        setPendingAccessToken('')
                      }}
                    />
                  )}
                  <Button
                    padding={3}
                    text={accessToken ? 'Update' : 'Connect Projects'}
                    tone="suggest"
                    disabled={isSubmitting || !pendingAccessToken.trim()}
                    loading={isSubmitting}
                    onClick={() =>
                      onAddToken(pendingAccessToken, accessToken ? true : false)
                    }
                  />
                </Grid>
              </Box>
            }
          >
            <Box padding={3}>
              <form noValidate>
                <Stack space={3}>
                  <Card
                    padding={4}
                    radius={3}
                    tone={accessToken ? 'caution' : 'suggest'}
                  >
                    <Flex gap={3} align="center">
                      <Button
                        as="div"
                        mode="ghost"
                        tone={accessToken ? 'caution' : 'suggest'}
                        radius="full"
                        icon={BoltIcon}
                        style={{
                          cursor: 'default !important',
                        }}
                      />
                      <Box flex={1}>
                        {accessToken ? (
                          <Text>
                            <strong>Vercel Access Token found</strong> <br />
                            Value is hidden for security purposes.
                          </Text>
                        ) : (
                          <Text>
                            <strong>
                              Preconfigured Projects were detected
                            </strong>{' '}
                            <br />A valid{' '}
                            <a
                              href="https://vercel.com/guides/how-do-i-use-a-vercel-api-access-token"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--card-muted-fg-color, inherit)',
                                textDecoration: 'underline',
                                outline: 'none',
                              }}
                            >
                              Vercel Access Token
                            </a>{' '}
                            is required to connect them.
                          </Text>
                        )}
                      </Box>
                    </Flex>
                  </Card>

                  <FormField
                    title={
                      accessToken
                        ? 'New Vercel Access Token'
                        : 'Vercel Access Token'
                    }
                  >
                    <TextInput
                      ref={accessTokenFieldRef}
                      type="text"
                      value={pendingAccessToken}
                      onChange={(e) => {
                        const accessToken = (e.target as HTMLInputElement).value
                        setPendingAccessToken(accessToken)
                      }}
                    />
                  </FormField>
                </Stack>
              </form>
            </Box>
          </Dialog>
        )}
      </ToastProvider>
    </ThemeProvider>
  )
}

export default VercelDeploy
