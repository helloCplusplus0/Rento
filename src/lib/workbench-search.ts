/**
 * 工作台搜索目标解析
 * 统一桌面顶部搜索、移动端工作台搜索和历史搜索组件的跳转规则。
 */
export function getWorkbenchSearchHref(query: string): string | null {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return null
  }

  const normalizedUpperQuery = normalizedQuery.toUpperCase()
  const isContractQuery =
    normalizedQuery.includes('合同') || /^CT[\w-]*$/.test(normalizedUpperQuery)

  if (isContractQuery) {
    return `/contracts?search=${encodeURIComponent(normalizedQuery)}`
  }

  return `/rooms?search=${encodeURIComponent(normalizedQuery)}`
}
