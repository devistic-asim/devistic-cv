export type PhraseGroup = {
  id: string
  label: string
  phrases: string[]
}

export const PHRASE_GROUPS: PhraseGroup[] = [
  {
    id: 'engineering',
    label: 'Software engineering',
    phrases: [
      'Shipped [feature] to [N] users and cut [metric] by [N%].',
      'Built [system] that reduced manual work from [N hours] to [N minutes] a week.',
      'Led migration of [system] with zero customer-facing downtime.',
      'Introduced tests and review habits that dropped production incidents by [N%].',
      'Partnered with design to launch [product], adopted by [N] teams.',
      'Simplified a [legacy flow], shortening the path from [N] steps to [N].',
    ],
  },
  {
    id: 'product',
    label: 'Product',
    phrases: [
      'Defined the roadmap for [area] and shipped [N] releases used by [audience].',
      'Ran discovery with [N] customers and turned the pattern into [feature].',
      'Prioritized a backlog that raised activation from [N%] to [N%].',
      'Wrote the spec and success metric for [launch], then tracked it weekly.',
      'Retired [low-value feature], freeing a team to focus on [outcome].',
    ],
  },
  {
    id: 'design',
    label: 'Design',
    phrases: [
      'Redesigned [flow] and raised task completion from [N%] to [N%].',
      'Built a component library adopted across [N] products.',
      'Set type, color, and spacing rules that cut design QA rounds in half.',
      'Tested [flow] with [N] people and removed the step where most of them stalled.',
      'Delivered [artifact] that sales used in [N] pitches the following quarter.',
    ],
  },
  {
    id: 'data',
    label: 'Data',
    phrases: [
      'Built a dashboard for [decision] that [N] leads now check every week.',
      'Replaced a manual report with a scheduled model, saving [N] hours a month.',
      'Found that [segment] drove [N%] of churn and helped the team act on it.',
      'Documented metric definitions so finance and product counted the same thing.',
      'Cleaned [dataset] and raised match quality from [N%] to [N%].',
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    phrases: [
      'Launched [campaign] that brought in [N] qualified leads at [cost].',
      'Rewrote [page] and lifted conversion from [N%] to [N%].',
      'Built a content series that earned [N] organic visits in [timeframe].',
      'Coordinated a launch across [channels] with a single brief and calendar.',
      'Cut spend on [channel] by [N%] without losing pipeline.',
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    phrases: [
      'Documented [process] so a new hire could run it without a shadow week.',
      'Reduced cycle time for [workflow] from [N days] to [N days].',
      'Negotiated [vendor/contract] and saved [amount] a year.',
      'Set a weekly review that closed [N] recurring blockers.',
      'Coordinated [N] people across [teams] for [event or rollout].',
    ],
  },
  {
    id: 'general',
    label: 'General',
    phrases: [
      'Owned [area] end to end, from the first draft to the result.',
      'Improved [process] and recorded the before-and-after so the gain stuck.',
      'Trained [N] teammates on [skill] and left written notes behind.',
      'Presented [work] to [audience] and left with a decision, not another meeting.',
      'Volunteered for [hard problem] and closed it in [timeframe].',
    ],
  },
]

export function phraseGroupForRole(role: string): string {
  const text = role.toLowerCase()
  if (/design|ux|ui|brand/.test(text)) return 'design'
  if (/product|pm\b/.test(text)) return 'product'
  if (/data|analy|scientist|ml\b|machine/.test(text)) return 'data'
  if (/market|content|growth|brand/.test(text)) return 'marketing'
  if (/operat|office|coordinator|success|support|recruit/.test(text)) return 'operations'
  if (/engineer|develop|software|frontend|backend|full/.test(text)) return 'engineering'
  return 'general'
}
