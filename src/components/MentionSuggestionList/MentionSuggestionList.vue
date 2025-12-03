<template>
  <div
    v-if="items.length"
    ref="container"
    class="relative max-h-[300px] min-w-[280px] overflow-y-auto rounded-lg bg-surface-white p-1.5 text-base shadow-lg border border-outline-gray-2"
  >
    <button
      v-for="(item, index) in items"
      :key="index"
      :ref="
        (el) => {
          if (el) itemRefs[index] = el as HTMLButtonElement
        }
      "
      :class="[
        'flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2 py-2 text-sm text-ink-gray-9 transition-colors',
        index === selectedIndex ? 'bg-surface-gray-2' : 'hover:bg-surface-gray-1',
      ]"
      @click="selectItem(index)"
      @mouseover="selectedIndex = index"
    >
      <slot name="item-prefix" :item="item" :index="index">
        <!-- Default slot for avatar or icon -->
      </slot>
      <div class="flex flex-col items-start flex-1 min-w-0">
        <span class="font-medium text-ink-gray-8 truncate w-full">
          {{ item.label || item.display || item.title || item.name }}
        </span>
        <span v-if="item.description || item.email" class="text-xs text-ink-gray-5 truncate w-full">
          {{ item.description || item.email }}
        </span>
      </div>
      <slot name="item-suffix" :item="item" :index="index">
        <!-- Optional slot for additional content -->
      </slot>
    </button>
    <div
      v-if="!items.length"
      class="px-3 py-2 text-sm text-ink-gray-5"
    >
      No results
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUpdate } from 'vue'
import type { MentionSuggestionListProps } from './types'

const props = defineProps<MentionSuggestionListProps>()

const selectedIndex = ref(0)
const container = ref<HTMLElement>()
const itemRefs = ref<HTMLButtonElement[]>([])

onBeforeUpdate(() => {
  itemRefs.value = []
})

watch(
  () => props.items,
  () => {
    selectedIndex.value = 0
  },
)

watch(selectedIndex, async () => {
  await nextTick()
  const item = itemRefs.value[selectedIndex.value]
  if (item && container.value) {
    const containerRect = container.value.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()

    if (itemRect.top < containerRect.top) {
      item.scrollIntoView({ block: 'nearest' })
    } else if (itemRect.bottom > containerRect.bottom) {
      item.scrollIntoView({ block: 'nearest' })
    }
  }
})

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp') {
    upHandler()
    return true
  }

  if (event.key === 'ArrowDown') {
    downHandler()
    return true
  }

  if (event.key === 'Enter') {
    enterHandler()
    return true
  }

  return false
}

function upHandler() {
  selectedIndex.value =
    (selectedIndex.value + props.items.length - 1) % props.items.length
}

function downHandler() {
  selectedIndex.value = (selectedIndex.value + 1) % props.items.length
}

function enterHandler() {
  selectItem(selectedIndex.value)
}

function selectItem(index: number) {
  const item = props.items[index]

  if (item) {
    props.command(item)
  }
}

defineExpose({
  onKeyDown,
})
</script>
