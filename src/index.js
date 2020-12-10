import React from 'react'
import { route } from 'part:@sanity/base/router'
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
  name: 'vercelDeploy',
  router: route('/vercel-deploy'),
  icon: deployIcon,
  component: VercelDeploy
}
