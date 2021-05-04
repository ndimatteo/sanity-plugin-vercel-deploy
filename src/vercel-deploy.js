import React, { useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import axios from 'axios'

import sanityClient from 'part:@sanity/base/client'
import AnchorButton from 'part:@sanity/components/buttons/anchor'
import FormField from 'part:@sanity/components/formfields/default'
import WarningIcon from 'part:@sanity/base/warning-icon'
import {
  studioTheme,
  ThemeProvider,
  ToastProvider,
  useToast,
  Dialog,
  Grid,
  Flex,
  Box,
  Card,
  Stack,
  Spinner,
  Button,
  Text,
  Inline,
  Heading,
  TextInput
} from '@sanity/ui'

import styles from './vercel-deploy.css'
import DeployItem from './deploy-item'

const initialDeploy = {
  title: '',
  project: '',
  team: '',
  url: '',
  token: ''
}

const VercelDeploy = () => {
  const WEBHOOK_TYPE = 'webhook_deploy'
  const WEBHOOK_QUERY = `*[_type == "${WEBHOOK_TYPE}"] | order(_createdAt)`
  const client = sanityClient.withConfig({ apiVersion: '2021-03-25' })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deploys, setDeploys] = useState([])
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
          `https://api.vercel.com/v1/teams?slug=${pendingDeploy.team}`,
          {
            headers: {
              Authorization: `Bearer ${pendingDeploy.token}`
            }
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
            'Make sure the token you provided is valid and that the team’s slug correspond to the one you see in Vercel'
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
          id: vercelTeamID || undefined
        },
        vercelToken: pendingDeploy.token
      })
      .then(() => {
        toast.push({
          status: 'success',
          title: 'Success!',
          description: `Created Deployment: ${pendingDeploy.title}`
        })
        setIsFormOpen(false)
        setIsSubmitting(false)
        setpendingDeploy(initialDeploy) // Reset the pending webhook state
      })
  }

  // Fetch all existing webhooks and listen for newly created
  useEffect(() => {
    let webhookSubscription

    client.fetch(WEBHOOK_QUERY).then(w => {
      setDeploys(w)
      setIsLoading(false)

      webhookSubscription = client
        .listen(WEBHOOK_QUERY, {}, { includeResult: true })
        .subscribe(res => {
          const wasCreated = res.mutations.some(item =>
            Object.prototype.hasOwnProperty.call(item, 'create')
          )
          const wasDeleted = res.mutations.some(item =>
            Object.prototype.hasOwnProperty.call(item, 'delete')
          )
          if (wasCreated) {
            setDeploys(prevState => {
              return [...prevState, res.result]
            })
          }
          if (wasDeleted) {
            setDeploys(prevState =>
              prevState.filter(w => w._id !== res.documentId)
            )
          }
        })
    })

    return () => {
      webhookSubscription && webhookSubscription.unsubscribe()
    }
  }, [])

  return (
    <ThemeProvider theme={studioTheme}>
      <ToastProvider>
        <div className={styles.appContainer}>
          <div className={styles.container}>
            <div className={styles.header}>
              <h2 className={styles.title}>
                <svg
                  fill="currentColor"
                  viewBox="0 0 512 512"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.titleIcon}
                >
                  <path d="M256 48l240 416H16z" />
                </svg>{' '}
                Vercel Deployments
              </h2>
            </div>
            <div className={styles.list}>
              {isLoading ? (
                <div className={styles.loader}>
                  <Flex direction="column" align="center" justify="center">
                    <Spinner size={4} />
                    <Box padding={4}>
                      <Text size={2}>loading deployments...</Text>
                    </Box>
                  </Flex>
                </div>
              ) : deploys.length ? (
                deploys.map(deploy => (
                  <DeployItem
                    key={deploy._id}
                    name={deploy.name}
                    url={deploy.url}
                    id={deploy._id}
                    vercelProject={deploy.vercelProject}
                    vercelTeam={deploy.vercelTeam}
                    vercelToken={deploy.vercelToken}
                  />
                ))
              ) : (
                <EmptyState />
              )}
            </div>

            <div className={styles.footer}>
              <AnchorButton
                onClick={() => setIsFormOpen(true)}
                bleed
                color="primary"
                kind="simple"
              >
                Create New
              </AnchorButton>
            </div>
          </div>
        </div>

        {isFormOpen && (
          <Dialog
            header="New Deployment"
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
                    text="Publish"
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
                  label="Display Title"
                  description="Give your deploy a name, like 'Production'"
                >
                  <TextInput
                    type="text"
                    value={pendingDeploy.title}
                    onChange={e => {
                      e.persist()
                      setpendingDeploy(prevState => ({
                        ...prevState,
                        ...{ title: e?.target?.value }
                      }))
                    }}
                  />
                </FormField>

                <FormField
                  label="Vercel Project Name"
                  description="The exact name of the associated project on Vercel"
                >
                  <TextInput
                    type="text"
                    value={pendingDeploy.project}
                    onChange={e => {
                      e.persist()
                      setpendingDeploy(prevState => ({
                        ...prevState,
                        ...{ project: e?.target?.value }
                      }))
                    }}
                  />
                </FormField>

                <FormField
                  label="Vercel Team Slug"
                  description="Required for projects under a Vercel Team (use team page URL slug)"
                >
                  <TextInput
                    type="text"
                    value={pendingDeploy.team}
                    onChange={e => {
                      e.persist()
                      setpendingDeploy(prevState => ({
                        ...prevState,
                        ...{ team: e?.target?.value }
                      }))
                    }}
                  />
                </FormField>

                <FormField
                  label="Deploy Hook URL"
                  description="The Vercel deploy hook URL from your project's Git settings"
                >
                  <TextInput
                    type="text"
                    inputMode="url"
                    value={pendingDeploy.url}
                    onChange={e => {
                      e.persist()
                      setpendingDeploy(prevState => ({
                        ...prevState,
                        ...{ url: e?.target?.value }
                      }))
                    }}
                  />
                </FormField>

                <FormField
                  label="Vercel Token"
                  description="A Vercel token from your account settings"
                >
                  <TextInput
                    type="text"
                    value={pendingDeploy.token}
                    onChange={e => {
                      e.persist()
                      setpendingDeploy(prevState => ({
                        ...prevState,
                        ...{ token: e?.target?.value }
                      }))
                    }}
                  />
                </FormField>

                <Card padding={[3, 3, 4]} radius={3} shadow={1} tone="caution">
                  <Box marginBottom={3}>
                    <Inline space={[1]}>
                      <WarningIcon style={{ fontSize: 24 }} />
                      <Heading size={1}>Careful!</Heading>
                    </Inline>
                  </Box>
                  <Text size={[1, 1, 1]}>
                    Once you create this deployment you will not be able to edit
                    it.
                  </Text>
                </Card>
              </Stack>
            </Box>
          </Dialog>
        )}
      </ToastProvider>
    </ThemeProvider>
  )
}

const EmptyState = () => {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        width="360"
        viewBox="0 0 260 235"
        className={styles.emptyIcon}
      >
        <path
          fill="white"
          fillRule="evenodd"
          stroke="black"
          strokeDasharray="4 4"
          strokeWidth="2"
          d="M107.36 2.48l105.7 185.47H2.66L108.35 2.48z"
          clipRule="evenodd"
        />
        <ellipse cx="182.68" cy="156.48" fill="white" rx="74.32" ry="74.52" />
        <path
          stroke="black"
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
          <ellipse cx="182.68" cy="156.48" fill="#fff" rx="74.32" ry="74.52" />
        </mask>
        <g mask="url(#a)">
          <path
            fill="black"
            fillRule="evenodd"
            d="M108.36 2.48l105.7 185.47H2.66L108.35 2.48z"
            clipRule="evenodd"
          />
        </g>
      </svg>
      <p className={styles.emptyList}>
        No deploys created yet.{' '}
        <a
          className={styles.emptyHelpLink}
          href="https://github.com/ndimatteo/sanity-plugin-vercel-deploy#your-first-vercel-deployment"
          target="_blank"
          rel="noopener noreferrer"
        >
          Need help?
        </a>
      </p>
    </>
  )
}

export default VercelDeploy
