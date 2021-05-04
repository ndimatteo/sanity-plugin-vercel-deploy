import React from 'react'

import styles from './deploy-status.css'

const StatusIndicator = ({ status, children }) => {
  return (
    <span className={styles.hookStatusIndicator} data-indicator={status}>
      {titleCase(status)}
      {children}
    </span>
  )
}

const titleCase = str => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export default StatusIndicator
