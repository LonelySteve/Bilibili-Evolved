export class NoSuchElementError extends Error {
  constructor(
    public readonly selector: string | Function,
    public readonly context?: Node
  ) {
    context = context ?? document
    super(`未能在元素 ${context} 中找到匹配 ${selector} 选择器的元素`)
  }
}
