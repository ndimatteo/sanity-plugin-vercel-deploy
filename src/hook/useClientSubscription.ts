import { useEffect } from 'react'
import useSWR from 'swr'

import { useClient } from './useClient'

export function useClientSubscription<T extends Record<string, any>>(
  query: string,
) {
  const client = useClient()
  const fetcher = (query: string) => client.fetch<T[]>(query)

  const { data, error, isLoading, mutate } = useSWR<T[]>(query, fetcher)

  useEffect(() => {
    const sub = client.listen<T>(query, {}, { includeResult: true }).subscribe({
      next: (res) => {
        if (res.type === 'mutation') {
          const wasCreated = res.mutations.some((m) => 'create' in m)
          const wasCreatedOrReplaced = res.mutations.some(
            (m) => 'createOrReplace' in m,
          )
          const wasPatched = res.mutations.some((m) => 'patch' in m)
          const wasDeleted = res.mutations.some((m) => 'delete' in m)

          mutate((prev: T[] = []): T[] => {
            const result = res.result

            if (wasCreated && result) {
              return [...prev, result]
            }

            if (wasCreatedOrReplaced && result) {
              return [result]
            }

            if (wasPatched && result) {
              return prev.map((item) =>
                item._id === res.documentId ? result : item,
              )
            }

            if (wasDeleted) {
              return prev.filter((item) => item._id !== res.documentId)
            }

            return prev
          }, false) // `false` means don't revalidate
        }
      },
    })

    return () => sub.unsubscribe()
  }, [query, mutate, client])

  return {
    data,
    isLoading,
    error,
  }
}
