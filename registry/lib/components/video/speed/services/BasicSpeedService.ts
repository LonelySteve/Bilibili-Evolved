import { nativeRates, selectorMapping } from "../constants"
import { SpeedContext } from "../context"

export class BasicSpeedService {
  constructor(public readonly context: SpeedContext) {}

  destroy() {}

  start() {}

  stop() {}

  get availableRates() {
    return nativeRates
  }

  getSpeedMenuItemElement(speed?: number): HTMLElement {
    const { menuListElement } = this.context
    return menuListElement.querySelector(
      speed
        ? `${selectorMapping.speedMenuItem}[data-value="${speed}"]`
        : `${selectorMapping.speedMenuItem}${selectorMapping.active}`
    )
  }
}
