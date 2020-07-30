import React from 'react'
import client from 'part:@sanity/base/client'
import WebhookItem from './WebhookItem'

import Snackbar from 'part:@sanity/components/snackbar/default'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import DefaultTextField from '@sanity/components/lib/textfields/DefaultTextField'
import AnchorButton from 'part:@sanity/components/buttons/anchor'

import styles from './WebhookDeploy.css'

const WEBHOOK_TYPE = 'webhook_deploy'
const WEBHOOK_QUERY = `*[_type == "${WEBHOOK_TYPE}"]`

export default class Deploy extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      webhooks: [],
      isUpdating: false,
      isDeploying: false,
      openDialog: false,
      pendingWebhookTitle: '',
      pendingWebhookURL: '',
      pendingWebhookStatus: '',
      snackbar: {
        active: false,
        kind: '',
        title: '',
        message: '',
      },
    }
  }

  componentDidMount = () => {
    // Fetch initial
    this.fetchAllWebhooks()

    // Listen to new stuff
    this.webhookSubscription = client
      .listen(WEBHOOK_QUERY, {}, { includeResult: true })
      .subscribe((result) => {
        // TODO: find a better way to do this.
        setTimeout(() => {
          this.fetchAllWebhooks()
        }, 1000)
      })
  }

  componentWillUnmount = () => {
    this.webhookSubscription && this.webhookSubscription.unsubscribe()
  }

  fetchAllWebhooks = () => {
    client.fetch(WEBHOOK_QUERY).then((webhooks) => {
      this.setState({ webhooks })
    })
  }

  setFormValue = (key, value) => {
    this.setState({
      [key]: value,
    })
  }

  onSubmit = () => {
    client
      .create({
        _type: WEBHOOK_TYPE,
        name: this.state.pendingWebhookTitle,
        url: this.state.pendingWebhookURL,
        status: this.state.pendingWebhookStatus,
      })
      .then(() => {
        this.setState({
          pendingWebhookTitle: '',
          pendingWebhookURL: '',
          pendingWebhookStatus: '',
          openDialog: false,
        })
      })
  }

  // onDeploy = (name, url) => {
  //   global
  //     .fetch(url, {
  //       method: 'POST',
  //     })
  //     .then((res) => {
  //       console.log('POST:')
  //       console.log(res)
  //       alert(`Deployed: ${name}!`)
  //     })
  // }

  // onRemove = (name, _id) => {
  // 	this.setState({
  // 		isUpdating: true
  // 	})
  //   client.delete(_id).then((res) => {
  // 		this.setState({
  // 			isUpdating: false
  // 		})
  //   })
  // }

  toggleDialog = (state) => {
    this.setState({
      openDialog: state,
    })
  }

  handleAction = (action, event) => {
    if (action.key === 'create') {
      this.onSubmit()
    } else {
      this.setState({
        openDialog: false,
      })
    }
  }

  toggleSnackbar = (state, kind, title, message) => {
    this.setState({
      snackbar: {
        active: state,
        kind: kind,
        title: title,
        message: message,
      },
    })
  }

  resetSnackbar = () => {
    this.setState({
      snackbar: { active: false },
    })
  }

  render() {
    const webhookList = this.state.webhooks.map((hook) => (
      <WebhookItem
        key={hook._id}
        name={hook.name}
        url={hook.url}
        id={hook._id}
        toggleSnackbar={this.toggleSnackbar}
      />
    ))

    const actions = [
      {
        key: 'create',
        index: 1,
        title: 'Create',
        color: 'primary',
      },
      {
        key: 'cancel',
        index: 2,
        title: 'Cancel',
        color: 'primary',
        kind: 'simple',
        secondary: true,
      },
    ]

    const webhookForm = (
      <>
        {this.state.openDialog && (
          <DefaultDialog
            title="New Webhook"
            color="default"
            showCloseButton
            onClose={() => this.toggleDialog(false)}
            onAction={this.handleAction}
            actions={
              this.state.pendingWebhookTitle && this.state.pendingWebhookURL
                ? actions
                : [actions[1]]
            }
          >
            <div>
              <DialogContent size="medium" padding="large">
                <form>
                  <div className={styles.fieldWrapper}>
                    <DefaultTextField
                      label="Title"
                      onChange={(event) =>
                        this.setFormValue(
                          'pendingWebhookTitle',
                          event.target.value
                        )
                      }
                      value={this.state.pendingWebhookTitle}
                    />
                    <DefaultTextField
                      label="URL"
                      type="url"
                      onChange={(event) =>
                        this.setFormValue(
                          'pendingWebhookURL',
                          event.target.value
                        )
                      }
                      value={this.state.pendingWebhookURL}
                    />
                  </div>
                  {/* <DefaultTextField
                    label="Status Badge"
                    onChange={(event) =>
                      this.setFormValue(
                        'pendingWebhookStatus',
                        event.target.value
                      )
                    }
                    value={this.state.pendingWebhookStatus}
                  /> */}
                  {/* <div className={styles.submitContainer}>
                    <DefaultButton
                      disabled={
                        !this.state.pendingWebhookTitle ||
                        !this.state.pendingWebhookURL
                      }
                      type="submit"
                    >
                      Create New Webhook
                    </DefaultButton>
                  </div> */}
                </form>
              </DialogContent>
            </div>
          </DefaultDialog>
        )}
      </>
    )

    const emptyState = !this.state.webhooks.length && <p>No webhooks yet.</p>

    return (
      <div className={styles.appContainer}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h2 className={styles.title}>Webhooks</h2>
          </div>
          <div className={styles.list}>
            {webhookList}
            {emptyState}
          </div>
          <div className={styles.footer}>
            <AnchorButton
              onClick={() => this.toggleDialog(true)}
              bleed
              color="primary"
              kind="simple"
            >
              Create Webhook
            </AnchorButton>
          </div>
        </div>
        {webhookForm}

        {this.state.snackbar.active && (
          <Snackbar
            kind={this.state.snackbar.kind}
            isPersisted={false}
            isCloseable
            timeout={4000}
            title={this.state.snackbar.title}
            allowDuplicateSnackbarType
            onClose={this.resetSnackbar}
          >
            {this.state.snackbar.message}
          </Snackbar>
        )}
      </div>
    )
  }
}
