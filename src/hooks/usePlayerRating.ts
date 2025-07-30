import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export const usePlayerRating = (playerId?: number | string) => {
  const { data, error, isLoading } = useSWR(playerId ? `/rating/${playerId}` : null, fetcher)
  return { rating: data?.rating as number | undefined, error, isLoading }
}

