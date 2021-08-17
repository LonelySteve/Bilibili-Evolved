import { SpeedContext } from '../context'
import { ExpandSpeedMenuService } from './ExpandSpeedMenuService'
import { RememberSpeedService } from './RememberSpeedService'

export * from './ExpandSpeedMenuService'
export * from './RememberSpeedService'
export * from "./BasicSpeedService"

export const getExpandSpeedMenuService = _.memoize((context: SpeedContext) => new ExpandSpeedMenuService(context))

export const getRememberSpeedService = _.memoize((context: SpeedContext) => new RememberSpeedService(context))
