import { ComponentMetadata } from "@/components/types"
import { settings } from "@/core/settings"
import { logError } from "@/core/utils/log"
import { maxRateValue, minRateValue, nativeRates, rateStepValue } from "./constants"
import { calcOrder, onVideoChange } from "./helpers"
import { VideoSpeedController } from "./video-speed-controller"

const getRecommendedValue = () => {
  const val = nativeRates.slice(-1)[0] + rateStepValue
  return val > maxRateValue ? null : val
}

const createExtendedSpeedMenuItemElement = (rate: number) => {
  const li = document.createElement("li")
  li.innerText = VideoSpeedController.formatSpeedText(rate)
  li.classList.add(
    VideoSpeedController.classNameMap.speedMenuItem,
    "extended"
  )
  li.dataset.value = rate.toString()
  li.style.order = calcOrder(rate)

  const i = document.createElement("i")
  i.classList.add("mdi", "mdi-close-circle")
  i.addEventListener("click", () => {
    settings.extendVideoSpeedList = _.pull(
      settings.extendVideoSpeedList,
      rate
    )
    li.remove()
  })

  li.append(i)

  return li
}

const createAddEntryElement = () => {
  const updateInput = (elem: HTMLInputElement) => {
    const value = getRecommendedValue()
    elem.setAttribute(
      "min",
      value
        ? (elem.value = value.toString())
        : ((elem.value = ""), minRateValue.toString())
    )
  }

export const getExtraSpeedMenuItemElements = () => {
    const li = document.createElement("li")
    li.classList.add(VideoSpeedController.classNameMap.speedMenuItem)

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
        if (VideoSpeedController.supportedRates.includes(value)) {
          logError("不能重复添加已有的倍数值")
          return false
        }
        settings.extendVideoSpeedList.push(value)
        settings.extendVideoSpeedList =
          VideoSpeedController.extendedSupportedRates

        let afterElement = li.nextElementSibling as HTMLLIElement
        while (
          !afterElement.dataset.value ||
          (parseFloat(afterElement.dataset.value) >
            VideoSpeedController.nativeSupportedRates.slice(-1)[0] &&
            value < parseFloat(afterElement.dataset.value))
        ) {
          afterElement = afterElement.nextElementSibling as HTMLLIElement
        }
        afterElement.before(createExtendedSpeedMenuItemElement(value))
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

    
  // 应用样式
  resources.applyStyleFromText(
    `
  .${VideoSpeedController.classNameMap.speedContainer} .${VideoSpeedController.classNameMap.speedMenuItem}:first-child .mdi-playlist-plus {
    font-size: 1.5em;
  }
  .${VideoSpeedController.classNameMap.speedContainer} .${VideoSpeedController.classNameMap.speedMenuItem}:first-child input {
    font-size: inherit;
    color: inherit;
    line-height: inherit;
    background: transparent;
    outline: none;
    width: 100%;
    border: none;
    text-align: center;
  }
  .${VideoSpeedController.classNameMap.speedMenuItem} .mdi-close-circle {
    color: inherit;
    opacity: 0.5;
    display: none;
    position: absolute;
    right: 4px;
  }
  .${VideoSpeedController.classNameMap.speedMenuItem}:not(.${VideoSpeedController.classNameMap.active}):hover .mdi-close-circle {
    display: inline;
  }
  .${VideoSpeedController.classNameMap.speedMenuItem} .mdi-close-circle:hover {
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
  .${VideoSpeedController.classNameMap.speedMenuList} {
    display: flex;
    flex-direction: column;
  }
  `,
    "extend-video-speed-style"
  )

  const elements = VideoSpeedController.extendedSupportedRates
    .map((rate) => createExtendedSpeedMenuItemElement(rate))
    .reverse()

  elements.unshift(createAddEntryElement())

  return elements
  }


  const setExtendedVideoSpeed = (speed: number) =>  {
    if (VideoSpeedController.nativeSupportedRates.includes(speed)) {
      this.getSpeedMenuItem(speed).click()
    } else {
      this.forceUpdate(speed)
    }
  }

 

const forceUpdate = (value: number) => {
  this._menuListElement.querySelector(`.${VideoSpeedController.classNameMap.speedMenuItem}[data-value="${this.playbackRate}"]`)?.classList.remove(VideoSpeedController.classNameMap.active);
  this._menuListElement.querySelector(`.${VideoSpeedController.classNameMap.speedMenuItem}[data-value="${value}"]`)?.classList.add(VideoSpeedController.classNameMap.active);
  this._videoElement.playbackRate = value
  this._containerElement.classList.remove(VideoSpeedController.classNameMap.show)
  this._nameBtn.innerText = VideoSpeedController.formatSpeedText(value)
}

let containerElement: HTMLElement = undefined
let videoElement: HTMLVideoElement = undefined
let menuListElement: HTMLElement = undefined

const entry = () => {
  onVideoChange((containerElement_, videoElement_, menuListElement_) => {
    unload()
    containerElement = containerElement_
    videoElement = videoElement_
    menuListElement = menuListElement_
    reload()
  })
}

const tryForceUpdate  = (ev: HTMLElementEventMap["click"]) => {
  const option = (ev.target as HTMLElement)
  const value = parseFloat(option.dataset.value as string)
  if ((ev.target as HTMLElement).classList.contains("extended")) {
    setExtendedVideoSpeed(value)
  }
  // 从扩展倍数切换到之前选中的原生倍数
  if (VideoSpeedController.extendedSupportedRates.includes(controller.playbackRate) && controller._nativeSpeedVal === value) {
    forceUpdate(value)
  }
}

const reload = () => {
  menuListElement.prepend(...getExtraSpeedMenuItemElements())
  
        // 为所有原生倍速菜单项设置 Order
        menuListElement.querySelectorAll(`.${VideoSpeedController.classNameMap.speedMenuItem}[data-value]:not(.extended)`).forEach(
          (it: HTMLLIElement) => { it.style.order = calcOrder(parseFloat(it.getAttribute("data-value")!)) }
        );
        // 如果开启了扩展倍数，存在一种场景使倍数设置会失效：
        //   1. 用户从原生支持的倍数切换到扩展倍数
        //   2. 用户从扩展倍数切换到之前选中的原生倍数
        // 这是因为播放器内部实现维护了一个速度值，但是在切换到扩展倍数时没法更新，因此切换回来的时候被判定没有发生变化
        // 为了解决这个问题，需要通过 forceUpdate 方法替官方更新元素，并为视频设置正确的倍数，并关闭菜单
        menuListElement.addEventListener("click", tryForceUpdate)
}

const unload = () => {}


export const component: ComponentMetadata = {
  entry,
  reload,
  unload,
  name: "extendSpeedMenu",
  displayName: "扩展视频倍数菜单",
  enabledByDefault: true,
  description: "扩展播放器的视频倍数菜单，并可通过新增的倍数输入框添加更多的自定义倍数.",
  tags: [componentsTags.video],
  options: {
    extendVideoSpeedList: {
      displayName: "扩展视频倍数列表",
      defaultValue: [],
      hidden: true,
    },
  },