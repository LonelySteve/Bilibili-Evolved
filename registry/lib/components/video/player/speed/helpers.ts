import { videoChange } from "@/core/observer"
import { select, SpinQueryConfig } from "@/core/spin-query"
import { logError } from "@/core/utils/log"
import { maxRateValue, selectorMapping } from "./constants"
import { NoSuchElementError } from "./exceptions"

export const calcOrder = (value: number) => {
  return ((maxRateValue - value) * 10000).toString()
}

export function getSpeedMenuItem(speed: number): HTMLElement
export function getSpeedMenuItem(speed?: number) {
  if (speed) {
    return this._menuListElement.querySelector(
      `${selectorMapping.speedMenuItem}[data-value="${speed}"]`
    )
  }
  return this._menuListElement.querySelector(
    `${selectorMapping.speedMenuItem}${selectorMapping.active}`
  )
}

export const onVideoChange = (
  handler: (
    containerElement: HTMLElement,
    videoElement: HTMLVideoElement,
    menuListElement: HTMLElement
  ) => void
) => {
  videoChange(() => {
    const promisedVideoElement = select(selectorMapping.video)
    const promisedContainerElement = select(selectorMapping.speedContainer)

    Promise.all([promisedVideoElement, promisedContainerElement])
      .then(([videoElement, containerElement]) => {
        if (!promisedVideoElement) {
          logError("videoElement not found!")
          return
        }
        if (!promisedContainerElement) {
          logError("containerElement not found!")
          return
        }
        const menuListElement = containerElement.querySelector(
          selectorMapping.speedMenuList
        )
        handler(
          containerElement as HTMLElement,
          videoElement as HTMLVideoElement,
          menuListElement as HTMLElement
        )
      })
      .catch(logError)
  })
}

export function _select<T = Element>(
  query: string | (() => T | null) | { selector: string; context?: Element },
  config?: SpinQueryConfig
) {
  if (_.isObject(query)) {
    const { selector, context } = query as {
      selector: string
      context?: Element
    }
    query = () =>
      ((context ?? document).querySelector(selector) as unknown) as T
  }

  const result = select<T>(query, config)

  if (!result) {
    throw new NoSuchElementError(query)
  }

  return result
}

export function formatSpeedText(speed: number) {
  if (speed === 1) {
    return "倍数"
  }
  return Math.trunc(speed) === speed ? `${speed}.0x` : `${speed}x`
}
