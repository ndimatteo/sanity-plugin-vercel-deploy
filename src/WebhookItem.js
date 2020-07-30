import React, { useState } from 'react'
import client from 'part:@sanity/base/client'
import Button from 'part:@sanity/components/buttons/default'

import styles from './WebhookItem.css'

const webhookItem = ({ name, url, id, toggleSnackbar }) => {
  const [isUpdating, setUpdating] = useState(false)
  const [isDeploying, setDeploying] = useState(false)

  const onDeploy = (name, url) => {
    setDeploying(true)
    toggleSnackbar(false)
    global
      .fetch(url, {
        method: 'POST',
      })
      .then((res) => {
        setDeploying(false)
        console.log(res)
        alert(`Deployed: ${name}`)
      })
      .catch((err) => {
        setDeploying(false)
        toggleSnackbar(true, 'error', 'Deploy Failed', `${err}`)
        console.log(err)
      })
  }

  const onRemove = (name, id) => {
    setUpdating(true)
    client.delete(id).then((res) => {
      setUpdating(false)
      toggleSnackbar(
        true,
        'success',
        'Webhook Deleted',
        `Successfully deleted webhook: ${name}`
      )
      console.log(res)
    })
  }

  return (
    <>
      <div className={styles.hook}>
        <div className={styles.hookDetails}>
          <h4 className={styles.hookTitle}>{name}</h4>
          <p className={styles.hookURL}>{url}</p>
        </div>
        <div className={styles.hookActions}>
          <Button
            color="success"
            onClick={() => onDeploy(name, url)}
            className={styles.deployButton}
            disabled={isDeploying}
            loading={isDeploying}
            type="button"
          >
            Deploy
          </Button>{' '}
          <Button
            color="danger"
            inverted
            onClick={() => onRemove(name, id)}
            className={styles.deleteButton}
            disabled={isUpdating}
            loading={isUpdating}
            type="button"
          >
            Remove
          </Button>
        </div>
      </div>
    </>
  )
}

export default webhookItem
