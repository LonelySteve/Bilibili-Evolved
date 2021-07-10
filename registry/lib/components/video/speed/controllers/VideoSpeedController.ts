import { attributesSubtree } from "@/core/observer"
import { logError } from "@/core/utils/log"
import { getHook } from "@/plugins/hook"
import {
  classNameMapping,
  hooks,
  nativeRates,
  selectorMapping
} from "../constants"

export class NoSuchElementError extends Error {
  constructor(
    public readonly selector: string,
    public readonly context?: Element
  ) {
    const prefix = context ? `在元素 ${context} 中` : ""
    super(`${prefix}未能找到匹配 ${selector} 选择器的元素`)
  }
}

export interface VideoSpeedControllerCommonProps {
  /** 容器元素 */
  containerElement: HTMLElement
  /** 视频元素 */
  videoElement: HTMLVideoElement
  /** 当前倍数值 */
  readonly speed?: number
  /** 上一倍数值 */
  readonly previousSpeed?: number
  /** 当前原生的倍数值，通常在换P更新时指定 */
  readonly nativeSpeed?: number
}

export class VideoSpeedController implements VideoSpeedControllerCommonProps {
  // 分 P 共享倍数值
  private _speed: number | undefined = undefined
  // 分 P 切换时共享同一个原生倍速值，初始值设置为 1
  private _nativeSpeed = 1
  private _previousSpeed: number | undefined = undefined
  private _containerElement: HTMLElement
  private _menuListElement: HTMLElement
  private _videoElement: HTMLVideoElement
  private _observer?: MutationObserver

  /** 当前可用的倍数值 */
  get availableRates() {
    return nativeRates
  }

  get containerElement() {
    return this._containerElement
  }

  set containerElement(element: HTMLElement) {
    // 重新查找 menuListElement
    const menuListElement = element.querySelector(selectorMapping.speedMenuList)
    if (!menuListElement) {
      logError(new NoSuchElementError(selectorMapping.speedMenuList, element))
    }

    // 重新监视
    this._observer?.disconnect()
    this._menuListElement = menuListElement as HTMLElement
    this.observe()

    // 重新赋值
    this._containerElement = element

    // 子类处理其他的变更细节
    this.handleContainerElementChange()
  }

  get videoElement() {
    return this._videoElement
  }

  set videoElement(element: HTMLVideoElement) {
    this.videoElement = element
  }

  get previousSpeed() {
    return this._previousSpeed
  }

  get playbackRate() {
    return this._videoElement.playbackRate
  }

  get speed() {
    return this._speed
  }

  get nativeSpeed() {
    return this._nativeSpeed
  }

  protected get menuListElement() {
    return this._menuListElement
  }

  protected handleContainerElementChange() {}

  constructor(props: VideoSpeedControllerCommonProps) {
    this.containerElement = props.containerElement
    this.videoElement = props.videoElement
    this._speed = props.speed
    this._nativeSpeed = props.nativeSpeed
    this._previousSpeed = props.previousSpeed
  }

  getSpeedMenuItemElement(speed: number): HTMLElement
  getSpeedMenuItemElement(speed?: number) {
    return this._menuListElement.querySelector(
      speed
        ? `${selectorMapping.speedMenuItem}[data-value="${speed}"]`
        : `${selectorMapping.speedMenuItem}${selectorMapping.active}`
    )
  }

  setVideoSpeed(speed?: number) {
    speed && this.getSpeedMenuItemElement(speed).click()
  }

  observe() {
    this._observer = attributesSubtree(this._menuListElement, (mutations) => {
      let [previousSpeed, currentSpeed, isNativeSpeed]: [
        number?,
        number?,
        boolean?
      ] = [undefined, undefined, undefined]

      // 遍历所有 mutations 以获取最新的状态值
      mutations.forEach((mutation) => {
        if (mutation.attributeName !== "class") {
          return
        }

        const speedMenuItemElement = mutation.target as HTMLLIElement

        // 若当前 mutation 的目标元素具有 active 的 class，则认为这是 active 态的目标元素，也就是被用户新选中的倍数选项
        if (speedMenuItemElement.classList.contains(classNameMapping.active)) {
          currentSpeed = parseFloat(speedMenuItemElement.dataset.value ?? "1")
          isNativeSpeed = nativeRates.includes(currentSpeed)
        } else {
          previousSpeed = parseFloat(speedMenuItemElement.dataset.value ?? "1")
        }
      })

      // 若前后倍数值相等，则无需引起任何副作用，直接返回即可
      if (previousSpeed === currentSpeed) {
        return
      }

      if (isNativeSpeed) {
        this._nativeSpeed = currentSpeed
      }
      this._speed = currentSpeed
      this._previousSpeed = previousSpeed

      getHook(hooks.ON_SPEED_CHANGE).after(
        this,
        currentSpeed,
        previousSpeed,
        isNativeSpeed
      )
    })[0]
  }

  destroy() {
    this._observer?.disconnect()
  }
}
