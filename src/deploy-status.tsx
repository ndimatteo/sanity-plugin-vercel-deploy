import React from 'react'

import { Badge, Flex, Text } from '@sanity/ui'

import type { BadgeTone, FlexJustify } from '@sanity/ui'

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
  const titleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(' ')
  }

  const badgeTone =
    ({
      LOADING: 'default',
      ERROR: 'critical',
      INITIATED: 'default',
      CANCELED: 'default',
      READY: 'positive',
      BUILDING: 'caution',
      QUEUED: 'default',
    }[status] as BadgeTone) || 'default'

  return (
    <Flex wrap="nowrap" align="center" justify={justify}>
      <Badge tone={badgeTone} padding={2} radius={2}>
        <span style={{ fontWeight: 500 }}>{titleCase(status)}</span>
      </Badge>
      {children}
    </Flex>
  )
}

export default DeployStatus
