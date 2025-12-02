import { MaybeRefOrGetter, toValue, type Component } from 'vue'
import { Extension, Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import { PluginKey } from '@tiptap/pm/state'
import {
  createSuggestionExtension,
  BaseSuggestionItem,
} from '../suggestion/createSuggestionExtension'
import SuggestionList from '../suggestion/SuggestionList.vue'
import './style.css'

export interface MentionSuggestionItem extends BaseSuggestionItem {
  id: string
  label: string
  value?: string
  email?: string
  full_name?: string
  user_image?: string
}

function createMentionNode(component?: Component) {
  const config: any = {
    name: 'mention',
    group: 'inline',
    inline: true,
    selectable: true,
    atom: true,

    addOptions() {
      return {
        component: undefined,
      }
    },

    addAttributes() {
      return {
        id: {
          default: null,
          parseHTML: (element: HTMLElement) => element.getAttribute('data-id'),
          renderHTML: (attributes: any) => {
            if (!attributes.id) {
              return {}
            }
            return { 'data-id': attributes.id }
          },
        },
        label: {
          default: null,
          parseHTML: (element: HTMLElement) =>
            element.getAttribute('data-label'),
          renderHTML: (attributes: any) => {
            if (!attributes.label) {
              return {}
            }
            return { 'data-label': attributes.label }
          },
        },
      }
    },

    parseHTML() {
      return [
        {
          tag: 'span.mention[data-type="mention"]',
          getAttrs: (dom: any) => {
            const element = dom as HTMLElement
            return {
              id: element.getAttribute('data-id'),
              label: element.getAttribute('data-label'),
            }
          },
        },
      ]
    },

    renderHTML({ HTMLAttributes }: any) {
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          class: 'mention',
          'data-type': 'mention',
        }),
        `@${HTMLAttributes['data-label'] || HTMLAttributes.id || ''}`,
      ]
    },
  }

  if (component) {
    config.addNodeView = () => {
      return VueNodeViewRenderer(component)
    }
  }

  return Node.create(config)
}

const MentionSuggestionExtension =
  createSuggestionExtension<MentionSuggestionItem>({
    name: 'mentionSuggestion',
    char: '@',
    pluginKey: new PluginKey('mentionSuggestion'),
    component: SuggestionList,

    addOptions() {
      return {
        mentions: [],
        searchFunction: null,
        suggestionComponent: null,
      }
    },

    items: async ({ query, editor }) => {
      const extension = editor.extensionManager.extensions.find(
        (ext) => ext.name === 'mentionSuggestion',
      )!
      const { mentions: _mentions, searchFunction } = extension.options

      // If searchFunction is provided, use it for live search
      if (searchFunction && typeof searchFunction === 'function') {
        try {
          const results = await searchFunction(query)
          return results
            .slice(0, 10)
            .map((mention: MentionSuggestionItem) => ({
              ...mention,
              display: mention.label,
            }))
        } catch (error) {
          console.error('Mention search error:', error)
          return []
        }
      }

      // Otherwise, fall back to static array filtering
      const mentions = toValue(_mentions)
      const filtered = mentions
        .filter((mention: MentionSuggestionItem) =>
          mention.label.toLowerCase().startsWith(query.toLowerCase()),
        )
        .slice(0, 10)
        .map((mention: MentionSuggestionItem) => ({
          ...mention,
          display: mention.label,
        }))

      return filtered
    },

    command: ({ editor, range, props }) => {
      const attributes = {
        id: props.id || props.value,
        label: props.label,
      }

      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: 'mention',
            attrs: attributes,
          },
          {
            type: 'text',
            text: ' ',
          },
        ])
        .run()
    },

    tippyOptions: {
      placement: 'bottom-start',
      offset: [0, 8],
    },
    allowSpaces: false,
    decorationTag: 'span',
    decorationClass: 'mention-suggestion-active',
  })

export const MentionExtension = Extension.create<{
  mentions: MaybeRefOrGetter<MentionSuggestionItem[]>
  component?: Component
  searchFunction?: (query: string) => Promise<MentionSuggestionItem[]> | MentionSuggestionItem[]
  suggestionComponent?: Component
}>({
  name: 'mentionExtension',

  addOptions() {
    return {
      mentions: [],
      component: undefined,
      searchFunction: undefined,
      suggestionComponent: undefined,
    }
  },

  addExtensions() {
    const suggestionConfig: any = {
      mentions: this.options.mentions,
      searchFunction: this.options.searchFunction,
    }

    if (this.options.suggestionComponent) {
      suggestionConfig.component = this.options.suggestionComponent
    }

    return [
      createMentionNode(this.options.component),
      MentionSuggestionExtension.configure(suggestionConfig),
    ]
  },
})
