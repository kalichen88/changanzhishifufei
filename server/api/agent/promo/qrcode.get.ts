import { defineEventHandler } from 'h3'
import QRCode from 'qrcode'
import { currentAdmin } from '../../../utils/admin'
import { getPushUrl } from '../../../services/domain.service'
import { encodeId } from '../../../utils/hashids'

/**
 * GET /api/agent/promo/qrcode?type=dataurl|png 代理推广二维码
 * 无 text 时自动基于当前代理的推广链接生成
 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }

  const q = getQuery(event)
  const type = String(q.type || 'dataurl')
  let text = String(q.text || '')
  if (!text) {
    try {
      const domain = await getPushUrl(me.id)
      text = `http://${domain}/t?f=${encodeId(me.id)}`
    } catch {
      return { code: 0, msg: '未配置推广域名，无法生成二维码', data: null }
    }
  }

  const opts = { margin: 2, width: 360, errorCorrectionLevel: 'M' as const }
  if (type === 'png') {
    const buf = await QRCode.toBuffer(text, opts)
    setResponseHeader(event, 'Content-Type', 'image/png')
    return buf
  }
  const dataUrl = await QRCode.toDataURL(text, opts)
  return { code: 1, msg: 'success', data: dataUrl }
})
