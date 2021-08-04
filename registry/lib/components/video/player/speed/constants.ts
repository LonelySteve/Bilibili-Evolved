/** 和倍数相关的选择器映射对象 */
export const selectorMapping = Object.freeze({
  speedMenuList: '.bilibili-player-video-btn-speed-menu',
  speedMenuItem: '.bilibili-player-video-btn-speed-menu-list',
  speedNameBtn: '.bilibili-player-video-btn-speed-name',
  speedContainer: '.bilibili-player-video-btn-speed',
  active: '.bilibili-player-active',
  show: '.bilibili-player-speed-show',
  video: '.bilibili-player-video video',
})

/** 和倍数相关的类名映射对象 */
export const classNameMapping = Object.freeze({
  speedMenuItem: 'bilibili-player-video-btn-speed-menu-list',
  active: 'bilibili-player-active',
  show: 'bilibili-player-speed-show',
})

/** 原生支持的速率值 */
export const nativeRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
/** 浏览器支持的最小速率值 */
export const minRateValue = 0.0625
/** 浏览器支持的最大速率值 */
export const maxRateValue = 16
/** 自定义倍数输入框的步进值 */
export const rateStepValue = 0.5

export const hooks = {
  /** 倍数改变 */
  ON_SPEED_CHANGE: 'speed.onSpeedChange',
  /** 视频改变 */
  ON_VIDEO_CHANGE: 'speed.onVideoChange',
}
