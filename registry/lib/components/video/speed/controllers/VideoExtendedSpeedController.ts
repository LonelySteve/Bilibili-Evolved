import { addStyle } from "@/core/style"
import { logError } from "@/core/utils/log"
import {
  classNameMapping,
  maxRateValue,
  minRateValue,
  nativeRates,
  rateStepValue,
  selectorMapping
} from "../constants"
import { calcOrder, formatSpeedText } from "../helpers"
import {
  VideoSpeedController,
  VideoSpeedControllerCommonProps
} from "./VideoSpeedController"

interface VideoExtendedSpeedControllerCommonProps
  extends VideoSpeedControllerCommonProps {
  /** 扩展的倍数值 */
  extendedRates?: number[]
  onExtendedRatesChange: (extendedRates: number[]) => void
}

export class VideoExtendedSpeedController extends VideoSpeedController {
  private _nameBtn: HTMLButtonElement
  /** 默认扩展支持的速率值 */
  private _extendedRates = [2.5, 3.0]

  private _availableRates: number[]

  protected readonly onExtendedRatesChange?: (extendedRates: number[]) => void

  protected get recommendedExtendedRate() {
    const val = this.availableRates.slice(-1)[0] + rateStepValue
    return val > maxRateValue ? null : val
  }

  protected get extendedRates() {
    return this._extendedRates
  }

  protected set extendedRates(rates: number[]) {
    this._availableRates = [...nativeRates, ...rates].sort((a, b) => a - b)
    this._extendedRates = rates
  }

  get availableRates() {
    return this._availableRates
  }

  protected createExtendedSpeedMenuItemElement(rate: number) {
    const li = document.createElement("li")
    li.innerText = formatSpeedText(rate)
    li.classList.add(classNameMapping.speedMenuItem, "extended")
    li.dataset.value = rate.toString()
    li.style.order = calcOrder(rate)

    // 创建【移除图标】
    const i = document.createElement("i")
    i.classList.add("mdi", "mdi-close-circle")
    i.addEventListener(
      "click",
      () => {
        this.extendedRates = _.pull(this.extendedRates, rate)
        this.onExtendedRatesChange?.call(this, this.extendedRates.slice())
        li.remove()
      },
      { once: true }
    )

    li.append(i)

    return li
  }

