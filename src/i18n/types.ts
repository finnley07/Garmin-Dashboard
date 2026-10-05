export type Locale = 'de' | 'en'

export type MessageTree = {
  [key: string]: string | MessageTree
}
