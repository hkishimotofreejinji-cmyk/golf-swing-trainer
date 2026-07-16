import { getYoutubeApiKey } from '../../db'

export interface YoutubeVideo {
  videoId: string
  title: string
  channelTitle: string
  thumbnail: string
}

export async function searchYoutubeVideos(query: string, maxResults = 5): Promise<YoutubeVideo[]> {
  const apiKey = getYoutubeApiKey()
  if (!apiKey) return []

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(maxResults),
    relevanceLanguage: 'ja',
    regionCode: 'JP',
    safeSearch: 'strict',
    key: apiKey,
  })

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`YouTube検索に失敗しました (status ${res.status})`)
  }
  const data = await res.json()
  return (data.items ?? []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url,
  }))
}
