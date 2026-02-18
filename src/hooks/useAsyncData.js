import { useCallback, useState } from 'react'

export function useAsyncData(fetcher, { initialData = null } = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(initialData)

  const run = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetcher(...args)
        setData(result)
        return result
      } catch (requestError) {
        setError(requestError)
        throw requestError
      } finally {
        setLoading(false)
      }
    },
    [fetcher],
  )

  return {
    loading,
    error,
    data,
    setData,
    run,
  }
}
