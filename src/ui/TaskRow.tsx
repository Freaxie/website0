import { Link } from 'react-router-dom'
import { nowIso } from '../domain/ids'
import type { RecordOf } from '../domain/types'
import { useVisible } from '../store/hooks'
import { useStore } from '../store/store'

export function toggleTask(t: RecordOf<'task'>, done = !t.data.done) {
  useStore.getState().update<'task'>(t.id, { data: { done, doneAt: done ? nowIso() : null } })
}

export function TaskRow({ task, showProject = false }: { task: RecordOf<'task'>; showProject?: boolean }) {
  const records = useVisible()
  const project = task.data.projectId ? records[task.data.projectId] : undefined
  return (
    <li className={`task ${task.data.done ? 'is-done' : ''}`}>
      <input type="checkbox" className="checkbox" checked={task.data.done} aria-label={`Complete: ${task.title}`} onChange={() => toggleTask(task)} />
      <Link to={`/r/${task.id}`} className="task-title">
        {task.title || 'Untitled task'}
      </Link>
      {showProject && project && (
        <Link to={`/r/${project.id}`} className="task-project kicker">
          {project.title}
        </Link>
      )}
      {task.data.due && <span className="kicker">due {task.data.due}</span>}
    </li>
  )
}

export function AddTask({ projectId, placeholder = 'Add a task' }: { projectId?: string | null; placeholder?: string }) {
  return (
    <li className="add-task">
    <form
      className="add-row add-row--task"
      onSubmit={(e) => {
        e.preventDefault()
        const input = e.currentTarget.elements.namedItem('t') as HTMLInputElement
        const title = input.value.trim()
        if (!title) return
        useStore.getState().create('task', { title, data: { projectId: projectId ?? null, next: true } })
        input.value = ''
      }}
    >
      <span className="checkbox checkbox--ghost" aria-hidden />
      <input name="t" className="input input--bare" placeholder={placeholder} aria-label={placeholder} />
    </form>
    </li>
  )
}
