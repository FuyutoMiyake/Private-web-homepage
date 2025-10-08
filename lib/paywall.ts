import { Post } from '@prisma/client'

export type SplitContent = {
  preview: string
  paid: string
}

/**
 * 本文を無料部分と有料部分に分割
 */
export function split(post: Post): SplitContent {
  if (!post.paywallEnabled) {
    return { preview: post.body, paid: '' }
  }

  switch (post.freeMode) {
    case 'marker': {
      // "{/* more */}" で分割（MDX互換のコメント構文）
      const parts = post.body.split('{/* more */}')
      return {
        preview: parts[0] || post.body.slice(0, 600),
        paid: parts[1] || '',
      }
    }

    case 'chars': {
      // 文字数で分割
      const chars = post.freeChars || 800
      return {
        preview: post.body.slice(0, chars),
        paid: post.body.slice(chars),
      }
    }

    case 'sections': {
      // セクション（H2見出し）で分割
      const sections = post.body.split(/(?=^## )/m)
      const freeSections = post.freeSections || 2
      const preview = sections.slice(0, freeSections).join('')
      const paid = sections.slice(freeSections).join('')
      return { preview, paid }
    }

    default:
      return { preview: post.body, paid: '' }
  }
}

/**
 * プレビュー部分をプレーンテキストに変換
 */
export function getPreviewText(post: Post): string {
  const { preview } = split(post)
  return stripMarkdown(preview)
}

/**
 * Markdownを除去（簡易版）
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/^#+\s+/gm, '') // 見出し
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // リンク
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // 強調
    .replace(/`([^`]+)`/g, '$1') // コード
    .replace(/<!--[\s\S]*?-->/g, '') // HTMLコメント
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // MDXコメント
    .trim()
}
