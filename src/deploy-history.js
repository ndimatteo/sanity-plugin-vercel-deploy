import React, { useEffect, useState } from 'react'
import axios from 'axios'
import useSWR from 'swr'
import spacetime from 'spacetime'

import { Avatar, Box, Card, Flex, Spinner, Text, Tooltip } from '@sanity/ui'

import styles from './deploy-history.css'
import StatusIndicator from './deploy-status'

const DeployHistory = ({
  url,
  vercelProject,
  vercelToken,
  vercelTeam,
  hookContext
}) => {
  const [state, setState] = useState({})

  useEffect(() => {
    if (!vercelProject) {
      return
    }
    setState({ loading: true })

    axios
      .get(
        `https://api.vercel.com/v5/now/deployments?projectId=${vercelProject}&meta-deployHookId=${url
          .split('/')
          .pop()}&limit=6${vercelTeam?.id ? `&teamId=${vercelTeam?.id}` : ''}`,
        {
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${vercelToken}`
          }
        }
      )
      .then(({ data }) => {
        setState({
          deployments: data.deployments,
          loading: false,
          error: false
        })
      })
      .catch(e => {
        setState({
          error: true,
          loading: false
        })
        console.warn(e)
      })
  }, [vercelProject])

  if (state.loading) {
    return (
      <Flex align="center" justify="center">
        <Spinner muted />
      </Flex>
    )
  }

  if (state.error) {
    return (
      <Card padding={[3, 3, 4]} radius={2} shadow={1} tone="critical">
        <Text size={[2, 2, 3]}>
          Could not load deployments for {vercelProject}
        </Text>
      </Card>
    )
  }

  return (
    <Box as="table" className={styles.table}>
      <Box as="thead" style={{ display: 'table-header-group' }}>
        <tr>
          <th>Deployment</th>
          <th>State</th>
          <th>Commit</th>
          <th>Time</th>
          <th>Creator</th>
        </tr>
      </Box>
      <Box as="tbody" style={{ display: 'table-row-group' }}>
        {state.deployments?.map(deployment => (
          <tr as="tr" key={deployment.uid}>
            <td>
              <a href={`https://${deployment.url}`} target="_blank">
                {deployment.url}
              </a>
            </td>
            <td>
              <StatusIndicator status={deployment.state} />
            </td>
            <td>
              <div>{deployment.meta?.githubCommitRef}</div>
              <small className={styles.commit}>
                {deployment.meta?.githubCommitMessage}
              </small>
            </td>
            <td>
              {spacetime.now().since(spacetime(deployment.created)).rounded}
            </td>
            <td>
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
                  style={{ margin: 'auto' }}
                />
              </Tooltip>
            </td>
          </tr>
        ))}
      </Box>
    </Box>
  )
}

export default DeployHistory
