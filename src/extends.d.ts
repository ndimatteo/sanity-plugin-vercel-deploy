import '@sanity/ui'
declare module '@sanity/ui' {
  interface InlineProps {
    children: React.ReactNode | React.ReactNode[]
  }
}
