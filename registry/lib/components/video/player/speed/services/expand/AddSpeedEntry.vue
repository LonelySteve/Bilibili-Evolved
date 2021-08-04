<template>
  <li
    :class="classes"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <input
      v-if="showInput"
      ref="input"
      v-model="newValue"
      type="number"
      :min="dynamicMinRateValue"
      :max="maxRateValue"
      :step="rateStepValue"
      title="增加新的倍数值"
      @keydown.enter="handleInputKeyDown"
    />
    <VIcon v-else icon="mdi-playlist-plus" />
  </li>
</template>

<script lang="ts">
import { VIcon } from '@/ui'
import { logError } from '@/core/utils/log'
import {
  classNameMapping,
  maxRateValue,
  minRateValue,
  rateStepValue,
} from '../../constants'

export default Vue.extend({
  components: { VIcon },
  props: {
    recommendedValue: {
      type: Number,
      default: null,
    },
  },
  data() {
    return {
      maxRateValue,
      rateStepValue,
      showInput: false,
      classes: [classNameMapping.speedMenuItem, 'add-speed-entry'],
    }
  },
  computed: {
    dynamicMinRateValue() {
      return this.recommendedValue ?? minRateValue
    },
    newValue() {
      return this.recommendedValue ?? ''
    },
  },
  watch: {
    showInput(value) {
      if (value) {
        this.$nextTick(() => {
          console.log('this.$refs', this.$refs)
          setTimeout(() => this.$refs.input.focus())
        })
      }
    },
  },
  methods: {
    handleInputKeyDown(ev: KeyboardEvent) {
      if (ev.key !== 'Enter') {
        return
      }

      const value = parseFloat(this.newValue)

      if (!isFinite(value)) {
        logError('无效的倍速值')
        return
      }
      if (value < minRateValue) {
        logError('倍速值太小了')
        return
      }
      if (value > maxRateValue) {
        logError('倍速值太大了')
        return
      }
      if (this.availableRates.includes(value)) {
        logError('不能重复添加已有的倍速值')
        return
      }

      this.$emit('add', value)
    },
    handleMouseEnter() {
      this.showInput = true
    },
    handleMouseLeave() {
      this.showInput = false
    },
  },
})
</script>

<style lang="scss" scoped>
li {
  .be-icon {
    width: 100%;
    height: 100%;
  }

  input {
    font-size: inherit;
    color: inherit;
    line-height: inherit;
    background: transparent;
    outline: none;
    width: 100%;
    border: none;
    text-align: center;

    /* https://stackoverflow.com/a/4298216 */
    /* Chrome */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    /* Firefox */
    &[type="number"] {
      -moz-appearance: textfield;
    }
  }
}
</style>
