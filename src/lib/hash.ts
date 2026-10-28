export async function sha256(contents: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', contents)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
