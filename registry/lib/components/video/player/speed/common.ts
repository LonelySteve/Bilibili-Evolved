import { ComponentMetadata } from "@/components/types"
import { attributesSubtree, videoChange } from "@/core/observer"
import { select } from "@/core/spin-query"
import { addHook, getHook } from "@/plugins/hook"
import once from "lodash/once"
import {
  classNameMapping,
  hooks,
  nativeRates,
  selectorMapping
} from "./constants"

interface VideoSpeedCommonOptions {
  /** 容器元素 */
  containerElement?: HTMLElement
  /** 视频元素 */
  videoElement?: HTMLVideoElement
  /** 上一P的倍数值 */
  previousSpeed?: number
  /** 当前原生的倍数值，通常在换P更新时指定 */
  nativeSpeed?: number
}

// 移除静态成员，其作用实质上与实例成员的作用重复。
// 

export class VideoSpeedController {
  // 分 P 共享倍数值
  private static sharedSpeed: number | undefined = undefined
  // 分 P 切换时共享同一个原生倍速值，初始值设置为 1
  private static sharedNativeSpeed = 1
  // 持有菜单容器元素的引用，videoChange 时更换（以前缓存的 VideoController 就没有意义了）
  private static currentContainerElement: HTMLElement
  // 控制器实例
  private static instance?: VideoSpeedController
  /** 初始化倍数控制器 */
  // 倍数控制器只能初始化一次，若其子类尝试调用此静态函数进行初始化则不起作用
  static init = once(function(this: typeof VideoSpeedController) {
    addHook(hooks.ON_SPEED_CHANGE, {
      after: (controller, currentSpeed, isNativeSpeed) => {
        this.sharedSpeed = currentSpeed
        if (isNativeSpeed) {
          this.sharedNativeSpeed = currentSpeed
        }
      },
    })
    videoChange(async () => {
      const controller = await this.getInstance()
      controller.observe()
      getHook(hooks.ON_VIDEO_CHANGE, controller).after()
    })
  })
  /**
   * 获取倍数控制器实例
   * 
   * @param options 倍数控制器选项
   * @returns 
   */
  static async getInstance(options: VideoSpeedCommonOptions = {}) {
    const containerElement =
      options.containerElement ??
      ((await select(selectorMapping.speedContainer)) as HTMLElement)
    const videoElement =
      options.videoElement ??
      ((await select(selectorMapping.video)) as HTMLVideoElement)

    if (!containerElement) {
      throw "speed container element not found!"
    }
    if (!videoElement) {
      throw "video element not found!"
    }

    return new this({
      ...options,
      containerElement,
      videoElement,
    })
  }

  private _containerElement: HTMLElement
  private _menuListElement: HTMLElement
  private _videoElement: HTMLVideoElement
  // 这个值模拟原生内部记录的速度倍数，它不应该被赋值成扩展倍数的值
  private _nativeSpeedVal: number
  // 这个值用于表示上一次（上一P）的倍数值，如果是首次播放第一P，则为 undefined
  private _previousSpeedVal?: number

  private _observer?: MutationObserver

  constructor({
    containerElement,
    videoElement,
    previousSpeed,
    nativeSpeed,
  }: VideoSpeedCommonOptions &
    Required<
      Pick<VideoSpeedCommonOptions, "containerElement" | "videoElement">
    >) {
    const controller = VideoSpeedController.instance

    if (
      controller &&
      VideoSpeedController.currentContainerElement === containerElement &&
      (!previousSpeed || controller._previousSpeedVal === previousSpeed) &&
      (!nativeSpeed || controller._nativeSpeedVal === nativeSpeed)
    ) {
      return controller
    }

    this._videoElement = videoElement
    this._containerElement = containerElement
    this._previousSpeedVal = previousSpeed
    this._nativeSpeedVal =
      nativeSpeed ??
      (previousSpeed && nativeRates.includes(previousSpeed) ? previousSpeed : 1)
    this._menuListElement = this._containerElement.querySelector(
      selectorMapping.speedMenuList
    ) as HTMLElement

    VideoSpeedController.instance?.destroy()
    VideoSpeedController.instance = this
    VideoSpeedController.currentContainerElement = containerElement
  }

  get menuListElement() {
    return this._menuListElement
  }

  get containerElement() {
    return this._containerElement
  }

  get videoElement() {
    return this._videoElement
  }

  get playbackRate() {
    return this._videoElement.playbackRate
  }

  getSpeedMenuItem(speed: number): HTMLElement
  getSpeedMenuItem(speed?: number) {
    return this._menuListElement.querySelector(
      speed
        ? `${selectorMapping.speedMenuItem}[data-value="${speed}"]`
        : `${selectorMapping.speedMenuItem}${selectorMapping.active}`
    )
  }

  setVideoSpeed(speed?: number) {
    speed && this.getSpeedMenuItem(speed).click()
  }

  observe() {
    this._observer = attributesSubtree(this._menuListElement, (mutations) => {
      let [previousSpeed, currentSpeed]: [number?, number?] = [
        undefined,
        undefined,
      ]

      mutations.forEach((mutation) => {
        const selectedSpeedOption = mutation.target as HTMLLIElement

        if (!selectedSpeedOption.classList.contains(classNameMapping.active)) {
          previousSpeed = parseFloat(selectedSpeedOption.dataset.value ?? "1")
          return
        }

        currentSpeed = parseFloat(selectedSpeedOption.dataset.value ?? "1")

        let isNativeSpeed = false
        if (nativeRates.includes(currentSpeed)) {
          this._nativeSpeedVal = currentSpeed
          isNativeSpeed = true
        }

        getHook(
          hooks.ON_SPEED_CHANGE,
          this,
          currentSpeed,
          isNativeSpeed
        ).after()
      })

      // 刷新 this._previousSpeedVal
      // - 用户可以通过倍数菜单或者倍数快捷键造成类似 1.5x 2.0x 2.0x... 这样的倍数设定序列
      //   我们不希望在第二个 2.0x 的时候刷新 this._previousSpeedVal，这样会比较死板
      //   判定依据在于 previousSpeed !== currentSpeed
      if (previousSpeed && previousSpeed !== currentSpeed) {
        this._previousSpeedVal = previousSpeed
      }
    })[0]
  }

  destroy() {
    this._observer?.disconnect()
  }
}

function videoSpeedControllerStatic() {

  VideoSpeedController 
}

VideoSpeedController.init()


export default {} as ComponentMetadata

// 倍数记忆
// - 记忆策略
// - 记忆策略管理
// 倍数菜单扩展
// - 默认应有哪些倍数？
// - 恢复默认扩展倍速
// - 最大高度限制
// 倍数控制接口
// - 设置倍数
// - 获取倍数
