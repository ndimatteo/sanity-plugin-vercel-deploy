import React from 'react'
import styles from './status.css'

export const titleCase = str => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

const Status = ({ children, status }) => {
  return (
    <span className={styles.hookStatusIndicator} data-indicator={status}>
      {children}
    </span>
  )
}

export default Status
