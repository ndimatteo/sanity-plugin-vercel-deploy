import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@sanity/ui'
import { FormField } from 'sanity'

import type { PendingProject } from './types'

type Props = {
  header: string
  id: string
  values: PendingProject
  setValues: React.Dispatch<React.SetStateAction<PendingProject>>
  onClose?: () => void
  onSubmit?: React.MouseEventHandler<HTMLButtonElement>
  onSubmitText?: string
  disabled?: boolean
  loading?: boolean
  hideAccessToken?: boolean
  hideDisableDeleteAction?: boolean
}

const DeployDialogForm = ({
  header,
  id,
  values,
  setValues,
  onClose,
  onSubmit,
  onSubmitText,
  disabled,
  loading,
  hideAccessToken,
  hideDisableDeleteAction,
}: Props) => {
  return (
    <Dialog
      animate
      header={header}
      id={id}
      width={1}
      onClickOutside={onClose}
      onClose={onClose}
      footer={
        <Box padding={3}>
          <Grid columns={2} gap={3}>
            <Button padding={3} mode="ghost" text="Cancel" onClick={onClose} />
            <Button
              padding={3}
              text={onSubmitText || 'Submit'}
              tone="primary"
              loading={loading}
              onClick={onSubmit}
              disabled={
                disabled ||
                !values.projectId ||
                !values.url ||
                !values.accessToken
              }
            />
          </Grid>
        </Box>
      }
    >
      <Box padding={4}>
        <Stack space={4}>
          <FormField
            title="Display Name (internal use only)"
            description={
              <>
                This can be the environment you are deploying to, like{' '}
                <strong>Production</strong> or <strong>Staging</strong>
              </>
            }
          >
            <TextInput
              type="text"
              value={values.name}
              onChange={(e) => {
                const name = (e.target as HTMLInputElement).value
                setValues((prev) => ({ ...prev, name }))
              }}
            />
          </FormField>

          <FormField
            title="Project ID"
            description={`Vercel Project: Settings → General → "Project ID"`}
          >
            <TextInput
              type="text"
              value={values.projectId}
              onChange={(e) => {
                const projectId = (e.target as HTMLInputElement).value
                setValues((prev) => ({ ...prev, projectId }))
              }}
            />
          </FormField>

          <FormField
            title="Team ID"
            description={`Required for projects under a Vercel Team: Settings → General → "Team ID"`}
          >
            <TextInput
              type="text"
              value={values.teamId}
              onChange={(e) => {
                const teamId = (e.target as HTMLInputElement).value
                setValues((prev) => ({ ...prev, teamId }))
              }}
            />
          </FormField>

          <FormField
            title="Deploy Hook URL"
            description={`Vercel Project: Settings → Git → "Deploy Hooks"`}
          >
            <TextInput
              type="text"
              inputMode="url"
              value={values.url}
              onChange={(e) => {
                const url = (e.target as HTMLInputElement).value
                setValues((prev) => ({ ...prev, url }))
              }}
            />
          </FormField>

          {hideAccessToken ? (
            <FormField title="Access Token">
              <Card padding={4} radius={3} tone="caution">
                <Text>Access Token is hidden for security purposes.</Text>
              </Card>
            </FormField>
          ) : (
            <FormField
              title="Access Token"
              description={`Vercel Personal Account: Account Settings → "Tokens"`}
            >
              <TextInput
                type="text"
                value={values.accessToken}
                onChange={(e) => {
                  const accessToken = (e.target as HTMLInputElement).value
                  setValues((prev) => ({ ...prev, accessToken }))
                }}
              />
            </FormField>
          )}

          {!hideDisableDeleteAction && (
            <FormField>
              <Card tone="critical" padding={3} radius={2} border>
                <Flex align="center">
                  <Switch
                    id="disableDeleteAction"
                    style={{ display: 'block' }}
                    onChange={(e) => {
                      const isChecked = (e.target as HTMLInputElement).checked

                      setValues((prev) => ({
                        ...prev,
                        disableDeleteAction: isChecked,
                      }))
                    }}
                    checked={values.disableDeleteAction}
                  />
                  <Stack
                    as="label"
                    flex={1}
                    paddingLeft={3}
                    space={3}
                    htmlFor="disableDeleteAction"
                    style={{
                      cursor: 'pointer',
                    }}
                  >
                    <Text size={1} weight="medium">
                      Prevent deletion in production?
                    </Text>

                    <Text size={1} muted>
                      Disables the "Delete" action in Production builds of the
                      Studio.
                    </Text>
                  </Stack>
                </Flex>
              </Card>
            </FormField>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}

export default DeployDialogForm
