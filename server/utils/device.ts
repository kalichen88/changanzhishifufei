/**
 * 设备识别（精确 UA 规则，见文档 8.3，可单测）
 */
export type DeviceType = 'mobile' | 'tablet' | 'pc' | 'other'

export function detectDevice(ua: string): DeviceType {
  if (!ua) return 'other'
  // 平板优先（iPad UA 常含 "Mobile" 子串，须先判平板）
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) {
    return 'tablet'
  }
  if (/iPhone|iPod|Android|Windows Phone|Mobile|Mobile Safari|IEMobile/i.test(ua)) {
    return 'mobile'
  }
  if (/Windows NT|Macintosh|Linux x86_64|CrOS|X11|Mac OS/i.test(ua)) {
    return 'pc'
  }
  if (/curl|wget|python|bot|spider|crawler|HeadlessChrome|Postman|Go-http-client/i.test(ua)) {
    return 'other'
  }
  return 'other'
}

// 还原原版 fangfeng()：微信/QQ/抖音内置浏览器
export function detectBuiltinBrowser(ua: string): 'wechat' | 'qq' | 'douyin' | null {
  if (/MicroMessenger/i.test(ua)) return 'wechat'
  if (/aweme/i.test(ua)) return 'douyin'
  if (/QQ/i.test(ua) && /_SQ_/i.test(ua)) return 'qq'
  return null
}
