import React from 'react'

import VercelDeploy from './vercel-deploy'

const deployIcon = () => {
  return (
    <svg
      data-sanity-icon="true"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      width="1em"
      height="1em"
    >
      <path
        d="M10.06,19.53H4.27L12.5,5.21l8.23,14.32H14.94"
        style={{
          stroke: 'currentColor',
          strokeWidth: '1.2'
        }}
      />
      <path
        d="M12.5,12.58v7.51"
        style={{
          stroke: 'currentColor',
          strokeWidth: '1.2'
        }}
      />
      <path
        d="M15.12,16.76,12.5,12.58,10,16.71"
        style={{
          stroke: 'currentColor',
          strokeWidth: '1.2'
        }}
      />
    </svg>
  )
}

export default {
  title: 'Deploy',
  name: 'vercel-deploy',
  icon: deployIcon,
  component: VercelDeploy
}
