import React from 'react'
import { IconContext } from 'react-icons'
import { FiUploadCloud } from 'react-icons/fi'

import VercelDeploy from './vercel-deploy'

const deployIcon = () => {
  return (
    <IconContext.Provider value={{ style: { strokeWidth: 1.75 } }}>
      <FiUploadCloud />
    </IconContext.Provider>
  )
}

export default {
  title: 'Deploy',
  name: 'vercel-deploy',
  icon: deployIcon,
  component: VercelDeploy
}
