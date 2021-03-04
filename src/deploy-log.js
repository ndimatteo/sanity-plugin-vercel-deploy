import { Avatar, Box, Card, Flex, Spinner, Text, Tooltip } from '@sanity/ui'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import TimeAgo from './time-ago'
import styles from './deploy-log.css'
import Status, { titleCase } from './status'

const DeployLog = ({ vercelProject, vercelToken, vercelTeam }) => {
  const [state, setState] = useState({})

  useEffect(() => {
    if (!vercelProject) {
      return
    }
    setState({ loading: true })
    const options = {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${vercelToken}`
      },
      url: `https://api.vercel.com/v5/now/deployments?projectId=${vercelProject}&limit=5${
        vercelTeam?.id ? `&teamId=${vercelTeam?.id}` : ''
      }`
    }

    axios(options)
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
							<Status status={deployment.state}>
								{titleCase(deployment.state)}
							</Status>
            </td>
            <td>
              <div>{deployment.meta?.githubCommitRef}</div>
              <small className={styles.commit}>
                {deployment.meta?.githubCommitMessage}
              </small>
            </td>
            <td>
              <TimeAgo date={deployment.created} />
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

export default DeployLog
