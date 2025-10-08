import { createClient } from '@supabase/supabase-js'

// Supabase クライアント（クライアントサイド用）
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Supabase クライアント（サーバーサイド用 - Service Role）
export function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and Service Role Key are required')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * 画像をSupabase Storageにアップロード
 * @param file アップロードするファイル
 * @param bucket バケット名（デフォルト: 'post-images'）
 * @returns アップロードされた画像の公開URL
 */
export async function uploadImage(
  file: File,
  bucket: string = 'post-images'
): Promise<string> {
  const supabase = getSupabaseClient()

  // ファイル名の生成（重複を避けるためタイムスタンプとランダム文字列を追加）
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const fileExt = file.name.split('.').pop()
  const fileName = `${timestamp}-${randomStr}.${fileExt}`

  // アップロード
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // 公開URLを取得
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return publicUrl
}

/**
 * サーバーサイドで画像をアップロード
 * @param fileBuffer ファイルのバッファ
 * @param fileName ファイル名
 * @param contentType MIMEタイプ
 * @param bucket バケット名（デフォルト: 'post-images'）
 * @returns アップロードされた画像の公開URL
 */
export async function uploadImageServer(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  bucket: string = 'post-images'
): Promise<string> {
  const supabase = getSupabaseServiceClient()

  // ファイル名の生成
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const fileExt = fileName.split('.').pop()
  const newFileName = `${timestamp}-${randomStr}.${fileExt}`

  // アップロード
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(newFileName, fileBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // 公開URLを取得
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return publicUrl
}

/**
 * Supabase Storageから画像を削除
 * @param imageUrl 削除する画像のURL
 * @param bucket バケット名（デフォルト: 'post-images'）
 */
export async function deleteImage(
  imageUrl: string,
  bucket: string = 'post-images'
): Promise<void> {
  const supabase = getSupabaseServiceClient()

  // URLからファイルパスを抽出
  const urlParts = imageUrl.split(`${bucket}/`)
  if (urlParts.length < 2) {
    throw new Error('Invalid image URL')
  }
  const filePath = urlParts[1]

  // 削除
  const { error } = await supabase.storage.from(bucket).remove([filePath])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}
