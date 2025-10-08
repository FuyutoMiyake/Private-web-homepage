/**
 * プレビュー本文から抜粋を生成（句読点で丸め）
 */
export function excerptFromPreview(text: string, max = 160): string {
  // 連続空白を1つに
  const plain = text.replace(/\s+/g, ' ').trim()

  if (plain.length <= max) return plain

  const cut = plain.slice(0, max + 20)

  // 句読点で丸め（優先順位: 。> ！？ > 、）
  const rounded =
    cut.match(/^.+[。．]/)?.[0] ||
    cut.match(/^.+[！？!?]/)?.[0] ||
    cut.match(/^.+[、，]/)?.[0] ||
    cut.slice(0, max)

  return rounded.length < 40
    ? plain.slice(0, max) + '…'
    : rounded + (rounded.endsWith('…') ? '' : '…')
}
