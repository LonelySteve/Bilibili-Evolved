import { selectorMapping } from "./constants"
import { _select } from "./helpers"

export enum RememberStrategy {
  /** 停用 */
  none = "停用",
  /** 按视频级别 */
  video = "按视频级别",
  /** 上次级别 */
  latest = "按最近一次",
}

export interface ContextOptions {
  // 扩展播放器的视频倍数菜单
  expandSpeedMenu: boolean
  // 记忆播放器的视频倍数
  rememberSpeed: RememberStrategy
  // 记忆视频倍数列表
  rememberVideoSpeedList: Record<number, (string | number)[]>
  // 扩展视频倍数列表
  extendVideoSpeedList: number[]
  // 后备倍数值
  fallbackSpeed: number
}

export interface SpeedContext {
  /** 容器元素 */
  readonly containerElement: HTMLElement
  /**
   * 视频元素
   *
   * 【注意】不要通过此元素设置倍数，即**不要使用**类似 `videoElement.playbackRate = 1` 这样的方式来尝试变更倍数，这会导致上下文状态过时。正确的方式是直接对此上下文对象的 `playbackRate` 进行赋值。
   */
  readonly videoElement: HTMLVideoElement
  /** 当前视频播放速度 */
  playbackRate: number
  /** 菜单列表元素 */
  readonly menuListElement: HTMLElement
  /** 当前倍数值 */
  readonly speed?: number
  /** 上一倍数值 */
  readonly previousSpeed?: number
  /** 当前原生的倍数值，通常在换P更新时指定 */
  readonly nativeSpeed?: number
  /** 初始化环境所用的选项 */
  readonly options: ContextOptions
  /** 销毁并释放此环境所用的资源 */
  destroy(): void
}

export async function createContext(options: ContextOptions) {
  const containerElement = await _select(selectorMapping.speedContainer)
  const videoElement = (await _select(
    selectorMapping.video
  )) as HTMLVideoElement

  return {
    containerElement,
    videoElement,
    options,
  }
}
