export interface SuggestionItem {
  id?: string
  label?: string
  value?: string
  display?: string
  title?: string
  name?: string
  email?: string
  description?: string
  full_name?: string
  user_image?: string
  [key: string]: any
}

export interface MentionSuggestionListProps {
  items: SuggestionItem[]
  command: (item: SuggestionItem) => void
}
