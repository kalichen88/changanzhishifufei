import { defineEventHandler } from 'h3'
import QRCode from 'qrcode'

/**
 * 二维码生成（还原原版 qrcode addon）
 * 入参：text 必填；type=base64|dataurl|png（默认 dataurl）
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const text = String(q.text || '')
  const type = String(q.type || 'dataurl')
  if (!text) {
    return { code: 0, msg: 'text 不能为空', data: null }
  }

  const opts = { margin: 2, width: 300, errorCorrectionLevel: 'M' as const }
  if (type === 'png') {
    const buf = await QRCode.toBuffer(text, opts)
    setResponseHeader(event, 'Content-Type', 'image/png')
    return buf
  }
  if (type === 'base64') {
    const dataUrl = await QRCode.toDataURL(text, opts)
    return { code: 1, msg: 'success', data: dataUrl.replace(/^data:image\/png;base64,/, '') }
  }
  const dataUrl = await QRCode.toDataURL(text, opts)
  return { code: 1, msg: 'success', data: dataUrl }
})
