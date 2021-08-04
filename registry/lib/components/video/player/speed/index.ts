import { ComponentEntry, ComponentMetadata } from '@/components/types'
import { addComponentListener } from '@/core/settings'
import { registerAndGetData } from '@/plugins/data'
import {
  ObserveMode,
  RememberMode,
  SpeedComponentOptions,
  SpeedContext,
} from './context'
import {
  ExpandSpeedMenuService,
  getExpandSpeedMenuService,
  getRememberSpeedService,
  RememberSpeedService,
} from './services'

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

  const contexts = registerAndGetData<SpeedContext[]>('speed.contexts')

  let rememberSpeedService: RememberSpeedService
  let expandSpeedMenuService: ExpandSpeedMenuService

  videoChange(async () => {
    let context = contexts[0]

    context?.destroy()

    try {
      context = new SpeedContext(
        context ?? {
          options: (settings.options as unknown) as SpeedComponentOptions,
        },
      )
      contexts[0] = context
      await context.init()
    } catch (error) {
      logError(`【倍速组件】创建上下文失败：${error}`)
      return
    }

    addComponentListener(
      `${name}.rememberSpeed`,
      async value => {
        if (value) {
          await rememberSpeedService?.stop()
          rememberSpeedService = getRememberSpeedService(context)
          await rememberSpeedService.start()
        } else {
          await rememberSpeedService?.stop()
        }
      },
      true,
    )

    addComponentListener(
      `${name}.expandSpeedMenu`,
      async value => {
        if (value) {
          await expandSpeedMenuService?.stop()
          expandSpeedMenuService = getExpandSpeedMenuService(context)
          await expandSpeedMenuService.start()
        } else {
          await expandSpeedMenuService?.stop()
        }
      },
      true,
    )

    addComponentListener(`${name}.extendVideoSpeedList`, value => {
      expandSpeedMenuService.updateExtendVideoSpeedList(value)
    })
  })
}

export const component: ComponentMetadata = {
  entry,
  name: 'videoSpeed',
  displayName: '视频倍速',
  configurable: false,
  enabledByDefault: true,
  description: '扩展播放器的视频倍速功能',
  tags: [componentsTags.video],
  options: {
    expandSpeedMenu: {
      displayName: '扩展播放器的视频倍速菜单',
      defaultValue: true,
    },
    rememberSpeed: {
      displayName: '记忆播放器的视频倍速',
      dropdownEnum: RememberMode,
      defaultValue: RememberMode.none,
    },
    observeMode: {
      displayName: '监视模式',
      dropdownEnum: ObserveMode,
      defaultValue: ObserveMode.defineProperty,
    },
    rememberVideoSpeedList: {
      displayName: '记忆视频倍速列表',
      defaultValue: {},
      hidden: true,
    },
    extendVideoSpeedList: {
      displayName: '扩展视频倍速列表',
      defaultValue: [2.5, 3.0],
      hidden: true,
    },
    fallbackSpeed: {
      displayName: '后备倍速值',
      defaultValue: 1,
      hidden: true,
    },
  },
}
