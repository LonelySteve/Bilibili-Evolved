/* eslint-disable no-underscore-dangle */
/** eslint no-underscore-dangle: "allow" */

import { addStyle, removeStyle } from '@/core/style'
import { mountVueComponent } from '@/core/utils'
import {
  classNameMapping, maxRateValue, nativeRates, rateStepValue, selectorMapping
} from '../constants'
import { SpeedContext } from '../context'
import { calcOrder, formatSpeedText } from '../helpers'
import { BasicSpeedService } from './BasicSpeedService'
import AddSpeedEntry from './expand/AddSpeedEntry.vue'
import ExpandSpeedItem from './expand/ExpandSpeedItem.vue'

export const styleName = 'extend-video-speed-style'

export const styleContent = `
/** 非激活状态且鼠标在其上方悬浮才显示移除按钮 */
${selectorMapping.speedMenuItem}:not(${selectorMapping.active}):hover .remove-btn {
  display: flex;
}
${selectorMapping.speedMenuItem} .remove-btn:hover {
  opacity: 1;
  transition: all .3s;
}
 
${selectorMapping.speedMenuList} {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 360px;
}
`

export interface ExpandSpeedMenuOptions {
  expandSpeedMenu: boolean,
  extendVideoSpeedList: number[]
}

export class ExpandSpeedMenuService extends BasicSpeedService implements ExpandSpeedMenuOptions {

  private readonly _nameBtn: HTMLButtonElement
  private readonly _menuListElementClickHandler: (ev: MouseEvent) => void

  constructor(context: SpeedContext) {
    super(context)

    this._nameBtn = context.containerElement.querySelector(
      selectorMapping.speedNameBtn,
    )

    this._menuListElementClickHandler = ev => {
      const option = ev.target as HTMLElement
      const value = parseFloat(option.dataset.value as string)

      if (isFinite(value)) {
        this.setVideoSpeed(value)
      }
    }
  }
  
  get expandSpeedMenu() {
    return false
  }
  extendVideoSpeedList: number[]

  async start() {
    const { menuListElement } = this.context

    await this.createExtraSpeedMenuItemElements()

    // 修复扩展倍速与原生倍速的兼容问题
    menuListElement.addEventListener('click', this._menuListElementClickHandler)
  }

  async stop() {
    const { menuListElement } = this.context

    menuListElement.removeEventListener(
      'click',
      this._menuListElementClickHandler,
    )

    this.expandElements.forEach(element => element.remove())

    removeStyle(styleName)
  }

  setVideoSpeed(speed: number) {
    // 只有前后倍速值都是原生倍数值，才使用模拟点击的方式更新视频倍数，否则使用 forceSetVideoSpeed 强制更新
    if (
      nativeRates.includes(speed)
      && nativeRates.includes(this.context.previousSpeed)
    ) {
      super.setVideoSpeed(speed)
    } else {
      this.forceSetVideoSpeed(speed)
    }
  }

  protected updateOrder() {
    const { menuListElement } = this.context

    // 为所有倍速菜单项设置 Order
    menuListElement
      .querySelectorAll(`${selectorMapping.speedMenuItem}[data-value]`)
      .forEach((it: HTMLLIElement) => {
        it.style.order = calcOrder(parseFloat(it.getAttribute('data-value')!))
      })
  }

  public static calcRecommendedValue(speedList: number[]) {
    const val = speedList.slice(-1)[0] + rateStepValue
    return val > maxRateValue ? null : val
  }

  updateExtendVideoSpeedList(value: any) {
    throw new Error('Method not implemented.')
  }

  protected async createExtraSpeedMenuItemElements() {
    const { options: { extendVideoSpeedList }, menuListElement } = this.context

    // 添加样式
    addStyle(styleContent, styleName)

    let addSpeedEntryElement: HTMLElement
    const extendSpeedItemElements: HTMLElement[] = []

    const update = (first = false) => {
      const addSpeedEntry = mountVueComponent(AddSpeedEntry.extend({
        propsData: {
          recommendedValue: ExpandSpeedMenuService.calcRecommendedValue(extendVideoSpeedList),
        },
      }), addSpeedEntryElement)

      addSpeedEntryElement = addSpeedEntry.$el as HTMLElement

      const extendSpeedItems = extendVideoSpeedList.map(value => mountVueComponent(ExpandSpeedItem.extend({
        propsData: {
          value
        }
      })))

      extendSpeedItemElements

      if (first) {
        menuListElement.prepend(addSpeedEntryElement)
      }
    }

    const items = extendVideoSpeedList.map(mountVueComponent(ExpandSpeedItem))

    return () => {

    }
  }

  /**
   * 强行设置视频倍数，此方法会更新倍速菜单以及倍速按钮文本
   *
   * @param value 要强行设置的倍速值
   */
  protected forceSetVideoSpeed(value: number) {
    const { menuListElement, videoElement, containerElement } = this.context

    // 更新菜单项激活样式
    menuListElement
      .querySelector(
        `${selectorMapping.speedMenuItem}${selectorMapping.active}`,
      )
      ?.classList.remove(classNameMapping.active)
    menuListElement
      .querySelector(`${selectorMapping.speedMenuItem}[data-value="${value}"]`)
      ?.classList.add(classNameMapping.active)

    // 重设倍数
    videoElement.playbackRate = value
    // 关闭菜单
    containerElement.classList.remove(classNameMapping.show)
    // 更新倍速按钮的文本
    this._nameBtn.innerText = formatSpeedText(value)
  }
}
