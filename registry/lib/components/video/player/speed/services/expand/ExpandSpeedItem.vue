<template>
  <li :class="classes" :data-value="value" :style="{ order }">
    {{ value | formatSpeedText }}
    <VIcon
      class="remove-btn"
      icon="mdi-close-circle"
      size="16"
      @click="$emit('remove', value)"
    ></VIcon>
  </li>
</template>

<script lang="ts">
import { VIcon } from '@/ui'
import { classNameMapping } from '../../constants'
import { formatSpeedText } from '../../helpers'

export default Vue.extend({
  components: { VIcon },
  filters: { formatSpeedText },
  props: {
    value: {
      required: true,
      type: Number,
    },
  },
  data() {
    return {
      classes: [classNameMapping.speedMenuItem, 'extended'],
    }
  },
})
</script>

<style lang="scss" scoped>
li {
  .remove-btn {
    color: inherit;
    opacity: 0.5;
    display: none;
    position: absolute;
    top: 10px;
    right: 3px;
  }
}
</style>
