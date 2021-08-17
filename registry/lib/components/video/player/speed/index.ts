import { ComponentEntry, ComponentMetadata } from '@/components/types'
import { addComponentListener } from '@/core/settings'
import { registerAndGetData } from '@/plugins/data'
import {
  createContext,
  ObserveMode,
  RememberMode,
  SpeedComponentOptions,
  SpeedContext
} from './context'
import {
  BasicSpeedService, ExpandSpeedMenuService, RememberSpeedService
} from './services'

const services: Record<string, BasicSpeedService> = {}

const serviceListeners = [
  {
    service: RememberSpeedService,
    listeners: {
      rememberSpeed: function (this: RememberSpeedService, value: RememberMode) {

      },
      rememberVideoSpeedList: function (this: RememberSpeedService, value: Record<string, (number | string)[]>) {
        
      },
      fallbackSpeed: function (this: RememberSpeedService, value: number) {
        
      }
    }
  },
  {
    service: ExpandSpeedMenuService,
    listeners: {
      expandSpeedMenu: function (this: ExpandSpeedMenuService, value: boolean) {
        
      },
      extendVideoSpeedList: function (this: ExpandSpeedMenuService, value: number[]) {
        
      },
    }
  }
]

const getService = (serviceName: string, fallbackServiceCreator: () => BasicSpeedService) => {
  return serviceName in services ? services[serviceName]: fallbackServiceCreator()
}
 

const initServices = (componentName: string, context: SpeedContext) => {
  for (const [key, {service: Service, listeners}] of Object.entries(serviceListeners)) {
    const service = getService(Service.name, () => new Service(context))
    for (const [option, listener] of Object.entries(listeners)) {
      addComponentListener(`${componentName}.${option}`, (value: unknown) => {
        listener.call(service, value)
      })
    }
    services[key] = service
  }
}

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

  videoChange(async () => {
    let context = contexts[0]

    context?.destroy()

    try {
      context = createContext(context ?? {
        options: (settings.options as unknown) as SpeedComponentOptions,
      })
      contexts[0] = context
      await context.init()
    } catch (error) {
      logError(`【倍速组件】创建上下文失败：${error}`)
      return
    }

    initServices(name, context)

 
    reload()
  })
}

const reload = () => {
  services.forEach(service => service.start())
}

const unload = () => {
  services.forEach(service => service.stop())
}

export const component: ComponentMetadata<SpeedComponentOptions> = {
  entry,
  reload,
  unload,
  author: {
    name: "JLoeve",
    link: "https://github.com/LonelySteve"
  },
  name: 'videoSpeed',
  displayName: '视频倍速',
  configurable: false,
  enabledByDefault: true,
  description: '扩展播放器的视频倍速功能',
  tags: [componentsTags.video],
  options: {
    observeMode: {
      displayName: '监视模式',
      dropdownEnum: ObserveMode,
      defaultValue: ObserveMode.defineProperty,
    },
    expandSpeedMenu: {
      displayName: '扩展播放器的视频倍速菜单',
      defaultValue: true,
    },
    extendVideoSpeedList: {
      displayName: '扩展视频倍速列表',
      defaultValue: [2.5, 3.0],
      hidden: true,
    },
    rememberSpeed: {
      displayName: '记忆播放器的视频倍速',
      dropdownEnum: RememberMode,
      defaultValue: RememberMode.none,
    },
    rememberVideoSpeedList: {
      displayName: '记忆视频倍速列表',
      defaultValue: {},
      hidden: true,
    },
    fallbackSpeed: {
      displayName: '后备倍速值',
      defaultValue: 1,
      hidden: true,
    },
  },
}
