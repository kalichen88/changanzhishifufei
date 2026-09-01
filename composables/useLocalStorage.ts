/**
 * 响应式 localStorage（仅客户端，SSR 返回默认值）
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const state = ref<T>(defaultValue)

  if (import.meta.client) {
    const raw = window.localStorage.getItem(key)
    if (raw !== null) {
      try {
        state.value = JSON.parse(raw) as T
      } catch {
        state.value = raw as unknown as T
      }
    }

    watch(
      state,
      (val) => {
        if (val === undefined || val === null || val === '') {
          window.localStorage.removeItem(key)
        } else if (typeof val === 'string') {
          window.localStorage.setItem(key, val)
        } else {
          window.localStorage.setItem(key, JSON.stringify(val))
        }
      },
      { deep: true },
    )
  }

  return state
}
