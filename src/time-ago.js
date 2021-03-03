import React from 'react'
import { Box, Text, Tooltip } from '@sanity/ui'

// in miliseconds
const units = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: (24 * 60 * 60 * 1000 * 365) / 12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
}

const TimeAgo = ({ date }) => {
  const dateStr = new Date(date).toLocaleString()
  if (typeof Intl === 'undefined' || !Intl.RelativeTimeFormat) {
    return dateStr
  }

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  const getRelativeTime = (d1, d2 = new Date()) => {
    const elapsed = d1 - d2

    // "Math.abs" accounts for both "past" & "future" scenarios
    for (let u in units)
      if (Math.abs(elapsed) > units[u] || u == 'second') {
        return formatter.format(Math.round(elapsed / units[u]), u)
      }
  }

  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text muted size={1}>
            {dateStr}
          </Text>
        </Box>
      }
      fallbackPlacements={['right', 'left']}
      placement="top"
    >
      <Box paddingY={2}>
        <Text size={1}>{getRelativeTime(date, new Date())}</Text>
      </Box>
    </Tooltip>
  )
}

export default TimeAgo
