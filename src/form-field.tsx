import { Stack, Text } from '@sanity/ui'
import type { ComponentProps, ReactNode } from 'react'

type Props = {
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
} & Omit<ComponentProps<typeof Stack>, 'title'>

/**
 * Lightweight form-field wrapper.
 *
 * We deliberately avoid the `FormField` exported from `sanity`: since Sanity 5
 * that component renders `FormDivergenceIndicator` / `FormNodeDivergenceDetail`,
 * which call `useDocumentDivergences()` unconditionally and throw
 * (`useDocumentDivergences must be used within a DocumentDivergencesContext`)
 * when rendered outside a document pane — as is the case here, inside a custom
 * tool dialog. This shim provides the same label/description layout with no
 * document-context dependency.
 */
const FormField = ({ title, description, children, ...rest }: Props) => (
  <Stack space={2} {...rest}>
    {title && (
      <Stack space={2}>
        <Text as="label" size={1} weight="medium">
          {title}
        </Text>
        {description && (
          <Text size={1} muted>
            {description}
          </Text>
        )}
      </Stack>
    )}
    <div>{children}</div>
  </Stack>
)

export default FormField
