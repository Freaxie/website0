// What the visitor did on this page, kept in memory only, for the last two sections.
export const session = {
  ti: 0, // reasons checked: mechanisms explained, rules tested against a possible "no"
  te: 0, // results measured: changes that moved an output, targets reached
  zipper: null, // { before, after } ratings of understanding
  rule: null, // the rule announced in the 2-4-6 task: { t, right, consistent, counter }
}
export const reasoned = (n = 1) => (session.ti += n)
export const measured = (n = 1) => (session.te += n)
