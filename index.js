import React from 'react'
import { IconContext } from 'react-icons'
import { FiUploadCloud } from 'react-icons/fi'
import WebhookDeploy from './src/WebhookDeploy'

const deployIcon = () => {
  return (
    <IconContext.Provider value={{ style: { strokeWidth: 1 } }}>
      <FiUploadCloud />
    </IconContext.Provider>
  )
}

export default {
  title: 'Deploy',
  name: 'webhookDeploy',
  icon: deployIcon,
  component: WebhookDeploy,
}
