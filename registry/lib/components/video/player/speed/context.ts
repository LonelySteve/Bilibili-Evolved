/* eslint-disable no-underscore-dangle */
import { attributesSubtree } from '@/core/observer'
import { getHook } from '@/plugins/hook'
import {
  classNameMapping,
  hooks,
  nativeRates,
  selectorMapping
} from './constants'
import { MapWithDefault, _select } from './helpers'
import { ExpandSpeedMenuOptions, RememberSpeedOptions } from './services'

/**
 * 监视模式
 */
export enum ObserveMode {
  /** 传统  */
  legacy = '传统',
  /** 属性覆盖 */
  defineProperty = '属性覆盖',
}

export interface SpeedComponentOptions extends ExpandSpeedMenuOptions,  RememberSpeedOptions {
  /**
   * 监视模式 - 获得倍速更改通知的方式
   *
   * - legacy: 传统方式，利用 MutationObserver 在菜单元素上进行子孙属性监听，此模式可以兼容通过模拟点击倍速菜单项来更改倍数的外部脚本/扩展
   * - defineProperty: Object.defineProperty 方式，拦截对视频元素的 playbackRate 的属性访问，此模式可以兼容绝大部分的外部脚本/扩展
   */
  observeMode: ObserveMode
}

/**
 * 上下文初始化
 */
export interface SpeedContextInit {
  /** 容器元素 */
  containerElement?: HTMLElement
  /** 视频元素 */
  videoElement?: HTMLVideoElement
  /** 上一倍速值，缺省情况下为 1.0x */
  previousSpeed?: number
  /** 当前原生的倍速值，通常在换P更新时指定 */
  nativeSpeed?: number
  /** 组件选项 */
  options: SpeedComponentOptions
}

/**
 * 倍速上下文
 */
export class SpeedContext {
  private static defedVideoElementMapping: MapWithDefault<
    HTMLVideoElement,
    SpeedContext[]
  > = new MapWithDefault(() => [])

  private _init: SpeedContextInit
  private _containerElement?: HTMLElement
  private _videoElement?: HTMLVideoElement
  private _menuListElement?: HTMLElement
  private _speed?: number
  private _previousSpeed?: number
  private _nativeSpeed?: number

  private _observer?: MutationObserver

  /**
   * 创建倍数上下文实例
   *
   * 和之前 v1 版本的实现相比，这里一定是全新的倍数上下文，若传入上下文对象，则可以拷贝一份它的实例
   *
   * @param arg 初始化参数，或倍速上下文对象
   */
  constructor(arg: SpeedContextInit | SpeedContext) {
    if (arg instanceof SpeedContext) {
      arg = _.assign({}, arg._init, _.pick(arg, 'previousSpeed', 'nativeSpeed'))
    }
    this._init = Object.freeze(arg)
  }

  public async init() {
    const {
      containerElement,
      videoElement,
      previousSpeed,
      nativeSpeed,
    } = this._init

    this._previousSpeed = previousSpeed
    this._nativeSpeed = nativeSpeed

    this._containerElement = containerElement
      ?? (await _select<HTMLElement>(selectorMapping.speedContainer))

    this._videoElement = videoElement ?? (await _select<HTMLVideoElement>(selectorMapping.video))
    this._speed = this._videoElement.playbackRate

    this._menuListElement = await _select<HTMLElement>({
      selector: selectorMapping.speedMenuList,
      context: this._containerElement,
    })

    this.observe()
  }

  protected observe() {
    const { observeMode } = this.options

    switch (observeMode) {
      case ObserveMode.legacy:
        this._observer = this.observeMenuListElement()
        break
      case ObserveMode.defineProperty:
        // FIXME 修复多个上下文对象实例共用同一 videoElement，导致属性定义重复的问题
        this.agentVideoElement()
        break
      default:
        break
    }
  }

  protected observeMenuListElement(): MutationObserver {
    return attributesSubtree(this._menuListElement, mutations => {
      let currentSpeed: number | undefined

      // 遍历所有 mutations 以获取最新的状态值
      mutations.forEach(mutation => {
        if (mutation.attributeName !== 'class') {
          return
        }

        const speedMenuItemElement = mutation.target as HTMLLIElement

        // 若当前 mutation 的目标元素具有 active 的 class，则认为这是 active 态的目标元素，也就是被用户新选中的倍数选项
        if (speedMenuItemElement.classList.contains(classNameMapping.active)) {
          currentSpeed = parseFloat(speedMenuItemElement.dataset.value ?? '1')
        }
      })

      this.updateSpeed(currentSpeed)
    })[0]
  }

  protected agentVideoElement() {
    const videoElementPlaybackRateDescriptor = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(Object.getPrototypeOf(this._videoElement)),
      'playbackRate',
    )

    Object.defineProperty(this._videoElement, 'playbackRate', {
      get: () => videoElementPlaybackRateDescriptor.get?.call(this._videoElement),
      set: value => {
        if (this.options.observeMode) {
          SpeedContext.defedVideoElementMapping
            .get(this._videoElement)
            .forEach(context => context.updateSpeed(value))
        }

        videoElementPlaybackRateDescriptor.set?.call(this._videoElement, value)
      },
    })

    SpeedContext.defedVideoElementMapping.get(this._videoElement).push(this)
  }

  protected updateSpeed(value?: number) {
    // 不要过于死板，上一倍数值与当前倍数值不要相同
    if (this._speed === value) {
      return
    }

    this._previousSpeed = this._speed
    this._speed = value

    if (nativeRates.includes(value)) {
      this._nativeSpeed = value
    }
    // 调用钩子
    getHook(hooks.ON_SPEED_CHANGE).after(this, this.speed, this.previousSpeed)
  }

  /** 容器元素 */
  get containerElement() {
    return this._containerElement
  }

  /** 视频元素 */
  get videoElement() {
    return this._videoElement
  }

  /** 菜单列表元素 */
  get menuListElement() {
    return this._menuListElement
  }

  /** 当前倍速值 */
  get speed() {
    return this._speed
  }

  /** 上一倍速值 */
  get previousSpeed() {
    return this._previousSpeed
  }

  /** 当前原生的倍速值 */
  get nativeSpeed() {
    return this._nativeSpeed
  }

  /** 获取初始化上下文所用的选项对象 */
  get options() {
    return this._init.options
  }

  destroy() {
    this._observer?.disconnect()
  }
}

export function createContext(arg: SpeedContextInit | SpeedContext): SpeedContext {
  // TODO 做 bpx player 的兼容处理
    return new SpeedContext(arg)
}