import React from 'react'

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

	if (typeof Intl === "undefined" || !Intl.RelativeTimeFormat) {
		return new Date(date).toLocaleString();
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

  return getRelativeTime(date, new Date())
}

export default TimeAgo
