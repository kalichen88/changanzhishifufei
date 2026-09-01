import type { H3Event } from 'h3'

/** 统一响应包装：{ code: 1|0, msg, data } */
export function ok(data: unknown, msg = 'success') {
  return { code: 1, msg, data }
}

export function fail(msg: string, data: unknown = null, code = 0) {
  return { code, msg, data }
}

export function throwErr(event: H3Event, msg: string, status = 400) {
  setResponseStatus(event, status)
  return fail(msg)
}
