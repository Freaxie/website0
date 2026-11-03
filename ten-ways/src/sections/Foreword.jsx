import { motion } from 'framer-motion'

const rise = (d = 0) => ({ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 1, delay: d, ease: [0.2, 0.8, 0.2, 1] } } })

const ROOMS = [
  ['I', 'entrance', 'Entrance', 'Twenty-four rays, and the one reality they converge on.'],
  ['II', 'atlas', 'The Atlas', 'The twenty-four on a map whose axes you choose.'],
  ['III', 'ten', 'The Twenty-Four', 'A plate, an instrument, a world and a full entry for each.'],
  ['IV', 'encounters', 'One World, Twenty-Four Encounters', 'A mountain, the sea and a stranger, redrawn by every way.'],
  ['V', 'kinships', 'Kinships', 'Allies, opposites, and the rare unions of the two.'],
  ['VI', 'lineages', 'Lineages', 'One hundred and ninety-two dated moments on a single line.'],
  ['VII', 'yours', 'Your Constellation', 'Sixteen small scenes, and a reading of your shape.'],
  ['VIII', 'letters', 'Letters', 'Twenty-four letters to someone just starting out.'],
  ['IX', 'coda', 'Coda', 'Twenty-four imperatives, and one sentence.'],
]

// A note from the curator between the entrance and the first room, with the plan of the building.
export default function Foreword() {
  return (
    <motion.section className="fore" aria-label="Foreword" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
      <motion.header className="fore__head" variants={rise()}>
        <span className="mono">Foreword</span>
        <h2>Before you go in</h2>
      </motion.header>
      <div className="fore__body">
        <motion.div className="fore__text" variants={rise(0.1)}>
          <p className="fore__lead">
            There is an old habit, older than writing, of understanding people by the shape of their attention. The hunter, the healer, the priest, the fool: every culture has kept figures like these, not because anyone is only one of them,
            but because each names a way of meeting the world that we recognise in others and, sometimes uncomfortably, in ourselves. This exhibition gathers twenty-four. Some are as old as cities. One was only named online, a few years
            ago. All of them are alive.
          </p>
          <p>
            An archetype here is not a personality type, and nothing in these rooms will tell you what you are. It is closer to a lens, or a tool: a question you can put to reality, and the kind of answer that question is able to get. The
            scientist asks how it works; the lover asks who you are, really; the gardener asks what it needs to grow. Each question lights up part of the world and leaves the rest in shadow. That is why each way has a gift and a shadow of
            its own, and why nobody should try to live by a single one.
          </p>
          <p>
            The twenty-four are arranged in six orders of four, by what they attend to: the true, the made, the self, the shared order, the given world, and the other. The arrangement is a curator’s, not a law of nature. You are invited to
            argue with it, and the Atlas will let you move them about yourself.
          </p>
          <p>
            Each has a plate in its own colour, with an instrument to play and a small world that answers the pointer; an entry, set like a page of an old encyclopedia, with its history, a scene, its myths and its curiosities, and an
            hour-by-hour day in its life; a painting of its myth, drawn in code and made in a medium chosen for it; and, in the eighth room, a letter to someone just starting out on its way.
          </p>
          <p>
            You will find yourself in more than one. That is the point. Most lives are a constellation rather than a star: a scientist who gardens, a warrior who has become a teacher, a lover who is also, on Sundays, a hedonist. The seventh
            room will draw yours, if you let it.
          </p>
          <p>Take your time. Nothing here is in a hurry, and reality, whatever else it is, is large enough for all twenty-four.</p>
          <p className="fore__sign">The curator</p>
        </motion.div>

        <motion.nav className="fore__plan" aria-label="The plan of the exhibition" variants={rise(0.25)}>
          <span className="mono">The rooms</span>
          <ol>
            {ROOMS.map(([no, id, name, line]) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span className="fore__no">{no}</span>
                  <span className="fore__name">{name}</span>
                  <span className="fore__line">{line}</span>
                </a>
              </li>
            ))}
          </ol>
        </motion.nav>
      </div>
    </motion.section>
  )
}
