
import { BasicSpeedService } from './BasicSpeedService'

/**
 * 记忆模式
 */
export enum RememberMode {
  /** 停用 */
  none = '停用',
  /** 按视频级别 */
  video = '按视频级别',
  /** 按最近一次 */
  recent = '按最近一次',
}


export interface RememberSpeedOptions {
  rememberSpeed: RememberMode
  rememberVideoSpeedList: Record<number, (string | number)[]>
  fallbackSpeed: number
}

export class RememberSpeedService extends BasicSpeedService implements RememberSpeedOptions {
  async start() {
    // throw new Error("Method not implemented.")
  }

  async stop() {
    // throw new Error("Method not implemented.")
  }
}
