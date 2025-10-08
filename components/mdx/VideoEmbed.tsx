import React from 'react'

interface VideoEmbedProps {
  src: string
  title?: string
  width?: string | number
  height?: string | number
}

/**
 * Google Drive動画埋め込みコンポーネント
 *
 * 使用例:
 * <VideoEmbed src="https://drive.google.com/file/d/FILE_ID/view" title="動画タイトル" />
 */
export function VideoEmbed({
  src,
  title = '動画',
  width = '100%',
  height = 480
}: VideoEmbedProps) {
  // Google DriveのURLからファイルIDを抽出
  const extractGoogleDriveId = (url: string): string | null => {
    // https://drive.google.com/file/d/FILE_ID/view 形式
    const match1 = url.match(/\/file\/d\/([^/]+)/)
    if (match1) return match1[1]

    // https://drive.google.com/open?id=FILE_ID 形式
    const match2 = url.match(/[?&]id=([^&]+)/)
    if (match2) return match2[1]

    return null
  }

  const fileId = extractGoogleDriveId(src)

  // Google Drive動画の場合
  if (fileId) {
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`

    return (
      <div className="my-8 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <iframe
          src={embedUrl}
          width={width}
          height={height}
          allow="autoplay"
          className="w-full"
          title={title}
        />
      </div>
    )
  }

  // YouTube動画の場合（将来の拡張用）
  if (src.includes('youtube.com') || src.includes('youtu.be')) {
    let videoId = ''

    if (src.includes('youtu.be/')) {
      videoId = src.split('youtu.be/')[1].split('?')[0]
    } else if (src.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(src.split('?')[1])
      videoId = urlParams.get('v') || ''
    }

    if (videoId) {
      return (
        <div className="my-8 aspect-video rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            width={width}
            height={height}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            title={title}
          />
        </div>
      )
    }
  }

  // Vimeo動画の場合（将来の拡張用）
  if (src.includes('vimeo.com')) {
    const videoId = src.split('vimeo.com/')[1]?.split('?')[0]

    if (videoId) {
      return (
        <div className="my-8 aspect-video rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            width={width}
            height={height}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            title={title}
          />
        </div>
      )
    }
  }

  // 未対応のURL形式の場合はリンクを表示
  return (
    <div className="my-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-gray-700 mb-2">
        <strong>動画:</strong> {title}
      </p>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline break-all"
      >
        {src}
      </a>
    </div>
  )
}
