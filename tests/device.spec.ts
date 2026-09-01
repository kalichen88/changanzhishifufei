import { describe, it, expect } from 'vitest'
import { detectDevice, detectBuiltinBrowser } from '../server/utils/device'

describe('设备识别（8.3）', () => {
  it('手机 UA → mobile', () => {
    expect(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148')).toBe('mobile')
    expect(detectDevice('Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36')).toBe('mobile')
    expect(detectDevice('Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1) AppleWebKit/537.36 (KHTML, like Gecko)')).toBe('mobile')
    expect(detectDevice('Mozilla/5.0 (Linux; Android 10) Mobile Safari/537.36')).toBe('mobile')
  })

  it('平板 UA → tablet', () => {
    expect(detectDevice('Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')).toBe('tablet')
    expect(detectDevice('Mozilla/5.0 (Linux; Android 11; Lenovo TB-J606F) AppleWebKit/537.36 Silk/98')).toBe('tablet')
  })

  it('桌面 UA → pc', () => {
    expect(detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')).toBe('pc')
    expect(detectDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15')).toBe('pc')
    expect(detectDevice('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36')).toBe('pc')
  })

  it('空 UA / 爬虫 → other', () => {
    expect(detectDevice('')).toBe('other')
    expect(detectDevice('curl/7.88.1')).toBe('other')
    expect(detectDevice('python-requests/2.31.0')).toBe('other')
    expect(detectDevice('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe('other')
    expect(detectDevice('Mozilla/5.0 HeadlessChrome/120.0')).toBe('other')
  })

  it('内置浏览器识别（防封提示）', () => {
    expect(detectBuiltinBrowser('MicroMessenger/8.0.30(0x18001e2b)')).toBe('wechat')
    expect(detectBuiltinBrowser('Mozilla/5.0 (Linux; Android 12; aweme/27.1.0)')).toBe('douyin')
    expect(detectBuiltinBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) QQ/8.9.7 _SQ_/1.0')).toBe('qq')
    expect(detectBuiltinBrowser('Mozilla/5.0 (Windows NT 10.0) Chrome/120')).toBe(null)
  })
})
