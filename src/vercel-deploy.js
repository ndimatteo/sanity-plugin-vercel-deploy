import React from 'react'
import client from 'part:@sanity/base/client'
import WebhookItem from './deploy-item'

import Spinner from 'part:@sanity/components/loading/spinner'
import Snackbar from 'part:@sanity/components/snackbar/default'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import AnchorButton from 'part:@sanity/components/buttons/anchor'

import WarningIcon from 'part:@sanity/base/warning-icon'
import Alert from 'part:@sanity/components/alerts/alert'

import styles from './vercel-deploy.css'

const WEBHOOK_TYPE = 'webhook_deploy'
const WEBHOOK_QUERY = `*[_type == "${WEBHOOK_TYPE}"] | order(_createdAt)`

export default class Deploy extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      webhooks: [],
      isLoading: true,
      isUpdating: false,
      isDeploying: false,
      openDialog: false,
      pendingWebhookTitle: '',
      pendingWebhookURL: '',
      pendingVercelProject: '',
      pendingVercelToken: '',
      snackbar: {
        active: false,
        kind: '',
        title: '',
        message: ''
      }
    }
  }

  componentDidMount = () => {
    // Fetch initial
    this.fetchAllWebhooks()

    // Listen to new stuff
    this.webhookSubscription = client
      .listen(WEBHOOK_QUERY, {}, { includeResult: true })
      .subscribe(res => {
        const wasCreated = res.mutations.some(item =>
          Object.prototype.hasOwnProperty.call(item, 'create')
        )
        const wasDeleted = res.mutations.some(item =>
          Object.prototype.hasOwnProperty.call(item, 'delete')
        )
        if (wasCreated) {
          this.setState({
            webhooks: [...this.state.webhooks, res.result]
          })
        }
        if (wasDeleted) {
          const newHooks = this.state.webhooks.filter(
            hook => hook._id !== res.documentId
          )
          this.setState({
            webhooks: newHooks
          })
        }
      })
  }

  componentWillUnmount = () => {
    this.webhookSubscription && this.webhookSubscription.unsubscribe()
  }

  fetchAllWebhooks = () => {
    client.fetch(WEBHOOK_QUERY).then(webhooks => {
      this.setState({ webhooks: webhooks, isLoading: false })
    })
  }

  setFormValue = (key, value) => {
    this.setState({
      [key]: value
    })
  }

  onSubmit = () => {
    client
      .create({
        // Explicitly define an _id inside the vercel-deploy path to make sure it's not publicly accessible
        // This will protect users' tokens & project info. Read nmore: https://www.sanity.io/docs/ids
        _id: `vercel-deploy.${Math.random().toString().replace('.', '')}`,
        _type: WEBHOOK_TYPE,
        name: this.state.pendingWebhookTitle,
        url: this.state.pendingWebhookURL,
        vercelProject: this.state.pendingVercelProject,
        vercelToken: this.state.pendingVercelToken
      })
      .then(() => {
        this.toggleSnackbar(
          true,
          'success',
          'Success!',
          `Created webhook: ${this.state.pendingWebhookTitle}`
        )
        this.setState({
          pendingWebhookTitle: '',
          pendingWebhookURL: '',
          pendingVercelProject: '',
          pendingVercelToken: '',
          openDialog: false
        })
      })
  }

  toggleDialog = state => {
    this.setState({
      openDialog: state
    })
  }

  handleAction = (action, event) => {
    if (action.key === 'create') {
      this.onSubmit()
    } else {
      this.setState({
        openDialog: false
      })
    }
  }

  toggleSnackbar = (state, kind, title, message) => {
    this.setState({
      snackbar: {
        active: state,
        kind: kind,
        title: title,
        message: message
      }
    })
  }

  resetSnackbar = () => {
    this.setState({
      snackbar: { active: false }
    })
  }

  render() {
    const webhookList = this.state.webhooks.map(hook => (
      <WebhookItem
        key={hook._id}
        name={hook.name}
        url={hook.url}
        id={hook._id}
        vercelProject={hook.vercelProject}
        vercelToken={hook.vercelToken}
        toggleSnackbar={this.toggleSnackbar}
      />
    ))

    const actions = [
      {
        key: 'create',
        index: 1,
        title: 'Create',
        color: 'primary'
      },
      {
        key: 'cancel',
        index: 2,
        title: 'Cancel',
        color: 'primary',
        kind: 'simple',
        secondary: true
      }
    ]

    const webhookForm = (
      <>
        {this.state.openDialog && (
          <DefaultDialog
            title="New Deployment"
            color="default"
            size="medium"
            padding="large"
            showCloseButton
            onClose={() => this.toggleDialog(false)}
            onAction={this.handleAction}
            actions={
              this.state.pendingWebhookTitle && this.state.pendingWebhookURL
                ? actions
                : [actions[1]]
            }
          >
            <form>
              <div className={styles.fieldWrapper}>
                <DefaultTextField
                  label="Title"
                  description="Give your deploy a name, like 'Production'"
                  onChange={event =>
                    this.setFormValue('pendingWebhookTitle', event.target.value)
                  }
                  value={this.state.pendingWebhookTitle}
                />
                <DefaultTextField
                  label="Vercel Project Name"
                  description="The exact name of the associated project on Vercel"
                  onChange={event =>
                    this.setFormValue(
                      'pendingVercelProject',
                      event.target.value
                    )
                  }
                  value={this.state.pendingVercelProject}
                />
                <DefaultTextField
                  label="Deploy Hook URL"
                  description="The Vercel deploy hook URL from your project's Git settings"
                  type="url"
                  onChange={event =>
                    this.setFormValue('pendingWebhookURL', event.target.value)
                  }
                  value={this.state.pendingWebhookURL}
                />
                <DefaultTextField
                  label="Vercel Token"
                  description="A Vercel token from your account settings"
                  onChange={event =>
                    this.setFormValue('pendingVercelToken', event.target.value)
                  }
                  value={this.state.pendingVercelToken}
                />

                <Alert color="warning" icon={WarningIcon} title="Careful!">
                  Once you create this deployment you will not be able to edit
                  it.
                </Alert>
              </div>
            </form>
          </DefaultDialog>
        )}
      </>
    )

    const emptyState = !this.state.webhooks.length && (
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
            <ellipse
              cx="182.68"
              cy="156.48"
              fill="#fff"
              rx="74.32"
              ry="74.52"
            />
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
            href="https://github.com/ndimatteo/sanity-plugin-vercel-deploy/blob/master/README.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Need help?
          </a>
        </p>
      </>
    )

    return (
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
            {this.state.isLoading ? (
              <div className={styles.loader}>
                <Spinner center message="loading deployments..." />
              </div>
            ) : (
              <>
                {webhookList}
                {emptyState}
              </>
            )}
          </div>
          <div className={styles.footer}>
            <AnchorButton
              onClick={() => this.toggleDialog(true)}
              bleed
              color="primary"
              kind="simple"
            >
              Create New
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
