import { defineEventHandler } from 'h3'
import { currentAdmin } from '../../../utils/admin'
import { getPushUrl } from '../../../services/domain.service'
import { encodeId } from '../../../utils/hashids'
import { absUrl } from '../../../utils/site'

/**
 * GET /api/agent/promo/link 生成推广链接 + 二维码
 * 还原原版 Link::getPushUrl + Hashids：{scheme}://{域名}/t?f={hashids(uid)}
 */
export default defineEventHandler(async (event) => {
  const me = currentAdmin(event)
  if (!me) {
    setResponseStatus(event, 401)
    return { code: 0, msg: '未登录', data: null }
  }

  try {
    const domain = await getPushUrl(me.id)
    const f = encodeId(me.id)
    const url = absUrl(domain, `/t?f=${f}`)
    const qrUrl = `/api/agent/promo/qrcode?text=${encodeURIComponent(url)}`
    return {
      code: 1,
      msg: 'success',
      data: {
        url,
        domain,
        f,
        qrUrl,
        raw: `${domain}/t?f=${f}`,
      },
    }
  } catch (e: any) {
    return { code: 0, msg: e?.message || '生成推广链接失败', data: null }
  }
})
