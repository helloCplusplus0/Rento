// 保持 `/contracts/new` 与旧 `/add/contract` 入口承接同一真实页面，
// 避免 legacy 宿主中继续出现“一个是真实表单、一个是占位页”的双入口漂移。
export { metadata, default } from '../../add/contract/page'
