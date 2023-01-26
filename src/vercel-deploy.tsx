import axios from 'axios'
import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react'
import { type Subscription } from 'rxjs'

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
  studioTheme,
  Switch,
  Text,
  TextInput,
  ThemeProvider,
  ToastProvider,
  useToast,
} from '@sanity/ui'
import { FormField, useColorScheme } from 'sanity'

import DeployItem from './deploy-item'
import { useClient } from './hook/useClient'
import type { SanityDeploySchema } from './types'

const initialDeploy = {
  title: '',
  project: '',
  team: '',
  url: '',
  token: '',
  disableDeleteAction: false,
}

const VercelDeploy = () => {
  const WEBHOOK_TYPE = 'webhook_deploy'
  const WEBHOOK_QUERY = `*[_type == "${WEBHOOK_TYPE}"] | order(_createdAt)`
  const client = useClient()
  const { scheme } = useColorScheme()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deploys, setDeploys] = useState<SanityDeploySchema[]>([])
  const [pendingDeploy, setpendingDeploy] = useState(initialDeploy)
  const toast = useToast()

  const onSubmit = async () => {
    // If we have a team slug, we'll have to get the associated teamId to include in every new request
    // Docs: https://vercel.com/docs/api#api-basics/authentication/accessing-resources-owned-by-a-team
    let vercelTeamID
    let vercelTeamName
    setIsSubmitting(true)

    if (pendingDeploy.team) {
      try {
        const fetchTeam = await axios.get(
          `https://api.vercel.com/v2/teams?slug=${pendingDeploy.team}`,
          {
            headers: {
              Authorization: `Bearer ${pendingDeploy.token}`,
            },
          }
        )

        if (!fetchTeam?.data?.id) {
          throw new Error('No team id found')
        }

        vercelTeamID = fetchTeam.data.id
        vercelTeamName = fetchTeam.data.name
      } catch (error) {
        console.error(error)
        setIsSubmitting(false)

        toast.push({
          status: 'error',
          title: 'No Team found!',
          closable: true,
          description:
            'Make sure the token you provided is valid and that the team’s slug correspond to the one you see in Vercel',
        })

        return
      }
    }

    client
      .create({
        // Explicitly define an _id inside the vercel-deploy path to make sure it's not publicly accessible
        // This will protect users' tokens & project info. Read more: https://www.sanity.io/docs/ids
        _id: `vercel-deploy.${nanoid()}`,
        _type: WEBHOOK_TYPE,
        name: pendingDeploy.title,
        url: pendingDeploy.url,
        vercelProject: pendingDeploy.project,
        vercelTeam: {
          slug: pendingDeploy.team || undefined,
          name: vercelTeamName || undefined,
          id: vercelTeamID || undefined,
        },
        vercelToken: pendingDeploy.token,
        disableDeleteAction: pendingDeploy.disableDeleteAction,
      })
      .then(() => {
        toast.push({
          status: 'success',
          title: 'Success!',
          description: `Created Deployment: ${pendingDeploy.title}`,
        })
        setIsFormOpen(false)
        setIsSubmitting(false)
        setpendingDeploy(initialDeploy) // Reset the pending webhook state
      })
  }

  // Fetch all existing webhooks and listen for newly created
  useEffect(() => {
    let webhookSubscription: Subscription

    client.fetch(WEBHOOK_QUERY).then((w) => {
      setDeploys(w)
      setIsLoading(false)

      webhookSubscription = client
        .listen<SanityDeploySchema>(WEBHOOK_QUERY, {}, { includeResult: true })
        .subscribe({
          next: (res) => {
            if (res.type === 'mutation') {
              const wasCreated = res.mutations.some((item) =>
                Object.prototype.hasOwnProperty.call(item, 'create')
              )

              const wasPatched = res.mutations.some((item) =>
                Object.prototype.hasOwnProperty.call(item, 'patch')
              )

              const wasDeleted = res.mutations.some((item) =>
                Object.prototype.hasOwnProperty.call(item, 'delete')
              )

              const filterDeploy = (deploy: SanityDeploySchema) =>
                deploy._id !== res.documentId

              const updateDeploy = (deploy: SanityDeploySchema) =>
                deploy._id === res.documentId
                  ? (res.result as SanityDeploySchema)
                  : deploy

              if (wasCreated) {
                setDeploys((prevState) => {
                  if (res.result) {
                    return [...prevState, res.result]
                  }
                  return prevState
                })
              }
              if (wasPatched) {
                setDeploys((prevState) => {
                  const updatedDeploys = prevState.map(updateDeploy)

                  return updatedDeploys
                })
              }
              if (wasDeleted) {
                setDeploys((prevState) => prevState.filter(filterDeploy))
              }
            }
          },
        })
    })

    return () => {
      if (webhookSubscription) {
        webhookSubscription.unsubscribe()
      }
    }
  }, [WEBHOOK_QUERY, client])

  return (
    <ThemeProvider theme={studioTheme}>
      <ToastProvider>
        <Container display="grid" width={6} style={{ minHeight: '100%' }}>
          <Flex direction="column">
            <Card padding={4} borderBottom>
              <Flex align="center">
                <Flex flex={1} align="center">
                  <Card>
                    <svg
                      fill="currentColor"
                      viewBox="0 0 512 512"
                      height="2rem"
                      width="2rem"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M256 48l240 416H16z" />
                    </svg>
                  </Card>
                  <Card marginX={1} style={{ opacity: 0.15 }}>
                    <svg
                      viewBox="0 0 24 24"
                      width="32"
                      height="32"
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
                    <Text as="h1" size={2} weight="semibold">
                      Vercel Deployments
                    </Text>
                  </Card>
                </Flex>
                <Box>
                  <Button
                    type="button"
                    fontSize={2}
                    tone="primary"
                    padding={3}
                    radius={3}
                    text="Add Project"
                    onClick={() => setIsFormOpen(true)}
                  />
                </Box>
              </Flex>
            </Card>

            <Card flex={1}>
              <Stack as={'ul'}>
                {isLoading ? (
                  <Card as={'li'} padding={4}>
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      paddingTop={3}
                    >
                      <Spinner size={4} />
                      <Box padding={4}>
                        <Text size={2}>loading your deployments...</Text>
                      </Box>
                    </Flex>
                  </Card>
                ) : deploys.length ? (
                  deploys.map((deploy) => (
                    <Card key={deploy._id} as={'li'} padding={4} borderBottom>
                      <DeployItem
                        key={deploy._id}
                        name={deploy.name}
                        url={deploy.url}
                        _id={deploy._id}
                        vercelProject={deploy.vercelProject}
                        vercelTeam={deploy.vercelTeam}
                        vercelToken={deploy.vercelToken}
                        disableDeleteAction={deploy.disableDeleteAction}
                      />
                    </Card>
                  ))
                ) : (
                  <Card as={'li'} padding={5} paddingTop={6}>
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
                          stroke={scheme === 'dark' ? 'white' : 'black'}
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
                          stroke={scheme === 'dark' ? 'white' : 'black'}
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
                        <Text size={3}>No deployments created yet.</Text>
                        <Box padding={4}>
                          <Button
                            fontSize={3}
                            paddingX={5}
                            paddingY={4}
                            tone="primary"
                            radius={4}
                            text="Add Project"
                            onClick={() => setIsFormOpen(true)}
                          />
                        </Box>

                        <Text size={1} weight="semibold" muted>
                          <a
                            href="https://github.com/ndimatteo/sanity-plugin-vercel-deploy#-your-first-vercel-deployment"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit' }}
                          >
                            Need help?
                          </a>
                        </Text>
                      </Flex>
                    </Flex>
                  </Card>
                )}
              </Stack>
            </Card>
          </Flex>
        </Container>

        {isFormOpen && (
          <Dialog
            header="New Project Deployment"
            id="create-webhook"
            width={1}
            onClickOutside={() => setIsFormOpen(false)}
            onClose={() => setIsFormOpen(false)}
            footer={
              <Box padding={3}>
                <Grid columns={2} gap={3}>
                  <Button
                    padding={4}
                    mode="ghost"
                    text="Cancel"
                    onClick={() => setIsFormOpen(false)}
                  />
                  <Button
                    padding={4}
                    text="Create"
                    tone="primary"
                    loading={isSubmitting}
                    onClick={() => onSubmit()}
                    disabled={
                      isSubmitting ||
                      !pendingDeploy.project ||
                      !pendingDeploy.url ||
                      !pendingDeploy.token
                    }
                  />
                </Grid>
              </Box>
            }
          >
            <Box padding={4}>
              <Stack space={4}>
                <FormField
                  title="Display Title (internal use only)"
                  description={
                    <>
                      This should be the environment you are deploying to, like{' '}
                      <em>Production</em> or <em>Staging</em>
                    </>
                  }
                >
                  <TextInput
                    type="text"
                    value={pendingDeploy.title}
                    onChange={(e) => {
                      e.persist()
                      const title = (e.target as HTMLInputElement).value
                      setpendingDeploy((prevState) => ({
                        ...prevState,
                        ...{ title },
                      }))
                    }}
                  />
                </FormField>

                <FormField
                  title="Vercel Project Name"
                  description={`Vercel Project: Settings → General → "Project Name"`}
                >
                  <TextInput
                    type="text"
                    value={pendingDeploy.project}
                    onChange={(e) => {
                      e.persist()
                      const project = (e.target as HTMLInputElement).value
                      setpendingDeploy((prevState) => ({
                        ...prevState,
                        ...{ project },
                      }))
                    }}
                  />
                </FormField>

                <FormField
                  title="Vercel Team Name"
                  description={`Required for projects under a Vercel Team: Settings → General → "Team Name"`}
                >
                  <TextInput
                    type="text"
                    value={pendingDeploy.team}
                    onChange={(e) => {
                      e.persist()
                      const team = (e.target as HTMLInputElement).value
                      setpendingDeploy((prevState) => ({
                        ...prevState,
                        ...{ team },
                      }))
                    }}
                  />
                </FormField>

                <FormField
                  title="Deploy Hook URL"
                  description={`Vercel Project: Settings → Git → "Deploy Hooks"`}
                >
                  <TextInput
                    type="text"
                    inputMode="url"
                    value={pendingDeploy.url}
                    onChange={(e) => {
                      e.persist()
                      const url = (e.target as HTMLInputElement).value
                      setpendingDeploy((prevState) => ({
                        ...prevState,
                        ...{ url },
                      }))
                    }}
                  />
                </FormField>

                <FormField
                  title="Vercel Token"
                  description={`Vercel Account dropdown: Settings → "Tokens"`}
                >
                  <TextInput
                    type="text"
                    value={pendingDeploy.token}
                    onChange={(e) => {
                      e.persist()
                      const token = (e.target as HTMLInputElement).value
                      setpendingDeploy((prevState) => ({
                        ...prevState,
                        ...{ token },
                      }))
                    }}
                  />
                </FormField>

                <FormField>
                  <Card paddingY={3}>
                    <Flex align="center">
                      <Switch
                        id="disableDeleteAction"
                        style={{ display: 'block' }}
                        onChange={(e) => {
                          e.persist()
                          const isChecked = (e.target as HTMLInputElement)
                            .checked

                          setpendingDeploy((prevState) => ({
                            ...prevState,
                            ...{ disableDeleteAction: isChecked },
                          }))
                        }}
                        checked={pendingDeploy.disableDeleteAction}
                      />
                      <Box flex={1} paddingLeft={3}>
                        <Text>
                          <label htmlFor="disableDeleteAction">
                            Disable the "Delete" action for this item in
                            production?
                          </label>
                        </Text>
                      </Box>
                    </Flex>
                  </Card>
                </FormField>
              </Stack>
            </Box>
          </Dialog>
        )}
      </ToastProvider>
    </ThemeProvider>
  )
}

export default VercelDeploy
