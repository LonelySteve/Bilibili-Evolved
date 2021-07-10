import { SpeedContext } from "../context"
import { ExpandSpeedMenuService } from "./ExpandSpeedMenuService"
import { RememberSpeedService } from "./RememberSpeedService"

export * from "./ExpandSpeedMenuService"
export * from "./RememberSpeedService"

export const getExpandSpeedMenuService = _.memoize((context: SpeedContext) => {
  return new ExpandSpeedMenuService(context)
})

export const getRememberSpeedService = _.memoize((context: SpeedContext) => {
  return new RememberSpeedService(context)
})
