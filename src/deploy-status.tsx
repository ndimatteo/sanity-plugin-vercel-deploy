import React from 'react'

import { Badge, BadgeMode, BadgeTone, Flex, type FlexJustify } from '@sanity/ui'

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

  const badgeMode =
    ({
      LOADING: 'outline',
      READY: 'outline',
      CANCELED: 'outline',
    }[status] as BadgeMode) || 'default'

  return (
    <Flex wrap="nowrap" align="center" justify={justify}>
      <Badge mode={badgeMode} tone={badgeTone} padding={2} fontSize={1}>
        {titleCase(status)}
      </Badge>
      {children}
    </Flex>
  )
}

export default DeployStatus
