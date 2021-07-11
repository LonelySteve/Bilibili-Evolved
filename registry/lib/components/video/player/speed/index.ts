import { ComponentEntry, ComponentMetadata } from "@/components/types"
import { addComponentListener } from "@/core/settings"
import { ContextOptions, createContext, RememberStrategy } from "./context"
import {
  ExpandSpeedMenuService,
  getExpandSpeedMenuService,
  getRememberSpeedService,
  RememberSpeedService
} from "./services"

const entry: ComponentEntry = ({
  coreApis: {
    observer: { videoChange },
    utils: {
      log: { logError },
    },
  },
  settings,
  metadata: { name },
}) => {
  //
  if (!settings.enabled) {
    return
  }

  let environment

  let rememberSpeedService: RememberSpeedService
  let expandSpeedMenuService: ExpandSpeedMenuService

  videoChange(async () => {
    environment?.destroy()

    try {
      environment = await createContext((settings as unknown) as ContextOptions)
    } catch (error) {
      logError(`【倍数组件】创建上下文失败：${error}`)
      return
    }

    addComponentListener(
      `${name}.rememberSpeed`,
      (value) => {
        if (value) {
          rememberSpeedService?.stop()
          rememberSpeedService = getRememberSpeedService(environment)
          rememberSpeedService.start()
        } else {
          rememberSpeedService?.stop()
        }
      },
      true
    )

    addComponentListener(
      `${name}.expandSpeedMenu`,
      (value) => {
        if (value) {
          expandSpeedMenuService?.stop()
          expandSpeedMenuService = getExpandSpeedMenuService(environment)
          expandSpeedMenuService.start()
        } else {
          expandSpeedMenuService?.stop()
        }
      },
      true
    )
  })
}

export enum ObserveStrategy {
  /** 传统  */
  legacy = "传统",
  /** 属性覆盖 */
  defineProperty = "属性覆盖",
}

export const component: ComponentMetadata = {
  entry,
  name: "videoSpeed",
  displayName: "视频倍数",
  enabledByDefault: true,
  description: "扩展播放器的视频倍数功能",
  tags: [componentsTags.video],
  options: {
    expandSpeedMenu: {
      displayName: "扩展播放器的视频倍数菜单",
      defaultValue: true,
    },
    rememberSpeed: {
      displayName: "记忆播放器的视频倍数",
      dropdownEnum: RememberStrategy,
      defaultValue: RememberStrategy.none,
    },
    // TODO 通过 Object.defineProperty 实现更好的拦截策略，以兼容更多脚本或插件
    observeMode: {
      displayName: "监视模式",
      defaultValue: ObserveStrategy.defineProperty,
    },
    rememberVideoSpeedList: {
      displayName: "记忆视频倍数列表",
      defaultValue: {},
      hidden: true,
    },
    extendVideoSpeedList: {
      displayName: "扩展视频倍数列表",
      defaultValue: [],
      hidden: true,
    },
    fallbackSpeed: {
      displayName: "后备倍数值",
      defaultValue: 1,
      hidden: true,
    },
  },
}
