// this should not be flagged as this is a d.ts file
/* eslint-disable no-unused-vars */

import '@sanity/ui'
import React from 'react'
declare module '@sanity/ui' {
  interface InlineProps {
    children: React.ReactNode | React.ReactNode[]
  }
}
