import React from 'react'

import { Box, Flex, type FlexJustify } from '@sanity/ui'

import styles from './deploy-status.css'

type DeployStatusProps = {
  status: string
  justify?: FlexJustify | FlexJustify[]
  children?: React.ReactNode
}
const DeployStatus: React.FC<DeployStatusProps> = ({
  status,
  justify,
  children,
}) => {
  return (
    <Flex
      wrap="nowrap"
      align="center"
      justify={justify}
      className={styles.hookStatusIndicator}
      data-indicator={status}
    >
      <Box marginLeft={2}>{titleCase(status)}</Box>
      {children}
    </Flex>
  )
}

const titleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export default DeployStatus
