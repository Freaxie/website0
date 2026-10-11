/**
 * The public seed: what a fresh browser starts with. It is compiled into the site, so it is visible to
 * anyone who opens the deployed URL. It must contain nothing sensitive: no health, family, finances,
 * psychological self-observations, body measurements or social history. Those live in a private import
 * file that is never committed (see docs/PRIVACY.md). A unit test enforces the obvious parts of this.
 *
 * Everything here is imported history (origin "seed"), editable and deletable. Nothing here claims
 * progress, reading, results or achievements that the handoff did not state.
 */
import { makeRecord, type RecordInit } from '../domain/factory'
import type { AnyRecord, Check, Domain, InterestStatus, Kind, Link, LinkType } from '../domain/types'

export const SEED_TIME = '2026-10-11T00:00:00.000Z'

type Data<K extends Kind> = RecordInit<K>['data']

export function publicSeed(): { records: AnyRecord[]; links: Link[] } {
  const records: AnyRecord[] = []
  const links: Link[] = []

  const add = <K extends Kind>(kind: K, id: string, title: string, init: RecordInit<K> = {}) => {
    records.push(
      makeRecord(kind, {
        id,
        title,
        origin: 'seed',
        createdAt: SEED_TIME,
        updatedAt: SEED_TIME,
        private: false,
        ...init,
      }) as AnyRecord,
    )
    return id
  }
  const link = (from: string, type: LinkType, to: string, note = '') =>
    links.push({ id: `ln_${from}_${type}_${to}`, from, to, type, note, createdAt: SEED_TIME })

  let n = 0
  const checks = (items: (string | [string, string])[]): Check[] =>
    items.map((it) =>
      typeof it === 'string'
        ? { id: `ck_${++n}`, title: it, done: false, evidence: '' }
        : { id: `ck_${++n}`, title: it[0], done: true, evidence: it[1] },
    )

  const topic = (
    id: string,
    title: string,
    domain: Domain,
    status: InterestStatus,
    body: string,
    data: Data<'topic'> = {},
  ) => add('topic', id, title, { body, certainty: null, data: { domain, status, ...data } })

  // ---------------------------------------------------------------- pages

  add('page', 'pg_now', 'Current priorities', {
    pinned: true,
    certainty: 'hypothesis',
    currency: 'unverified',
    asOf: '2026-10',
    body: `> **Proposed during setup, not yet confirmed.** Edit this into your real priorities or replace it entirely. The Observatory shows the first paragraph below as your current focus.

Use this atlas for two weeks as the single place for captures, next actions and learning, then review what was actually used.

1. **Make the atlas a habit.** Capture daily; process the inbox weekly; run one weekly review. See [[This atlas]].
2. **One programming thread.** Work through [[Python foundations]] until there is a small tool you actually use.
3. **One hardware thread.** Do the first steps of [[Electronics, hands-on]] with the Uno R3.

Everything else in the [atlas](/atlas) stays *curious* or *exploring* until one of these finishes or is deliberately paused.`,
  })

  add('page', 'pg_profile', 'Profile', {
    pinned: true,
    certainty: 'report',
    currency: 'current',
    asOf: '2026-10',
    body: `**Krish** — Lucknow, Uttar Pradesh, India · Asia/Kolkata.

- **Education:** Bachelor's degree in Electronic Engineering.
- **Personality model I identify with:** INTP. A useful lens, not a scientific verdict; see [[Personality models]].
- **What I value:** intellectual honesty; direct, critical feedback over reassurance; things that both work well and look right; low-key competence over self-promotion.
- **Orientation:** a polymath who builds, not one who collects trivia. Deep technical competence in a few things, broad understanding of many, and the habit of finishing.

Private details (dates, circumstances, health) are not part of this public page. They belong in the private records you import yourself; see Settings → Privacy.`,
  })

  add('page', 'pg_direction', 'Life direction', {
    certainty: 'aspiration',
    body: `**Explore broadly. Organize rigorously. Execute selectively. Preserve curiosity. Build a coherent life through accumulated action.**

The questions this atlas exists to answer:

- Who am I, in terms of observable facts, preferences, values and patterns?
- What do I actually want, rather than merely find aesthetically appealing?
- What am I currently trying to become, and which interests deserve serious investment?
- What am I learning, how does it connect, and what am I building?
- What am I avoiding, and what progress have I actually made?
- How can I pursue breadth without becoming permanently scattered?
- How can I turn abstract ambitions into concrete, finished work?

The site does not decide an identity. It is a place to investigate one and to build it through action. See [[Operating principles]] and the [[The central identity question|central identity question]].`,
  })

  add('page', 'pg_principles', 'Operating principles', {
    certainty: 'aspiration',
    body: `1. **Fascination is not commitment.** Every interest has a status: curious, exploring, studying, practicing, building, maintaining or archived. Moving between them is cheap.
2. **Limit active commitments.** A long backlog is fine; a short active list is the point. The limits live in Settings and only warn.
3. **Turn vague goals into observable actions.** "Learn AI" is not a task. "Implement a small neural network and explain the forward pass" is.
4. **Reduce activation energy.** Capture first, organise later. No planning ceremony before starting.
5. **Measure output, not fantasy.** Wanted → planned → started → completed → can demonstrate → can explain.
6. **Preserve optionality without pretending time is unlimited.** Decide what to pursue now, defer, or abandon.
7. **Honest self-criticism.** Notice repeated planning without execution. No flattery without evidence, and no inferring inability from a lack of past accomplishment.`,
  })

  // ---------------------------------------------------------------- topics

  topic('tp_ai', 'Artificial intelligence', 'ai', 'exploring', `AI research, the labs doing it, and the path from current systems toward AGI.`, {
    questions: ['What is actually missing between current systems and general intelligence?', 'How do research labs choose what to work on?'],
  })
  topic('tp_ml', 'Machine learning & neural networks', 'ai', 'curious', `How models learn from data: neural networks, deep learning, training and generalisation.`, {
    nextAction: 'Implement a two-layer network in NumPy and write a paragraph explaining the forward pass.',
  })
  topic('tp_llm', 'Large language models', 'ai', 'exploring', `How transformers turn text into next-token predictions, and why that produces useful behaviour.`, {
    questions: ['What does a transformer compute, step by step, for one token?', 'What do LLMs represent internally?'],
  })
  topic('tp_agents', 'Agents, harnesses & MCP', 'ai', 'exploring', `AI agents, the harnesses around them, tools and skills, and the Model Context Protocol. Directly useful: this site was built with an agent harness.`, {
    questions: ['What makes an agent reliable over long tasks?'],
  })
  topic('tp_alignment', 'AI alignment & safety', 'ai', 'curious', `Making capable systems do what we intend, and knowing when they do.`)
  topic('tp_python', 'Programming & Python', 'ai', 'exploring', `Programming fundamentals through Python, plus the terminal and Git as everyday tools.`, {
    nextAction: 'Write a small script that does a real chore, and commit it to GitHub.',
  })
  topic('tp_web', 'Web development', 'ai', 'exploring', `Building and deploying sites and apps. Already done once: Two Worlds was built with Vite and deployed through Git and Vercel.`)
  topic('tp_algorithms', 'Algorithms & data structures', 'ai', 'curious', `The vocabulary of efficient computation.`)
  topic('tp_math', 'Mathematics', 'math', 'curious', `Mathematical reasoning and beauty, elegant solutions, and the role of mathematics in physics.`, {
    why: 'The relationship between mathematical structures and reality.',
    questions: ['Why is mathematics so effective at describing nature?', 'What is the difference between a mathematical model and the physical thing being modelled?'],
  })
  topic('tp_linalg', 'Linear algebra', 'math', 'curious', `Vectors, matrices and linear maps: the working language of machine learning and much of physics.`)
  topic('tp_matmul', 'Matrix multiplication', 'math', 'curious', `Composition of linear maps; the operation most of a neural network's compute is spent on.`)
  topic('tp_foundations', 'Foundations & formalization (Lean)', 'math', 'curious', `Foundations of mathematics, formal proof, and theorem proving in Lean.`, {
    questions: ['What does it take to formalise a simple proof in Lean?'],
  })
  topic('tp_numerics', 'Numerical computation', 'math', 'curious', `How computers actually do arithmetic: floating-point error, stability, and when results can be trusted.`)
  topic('tp_electronics', 'Electronics', 'electronics', 'exploring', `Reconnecting with the Electronic Engineering background through hobby circuits and practical devices.`)
  topic('tp_embedded', 'Embedded systems (Arduino, ESP32)', 'electronics', 'curious', `Microcontrollers, sensors and actuators: where software meets physical systems.`)
  topic('tp_robotics', 'Robotics & drones', 'electronics', 'curious', `Robots and drones as the meeting point of mechanics, electronics and software.`)
  topic('tp_rf', 'Signals & RF', 'electronics', 'curious', `Signals, radio frequency, and hardware hacking.`)
  topic('tp_physics', 'Physics & cosmology', 'physics', 'curious', `Fundamental laws, planets, astronomy, cosmology, and the structure of reality.`)
  topic('tp_statmech', 'Statistical mechanics & thermodynamics', 'physics', 'curious', `How the behaviour of enormous numbers of microstates produces macroscopic properties.`, {
    questions: ['How exactly do microstates give rise to macroscopic properties like temperature?'],
  })
  topic('tp_emergence', 'Emergence', 'physics', 'curious', `Higher-level patterns that arise from lower-level rules: in physics, in life, and possibly in minds.`)
  topic('tp_psychology', 'Psychology & individual differences', 'human', 'exploring', `Personality, intelligence, motivation, habits, socialisation and identity formation.`)
  topic('tp_execfn', 'Executive function & task initiation', 'human', 'exploring', `The cognitive control processes behind planning, starting and finishing, and what the research says about improving them.`)
  topic('tp_personality', 'Personality models', 'human', 'exploring', `MBTI and the cognitive functions, Big Five, Enneagram, attachment theory, Jungian typology. Interesting models with very different levels of evidence; treat none as a definitive description of a person.

The [Cognitive Functions exhibition](/functions/) in this site is one of the things built from this interest.`, {
    questions: ['Which personality constructs survive rigorous measurement, and which are mainly useful stories?'],
  })
  topic('tp_mind', 'Mind, consciousness & cognitive science', 'human', 'curious', `Neuroscience, cognitive science and philosophy of mind: how brains produce minds, and what consciousness is.`)
  topic('tp_evolution', 'Evolution, anthropology & human origins', 'human', 'curious', `Genetics, evolution, evolutionary psychology, anthropology and archaeology of human origins.`)
  topic('tp_philsci', 'Philosophy of science & models', 'philosophy', 'curious', `Epistemology and philosophy of science: what a scientific model is, what makes an argument good, and how to tell truth from an appealing narrative.`)
  topic('tp_self', 'The self, meaning & free will', 'philosophy', 'curious', `Existentialism, Nietzsche, Jung, Vedanta, Buddhism; free will, meaning, and what makes a life worth pursuing.`)
  topic('tp_history', 'History of science & civilizations', 'history', 'curious', `Ancient and medieval history, archaeology, Zoroastrianism and ancient Iran, Slavic history, Soviet science and mathematics, and how scientific ideas developed across civilizations.`)
  topic('tp_military', 'Military history & aviation', 'history', 'curious', `Warfare, jets and drones.`)
  topic('tp_economics', 'Economics & political economy', 'other', 'curious', `How economies work, and the politics around them.`)
  topic('tp_design', 'Design & aesthetics', 'other', 'exploring', `Design taste, the psychology of aesthetics, architecture and interiors, and interfaces with character.`)

  // relationships between topics: only ones that hold conceptually
  link('tp_ml', 'part_of', 'tp_ai')
  link('tp_llm', 'part_of', 'tp_ai')
  link('tp_agents', 'part_of', 'tp_ai')
  link('tp_alignment', 'part_of', 'tp_ai')
  link('tp_llm', 'depends_on', 'tp_ml')
  link('tp_agents', 'depends_on', 'tp_llm')
  link('tp_ml', 'depends_on', 'tp_linalg')
  link('tp_linalg', 'part_of', 'tp_math')
  link('tp_matmul', 'part_of', 'tp_linalg')
  link('tp_foundations', 'part_of', 'tp_math')
  link('tp_numerics', 'part_of', 'tp_math')
  link('tp_python', 'used_in', 'tp_ml')
  link('tp_algorithms', 'related', 'tp_python')
  link('tp_numerics', 'applies_to', 'tp_ml', 'floating-point error in training')
  link('tp_embedded', 'part_of', 'tp_electronics')
  link('tp_embedded', 'depends_on', 'tp_electronics')
  link('tp_robotics', 'depends_on', 'tp_embedded')
  link('tp_rf', 'part_of', 'tp_electronics')
  link('tp_statmech', 'part_of', 'tp_physics')
  link('tp_emergence', 'related', 'tp_statmech', 'microstates → macroscopic properties')
  link('tp_emergence', 'related', 'tp_mind')
  link('tp_emergence', 'related', 'tp_philsci')
  link('tp_philsci', 'related', 'tp_foundations', 'scientific models → formalization')
  link('tp_math', 'applies_to', 'tp_physics')
  link('tp_execfn', 'part_of', 'tp_psychology')
  link('tp_personality', 'part_of', 'tp_psychology')
  link('tp_mind', 'related', 'tp_psychology')
  link('tp_evolution', 'related', 'tp_psychology', 'evolutionary psychology')
  link('tp_self', 'related', 'tp_mind')
  link('tp_self', 'related', 'tp_personality', 'Jung')
  link('tp_alignment', 'related', 'tp_mind', 'cognition and intelligence')
  link('tp_history', 'related', 'tp_math', 'history of mathematics')
  link('tp_history', 'related', 'tp_evolution', 'archaeology')
  link('tp_military', 'related', 'tp_robotics', 'drones')
  link('tp_web', 'related', 'tp_design')

  // ---------------------------------------------------------------- people

  add('person', 'pe_nietzsche', 'Friedrich Nietzsche', { data: { role: 'Philosopher', era: '1844–1900' } })
  add('person', 'pe_jung', 'Carl Jung', { data: { role: 'Psychiatrist; analytical psychology, psychological types', era: '1875–1961' } })
  link('pe_nietzsche', 'part_of', 'tp_self')
  link('pe_jung', 'part_of', 'tp_self')
  link('pe_jung', 'inspired_by', 'tp_personality', 'psychological types → MBTI')

  // ---------------------------------------------------------------- notes

  add('note', 'nt_howto', 'How this atlas works', {
    pinned: true,
    body: `**Every record is editable.** Records marked *Imported* came from the setup handoff; everything else is what you add.

**Two labels keep history honest.**
- *Certainty*: fact, report, inference, suspicion, hypothesis or aspiration.
- *Currency*: current, historical, or unverified. Historical records describe the past, not the present.

**Connections.** Type \`[[\` in any text to link a record by title; the link appears in the graph and as a backlink. Use *Add connection* for typed relationships (depends on, part of, contradicts…).

**Capture fast.** Press \`c\` anywhere (configurable), or the + button. Captures land in the inbox; file them later.

**Keyboard.** \`Ctrl/⌘ K\` search and commands · \`Alt N\` new note · \`/\` search · \`g\` then a letter to jump · \`?\` all shortcuts.

**Privacy.** Data lives only in this browser's IndexedDB. Private records can be hidden from view (Settings), but that is a privacy screen, not security. Export regularly: it is the only backup.`,
  })
  add('note', 'nt_breadth', 'Breadth and depth', {
    certainty: 'aspiration',
    body: `The risk is not a shortage of interesting things. It is having too many directions and not turning them into sustained effort.

A working rule: **curiosity is free, commitment is scarce.** Any subject can sit at *curious* or *exploring* indefinitely at no cost. Only a few get *studying*, *practicing* or *building*, and each of those needs a concrete next action.

See [[Operating principles]], [[Fascination versus commitment]].`,
  })
  add('note', 'nt_fascination', 'Fascination versus commitment', {
    certainty: 'hypothesis',
    body: `A test for whether an interest deserves investment: **does it survive real practice?** Watching or reading about something and imagining being good at it is fascination. Committing means doing the boring middle part.

Questions to ask of any interest:
- Have I done the activity, or only consumed content about it?
- Would I keep doing it if nobody ever saw the result?
- What is the smallest finished thing I could make with it in a week?

Related: [[The central identity question]], [[Executive function & task initiation]].`,
  })
  add('note', 'nt_models', 'A model is not the thing modelled', {
    body: `Starter note: an open thread, not a conclusion.

A mathematical model is a structure whose behaviour matches some aspects of a physical system. The match is partial and has a domain of validity. [[Statistical mechanics & thermodynamics]] is the cleanest example: temperature is a property of the statistical description, not of any single molecule.

Open questions:
- Is the "unreasonable effectiveness" of mathematics a fact about the world, about us, or about which problems we choose? See [[Mathematics]].
- What would a fully [[Foundations & formalization (Lean)|formalised]] physical theory gain or lose?

Related: [[Philosophy of science & models]], [[Emergence]].`,
  })
  add('note', 'nt_emergence', 'Microstates and macrostates', {
    body: `Starter note: an open thread, not a conclusion.

Many microstates map to one macrostate; entropy counts how many. That one idea links [[Statistical mechanics & thermodynamics]] to [[Emergence]], and possibly to questions in [[Mind, consciousness & cognitive science]] about levels of description.

To work out: derive the ideal gas law from counting states.`,
  })

  // ---------------------------------------------------------------- identity lab: questions and archetypes

  add('question', 'qu_identity', 'The central identity question', {
    certainty: null,
    body: `Wanting to become many different things at once, and imagining a different idealised self depending on the activity: what does this pattern actually mean? It might be ordinary exploration, attraction to identities rather than practices, or the absence of one sustained commitment to test against. The Identity Lab exists to investigate it without deciding the answer in advance.`,
    data: { status: 'open' },
  })
  add('question', 'qu_want', 'What do I actually want, rather than find aesthetically appealing?', { data: { status: 'open' } })
  add('question', 'qu_invest', 'Which interests deserve serious investment?', { data: { status: 'open' } })
  add('question', 'qu_breadth', 'How can I pursue breadth without becoming permanently scattered?', { data: { status: 'open' } })
  add('question', 'qu_finish', 'How do I turn abstract ambitions into concrete, finished work?', { data: { status: 'open' } })
  add('question', 'qu_mathreal', 'What is the relationship between mathematical structures and physical reality?', { data: { status: 'open' } })
  link('qu_mathreal', 'part_of', 'tp_math')
  link('qu_mathreal', 'part_of', 'tp_philsci')
  link('qu_breadth', 'related', 'nt_breadth')
  link('qu_invest', 'related', 'nt_fascination')

  const P = (facet: 'ability' | 'value' | 'aesthetic' | 'behavior', text: string) => ({
    id: `pt_${++n}`,
    facet,
    text,
    verdict: 'undecided' as const,
  })
  const archetype = (id: string, title: string, represents: string, parts: ReturnType<typeof P>[]) =>
    add('archetype', id, title, { certainty: 'hypothesis', data: { represents, parts, evidence: [] } })

  archetype('ar_researcher', 'The researcher', 'Understanding something deeply and adding to what is known.', [
    P('ability', 'Read a paper and reproduce its main result'),
    P('ability', 'Formulate a question precisely enough to answer it'),
    P('value', 'Truth over appealing narratives'),
    P('aesthetic', 'Notebooks, whiteboards, dense references'),
    P('behavior', 'Long stretches of deep work on one question'),
  ])
  archetype('ar_maker', 'The engineer-maker', 'Turning ideas into working physical and software systems.', [
    P('ability', 'Design, build and debug a circuit'),
    P('ability', 'Ship software that someone uses'),
    P('value', 'It has to actually work'),
    P('aesthetic', 'A workbench, tools, half-built devices'),
    P('behavior', 'Builds first, reads the manual when stuck'),
  ])
  archetype('ar_polymath', 'The polymath', 'Broad understanding across fields, and seeing connections between them.', [
    P('ability', 'Explain ideas from several fields to a non-specialist'),
    P('value', 'Everything connects'),
    P('aesthetic', 'The Renaissance notebook'),
    P('behavior', 'Reads widely, every day'),
  ])
  archetype('ar_philosopher', 'The philosopher', 'Clear reasoning about the deepest questions.', [
    P('ability', 'Reconstruct and evaluate an argument'),
    P('value', 'Intellectual honesty'),
    P('aesthetic', 'Dark academia'),
    P('behavior', 'Writes to think'),
  ])
  archetype('ar_athlete', 'The athlete', 'A capable, strong body.', [
    P('ability', 'Measurable strength and conditioning'),
    P('value', 'Discipline in the body carries over'),
    P('aesthetic', 'A lean, athletic look'),
    P('behavior', 'Trains on schedule regardless of mood'),
  ])
  archetype('ar_social', 'The socially capable one', 'Ease with people; initiating and keeping relationships.', [
    P('ability', 'Start and sustain a conversation with a stranger'),
    P('value', 'Connection'),
    P('behavior', 'Says yes to social situations'),
  ])
  archetype('ar_builder', 'The independent builder', 'Independence through skills and finished work.', [
    P('ability', 'Earn from finished work'),
    P('value', 'Independence'),
    P('behavior', 'Ships small things often'),
  ])
  archetype('ar_explorer', 'The explorer', 'Novelty, discovery, and following curiosity wherever it goes.', [
    P('value', 'Curiosity'),
    P('aesthetic', 'Maps, atlases, the unknown'),
    P('behavior', 'Picks up new subjects quickly'),
  ])
  archetype('ar_craftsman', 'The disciplined craftsman', 'Mastery through patient, repeated practice.', [
    P('ability', 'Deep skill in one craft'),
    P('value', 'Quality'),
    P('behavior', 'Practices daily, finishes what was started'),
  ])
  link('ar_researcher', 'related', 'tp_ai')
  link('ar_maker', 'related', 'tp_electronics')
  link('ar_philosopher', 'related', 'tp_philsci')
  link('ar_polymath', 'related', 'nt_breadth')
  link('ar_explorer', 'contradicts', 'ar_craftsman', 'novelty versus patient repetition, or a schedule that holds both?')

  // ---------------------------------------------------------------- projects

  add('project', 'pj_atlas', 'This atlas', {
    certainty: 'fact',
    body: `A personal wiki, knowledge graph and life OS: one place to see and connect goals, knowledge, identity, projects and action.

It descends from an earlier request for "a website that fixes my life, or at least shows me what I want to do with my life". The lesson carried over: it must connect to real action, not become a motivational dashboard.`,
    data: {
      status: 'active',
      purpose: 'An external representation of an evolving mind that helps turn curiosity into knowledge, knowledge into competence, and competence into finished things.',
      outcome: 'Used daily for capture and weekly for review, for at least a month.',
      nextAction: 'Import the private records file, then rewrite “Current priorities” in your own words.',
      startedOn: '2026-10',
      milestones: checks(['First release: notes, topics, graph, projects, search, export', 'Two weeks of daily use', 'First monthly review']),
    },
  })
  add('project', 'pj_cogfn', 'The Cognitive Functions exhibition', {
    certainty: 'fact',
    body: `An interactive exhibition in four rooms on the eight cognitive functions (Ti/Te, Ni/Ne, Fi/Fe, Si/Se), with a lobby. It lives in this repository and is served at [/functions/](/functions/).`,
    data: { status: 'completed', url: '/functions/', startedOn: '2026-09', endedOn: '2026-09', deliverables: ['Lobby + four exhibition rooms, deployed'] },
  })
  add('project', 'pj_twoworlds', 'Two Worlds', {
    certainty: 'report',
    currency: 'historical',
    body: `A website built with Vite and deployed through Git and Vercel. Evidence that the full build-and-deploy workflow has already been completed at least once.

Add the link and what the site does.`,
    data: { status: 'completed', deliverables: ['Deployed website (Vite · Git · Vercel)'] },
  })
  add('project', 'pj_ecosim', 'Ecosystem simulator', {
    certainty: 'report',
    currency: 'historical',
    body: `An ecosystem simulator with a cute, anime-inspired aesthetic. Explored at some point; how far it got is not recorded.`,
    data: { status: 'evaluating' },
  })
  add('project', 'pj_roundtable', 'The Round Table', {
    certainty: 'report',
    currency: 'historical',
    body: `A fictional universe built around a round table of **exactly ten canonical characters**, with ideas for an anime-inspired interactive website or game where users switch between characters. Described later as over, so archived unless reactivated.

**Continuity rules**
- Exactly ten canonical characters. Do not invent additional canonical members.
- Do not merge, rename, replace or reinterpret established core identities.
- Murk is a recurring guest, not a canonical member.
- The Dominic + Lucien → Daemon merge belongs to a *separate* character project; do not carry it over.

**Canonical members**
1. **Adrian**: AI researcher (machine learning, alignment and safety, cognition, mathematics, computer science). Analytical, skeptical, argumentative.
2. Leader of a small drug cartel.
3. Miami streamer, gamer and cryptobro.
4. Member of an Islamic insurgency in a developing country.
5. Neurodivergent looksmaxxer / gymbro archetype.
6. Hands-on engineer, maker and hacker.
7. Well-read dark-academia philosopher.
8. Tortured artist with schizotypal traits (a fictional characterisation).
9. Black SoundCloud rapper with a distinct hood-speaking voice.
10. **Not preserved.** Retrieve from the original source material before resuming; do not reconstruct it.`,
    data: { status: 'archived', statusReason: 'Described as over.', blockers: ['Identity of the tenth canonical member is missing from the record'] },
  })
  add('project', 'pj_uno', 'First Arduino build', {
    certainty: 'report',
    currency: 'unverified',
    body: `A first hands-on electronics project with a Robocraze Uno R3. It was mentioned previously; confirm the board is on hand.`,
    data: { status: 'idea', nextAction: 'Find the board and a USB cable; upload the Blink example.', outcome: 'An LED controlled by a button, and a sensor value plotted over serial.' },
  })
  link('pj_atlas', 'applies_to', 'tp_web')
  link('pj_atlas', 'inspired_by', 'qu_identity')
  link('pj_cogfn', 'applies_to', 'tp_personality')
  link('pj_cogfn', 'applies_to', 'tp_web')
  link('pj_twoworlds', 'applies_to', 'tp_web')
  link('pj_ecosim', 'related', 'pj_twoworlds')
  link('pj_ecosim', 'related', 'tp_emergence')
  link('pj_roundtable', 'related', 'tp_design')
  link('pj_uno', 'applies_to', 'tp_embedded')

  add('task', 'tk_private', 'Import the private records file (Settings → Data)', {
    data: { projectId: 'pj_atlas', next: true },
  })
  add('task', 'tk_priorities', 'Rewrite “Current priorities” in my own words', {
    data: { projectId: 'pj_atlas', next: true },
  })
  add('task', 'tk_twoworlds', 'Add the Two Worlds link and a one-paragraph description', {
    data: { projectId: 'pj_twoworlds', next: false },
  })

  // ---------------------------------------------------------------- learning

  add('path', 'lp_python', 'Python foundations', {
    body: 'From running a script to building a small tool you actually use. Each step is done when there is something to show.',
    data: {
      area: 'Programming',
      steps: checks([
        'Install Python; run a script from the terminal',
        'Variables, types and control flow: solve ten small exercises',
        'Functions and modules: write a reusable utility module',
        'Files and data: parse a CSV and summarise it',
        'A small command-line tool you actually use, pushed to GitHub',
        'Classes and tests with pytest',
        'NumPy: implement matrix multiplication by hand, then compare with NumPy',
      ]),
    },
  })
  add('path', 'lp_web', 'Web development', {
    data: {
      area: 'Programming',
      steps: checks([
        ['Deploy a site with Vite, Git and Vercel', 'Two Worlds (historical report)'],
        'Lay out one page in plain HTML and CSS, no framework',
        'JavaScript fundamentals: DOM, events, fetch',
        'TypeScript basics',
        'React: components, state and effects in a small app',
        'Read this atlas’s code and add one feature yourself',
        'Persistence: IndexedDB or a small backend',
      ]),
    },
  })
  add('path', 'lp_aiml', 'AI & machine learning', {
    data: {
      area: 'AI',
      steps: checks([
        'Vectors, matrices and matrix multiplication, by hand',
        'Implement a perceptron from scratch in Python',
        'Implement a two-layer neural network in NumPy and explain the forward pass in writing',
        'Backpropagation by hand on a tiny network',
        'Train a small model in PyTorch (MNIST)',
        'Write an explanation of how a transformer produces the next token',
        'Build a small tool-using agent with an LLM API and MCP',
      ]),
    },
  })
  add('path', 'lp_electronics', 'Electronics, hands-on', {
    data: {
      area: 'Electronics',
      steps: checks([
        'Ohm’s law and voltage dividers on a breadboard, checked with a multimeter',
        'Blink an LED with the Uno R3, then read a button',
        'Read an analog sensor and plot it over serial',
        'Drive a servo or motor from a proper power supply',
        'ESP32: serve a sensor reading to a web page over Wi-Fi',
        'Design a small device that connects software and hardware',
      ]),
    },
  })
  link('lp_python', 'part_of', 'tp_python')
  link('lp_web', 'part_of', 'tp_web')
  link('lp_aiml', 'part_of', 'tp_ml')
  link('lp_electronics', 'part_of', 'tp_electronics')
  link('lp_aiml', 'depends_on', 'lp_python')
  link('pj_uno', 'part_of', 'lp_electronics')

  add('skill', 'sk_webdeploy', 'Build & deploy a website', {
    body: 'Earlier self-assessment: "could not write a single line of code". That predates the evidence below and is not a current level.',
    data: { level: 'beginner', evidence: ['Two Worlds: built with Vite, deployed with Git and Vercel'] },
  })
  add('skill', 'sk_python', 'Python', { data: { level: 'unknown' } })
  add('skill', 'sk_electronics', 'Hands-on electronics', {
    body: 'Bachelor’s degree in Electronic Engineering. Current hands-on level not yet assessed.',
    data: { level: 'unknown' },
  })
  link('sk_webdeploy', 'learned_from', 'pj_twoworlds')
  link('sk_webdeploy', 'part_of', 'tp_web')
  link('sk_python', 'part_of', 'tp_python')
  link('sk_electronics', 'part_of', 'tp_electronics')

  // ---------------------------------------------------------------- goals (public-safe areas only)

  add('goal', 'gl_knowledge', 'Build an interconnected personal knowledge base', {
    data: {
      area: 'intellectual',
      status: 'active',
      priority: 'now',
      actions: checks(['Capture something every day for two weeks', 'Write five notes in my own words that link to at least two topics each']),
    },
  })
  add('goal', 'gl_software', 'Turn ideas into working software', {
    data: { area: 'technology', status: 'active', priority: 'now', actions: checks(['Finish steps 1–5 of Python foundations']) },
  })
  add('goal', 'gl_reasoning', 'Reason from first principles and evaluate arguments', {
    data: { area: 'intellectual', status: 'aspiration', priority: 'later' },
  })
  add('goal', 'gl_hardware', 'Build projects that connect software and physical systems', {
    data: { area: 'electronics', status: 'aspiration', priority: 'next', actions: checks(['Blink an LED with the Uno R3']) },
  })
  add('goal', 'gl_portfolio', 'A portfolio of finished software and engineering projects', {
    data: { area: 'career', status: 'aspiration', priority: 'next' },
  })
  add('goal', 'gl_design', 'Build visually distinctive, intellectually interesting websites', {
    data: { area: 'creative', status: 'aspiration', priority: 'later' },
  })
  link('gl_knowledge', 'related', 'pj_atlas')
  link('gl_software', 'related', 'lp_python')
  link('gl_hardware', 'related', 'pj_uno')
  link('gl_portfolio', 'related', 'pj_twoworlds')
  link('gl_design', 'related', 'pj_cogfn')

  // ---------------------------------------------------------------- library: suggestions, clearly labelled

  const suggest = (id: string, title: string, data: Data<'resource'>, topicId: string) => {
    add('resource', id, title, {
      tags: ['suggested'],
      body: 'Suggested during setup, not chosen by you. Keep it, or delete it.',
      data: { status: 'want', ...data },
    })
    link(id, 'part_of', topicId)
  }
  suggest('rs_karpathy', 'Neural Networks: Zero to Hero', { type: 'course', author: 'Andrej Karpathy', url: 'https://karpathy.ai/zero-to-hero.html', sourceType: 'secondary' }, 'tp_ml')
  suggest('rs_3b1b', 'Essence of Linear Algebra', { type: 'video', author: '3Blue1Brown', url: 'https://www.3blue1brown.com/topics/linear-algebra', sourceType: 'popular' }, 'tp_linalg')
  suggest('rs_aoe', 'The Art of Electronics', { type: 'book', author: 'Paul Horowitz & Winfield Hill', year: '2015', sourceType: 'secondary' }, 'tp_electronics')
  suggest('rs_atbs', 'Automate the Boring Stuff with Python', { type: 'book', author: 'Al Sweigart', url: 'https://automatetheboringstuff.com/', sourceType: 'secondary' }, 'tp_python')
  suggest('rs_mcp', 'Model Context Protocol specification', { type: 'link', url: 'https://modelcontextprotocol.io', sourceType: 'primary' }, 'tp_agents')
  suggest('rs_geb', 'Gödel, Escher, Bach', { type: 'book', author: 'Douglas Hofstadter', year: '1979', sourceType: 'popular' }, 'tp_mind')
  suggest('rs_kuhn', 'The Structure of Scientific Revolutions', { type: 'book', author: 'Thomas Kuhn', year: '1962', sourceType: 'primary' }, 'tp_philsci')
  link('rs_geb', 'related', 'tp_foundations')

  // ---------------------------------------------------------------- timeline: dated only where the date is known

  add('event', 'ev_degree', 'Completed a Bachelor’s in Electronic Engineering', {
    certainty: 'report',
    currency: 'historical',
    data: { date: null, category: 'milestone' },
  })
  add('event', 'ev_twoworlds', 'Built and deployed Two Worlds', {
    certainty: 'report',
    currency: 'historical',
    data: { date: null, category: 'project' },
  })
  add('event', 'ev_cogfn', 'Published The Cognitive Functions exhibition', {
    certainty: 'fact',
    body: 'Date from the repository history.',
    data: { date: '2026-09-28', category: 'project' },
  })
  add('event', 'ev_atlas', 'Started this atlas', { certainty: 'fact', data: { date: '2026-10-11', category: 'project' } })
  add('event', 'ev_roundtable', 'The Round Table project ended', {
    certainty: 'report',
    currency: 'historical',
    data: { date: null, category: 'project' },
  })
  link('ev_twoworlds', 'part_of', 'pj_twoworlds')
  link('ev_cogfn', 'part_of', 'pj_cogfn')
  link('ev_atlas', 'part_of', 'pj_atlas')
  link('ev_roundtable', 'part_of', 'pj_roundtable')

  return { records, links }
}

/** Kinds that must never appear in the public seed. Checked by tests. */
export const PRIVATE_ONLY_KINDS: Kind[] = ['observation', 'hypothesis', 'log', 'medication', 'item', 'routine', 'review']