  protected createAddEntryElement() {
    const updateInput = (elem: HTMLInputElement) => {
      const value = this.recommendedExtendedRate
      elem.setAttribute(
        "min",
        value
          ? (elem.value = value.toString())
          : ((elem.value = ""), minRateValue.toString())
      )
    }

    const li = document.createElement("li")
    li.classList.add(classNameMapping.speedMenuItem)

    const iconElement = document.createElement("i")
    iconElement.classList.add("mdi", "mdi-playlist-plus")

    const input = document.createElement("input")
    input.classList.add("add-speed-entry")
    input.setAttribute("type", "number")
    input.setAttribute("max", maxRateValue.toString())
    input.setAttribute("step", rateStepValue.toString())
    input.setAttribute("title", "增加新的倍数值")
    updateInput(input)
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        const value = parseFloat(input.value)
        if (!isFinite(value)) {
          logError("无效的倍数值")
          return false
        }
        if (value < minRateValue) {
          logError("倍数值太小了")
          return false
        }
        if (value > maxRateValue) {
          logError("倍数值太大了")
          return false
        }
        if (this.availableRates.includes(value)) {
          logError("不能重复添加已有的倍数值")
          return false
        }
        this.extendedRates.push(value)
        this.onExtendedRatesChange.call(this, this.extendedRates.slice())

        let afterElement = li.nextElementSibling as HTMLLIElement
        while (
          !afterElement.dataset.value ||
          (parseFloat(afterElement.dataset.value) > nativeRates.slice(-1)[0] &&
            value < parseFloat(afterElement.dataset.value))
        ) {
          afterElement = afterElement.nextElementSibling as HTMLLIElement
        }
        afterElement.before(this.createExtendedSpeedMenuItemElement(value))
      }
    })

    li.prepend(iconElement, input)

    input.style.display = "none"
    li.addEventListener("mouseenter", () => {
      updateInput(input)
      input.style.display = "inline"
      iconElement.style.display = "none"
      input.focus()
    })
    li.addEventListener("mouseleave", () => {
      iconElement.style.display = "inline"
      input.style.display = "none"
    })

    return li
  }

  protected addStyle(name: string) {
    // 应用样式
    addStyle(
      `
        ${selectorMapping.speedContainer} ${selectorMapping.speedMenuItem}:first-child .mdi-playlist-plus {
          font-size: 1.5em;
        }
        ${selectorMapping.speedContainer} ${selectorMapping.speedMenuItem}:first-child input {
          font-size: inherit;
          color: inherit;
          line-height: inherit;
          background: transparent;
          outline: none;
          width: 100%;
          border: none;
          text-align: center;
        }
        ${selectorMapping.speedMenuItem} .mdi-close-circle {
          color: inherit;
          opacity: 0.5;
          display: none;
          position: absolute;
          right: 4px;
        }
        .${selectorMapping.speedMenuItem}:not(${selectorMapping.active}):hover .mdi-close-circle {
          display: inline;
        }
        .${selectorMapping.speedMenuItem} .mdi-close-circle:hover {
          opacity: 1;
          transition: all .3s;
        }
        /* https://stackoverflow.com/a/4298216 */
        /* Chrome */
        .add-speed-entry::-webkit-outer-spin-button,
        .add-speed-entry::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Firefox */
        .add-speed-entry[type=number] {
          -moz-appearance:textfield;
        }
        ${selectorMapping.speedMenuList} {
          display: flex;
          flex-direction: column;
        }
`,
      name
    )
  }

  protected createExtraSpeedMenuItemElements(
    styleName = "extend-video-speed-style"
  ) {
    this.addStyle(styleName)

    const elements = this.extendedRates
      .map((rate) => this.createExtendedSpeedMenuItemElement(rate))
      .reverse()

    elements.unshift(this.createAddEntryElement())

    return elements
  }

  constructor(props: VideoExtendedSpeedControllerCommonProps) {
    super(props)

    if (props.extendedRates) {
      this.extendedRates = props.extendedRates
    }
    this.onExtendedRatesChange = props.onExtendedRatesChange
    this._nameBtn = this.containerElement.querySelector(
      selectorMapping.speedNameBtn
    )
  }

  protected handleContainerElementChange() {
    super.handleContainerElementChange()
    this.menuListElement.prepend(...this.createExtraSpeedMenuItemElements())
    // 为所有原生倍速菜单项设置 Order
    this.menuListElement
      .querySelectorAll(
        `${selectorMapping.speedMenuItem}[data-value]:not(.extended)`
      )
      .forEach((it: HTMLLIElement) => {
        it.style.order = calcOrder(parseFloat(it.getAttribute("data-value")!))
      })
    // 如果开启了扩展倍数，存在一种场景使倍数设置会失效：
    //   1. 用户从原生支持的倍数切换到扩展倍数
    //   2. 用户从扩展倍数切换到之前选中的原生倍数
    // 这是因为播放器内部实现维护了一个速度值，但是在切换到扩展倍数时没法更新，因此切换回来的时候被判定没有发生变化
    // 为了解决这个问题，需要通过 forceUpdate 方法替官方更新元素，为视频设置正确的倍数，并关闭菜单
    this.menuListElement.addEventListener("click", (ev) => {
      const option = ev.target as HTMLElement
      const value = parseFloat(option.dataset.value as string)
      if ((ev.target as HTMLElement).classList.contains("extended")) {
        this.setExtendedVideoSpeed(value)
      }
      // 从扩展倍数切换到之前选中的原生倍数，须进行强制更新
      if (
        this.extendedRates.includes(this.playbackRate) &&
        this.nativeSpeed === value
      ) {
        this.forceUpdate(value)
      }
    })
  }

  protected setExtendedVideoSpeed(speed: number) {
    if (nativeRates.includes(speed)) {
      this.getSpeedMenuItemElement(speed).click()
    } else {
      this.forceUpdate(speed)
    }
  }

  protected forceUpdate(value: number) {
    this.menuListElement
      .querySelector(
        `${selectorMapping.speedMenuItem}[data-value="${this.playbackRate}"]`
      )
      ?.classList.remove(classNameMapping.active)
    this.menuListElement
      .querySelector(`${selectorMapping.speedMenuItem}[data-value="${value}"]`)
      ?.classList.add(classNameMapping.active)
    this.videoElement.playbackRate = value
    this.containerElement.classList.remove(classNameMapping.show)
    this._nameBtn.innerText = formatSpeedText(value)
  }
}
