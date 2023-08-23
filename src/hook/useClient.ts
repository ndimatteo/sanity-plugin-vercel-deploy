import { useClient as useSanityClient, type SanityClient } from 'sanity'
import { API_VERSION } from '../utils/constants'

export const useClient = (): SanityClient => {
  return useSanityClient({ apiVersion: API_VERSION })
}
