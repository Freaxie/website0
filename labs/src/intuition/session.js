// What the visitor did on this page, kept in memory only, for the last two sections.
export const session = {
  opened: 0, // possibilities opened: branches, uses, options
  converged: 0, // patterns closed: answers found, commitments made
  incubating: null, // a remote-associates item set aside unsolved
}
export const opened = (n = 1) => (session.opened += n)
export const converged = (n = 1) => (session.converged += n)
