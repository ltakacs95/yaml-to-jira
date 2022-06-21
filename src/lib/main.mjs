import yaml from 'js-yaml'
import { buildDescription, prependToSummary } from './functions.mjs'

const slugify = str =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

const makeFields = (ticket, component, prepend, root) => {
  const fields = {}
  fields.summary = ticket.summary
  if (ticket.component || component) {
    fields.summary = prependToSummary(fields.summary, ticket.component || component)
  }

  if (ticket.prepend || prepend) {
    fields.summary = prependToSummary(fields.summary, ticket.prepend || prepend)
  }

  fields.ref = ticket.ref || slugify(ticket.summary)
  fields.priority = { name: ticket.priority || 'Medium' }

  fields.project = root.project
  if (ticket.project) {
    fields.project = ticket.project
  }

  fields.project = { key: fields.project }

  if (ticket.assignee) {
    fields.assignee = { name: ticket.assignee.toLowerCase() }
  }

  if (ticket.description) {
    fields.description = buildDescription(ticket.description)
  }

  if (ticket.sprint) {
    fields[root.sprintField] = root.sprintIds[ticket.sprint] || ''
  }

  if (ticket.estimate) {
    fields.timetracking = {
      originalEstimate: ticket.estimate,
      remainingEstimate: ticket.estimate
    }
  }

  fields.links = ticket.links

  return fields
}

const processTask = (task, root, component = '', prepend = '') => {
  const fields = makeFields(task, component, prepend, root)

  fields.issuetype = { name: task.type || 'Task' }

  return fields
}

const processStory = (story, root, component = '', prepend = '') => {
  const fields = makeFields(story, component, prepend, root)

  fields.issuetype = { name: 'Story' }
  if (story.tasks && story.tasks.length > 0) {
    fields.tasks = []
    for (let i = 0; i < story.tasks.length; i++) {
      const task = processTask(story.tasks[i], root, story.component || component, story.prepend || prepend)
      fields.tasks.push(task)
    }
  }

  return fields
}

const processEpic = (epic, root) => {
  const fields = makeFields(epic, '', '', root)

  fields.issuetype = { name: 'Epic' }
  if (epic.stories && epic.stories.length > 0) {
    fields.stories = []
    for (let i = 0; i < epic.stories.length; i++) {
      const task = processStory(epic.stories[i], root, epic.component, epic.prepend)
      fields.stories.push(task)
    }
  }
  return fields
}

export const main = (input, domain = null, username = null, password = null, sprintIds = {}) => {
  if (!input) {
    console.error('Please pipe in data as yaml. \n Example: \n cat my-tasks.yml | y2j http://example-jira.com username password')
    return null
  }

  const output = {}
  let data = {}
  try {
    data = yaml.load(input)
  } catch (e) {
    console.error('Invalid yaml')
    console.error('Error: ' + e)
    return null
  }

  if (!data.project) {
    console.error('Please provide a project at root level in your yaml.')
    return null
  }

  if (JSON.stringify(data).indexOf('sprint') > -1) {
    if (!data.boardId) {
      console.error('Please specify the boardId at root level when working with sprints')
      return null
    }

    if (!data.sprintField) {
      console.error('Please specify the sprintField at root level when working with sprints')
      return null
    }
  }

  data.baseUrl = `https://${username}:${password}@${domain}`
  data.sprintIds = sprintIds

  if (data.tasks && data.tasks.length > 0) {
    output.tasks = []
    for (let i = 0; i < data.tasks.length; i++) {
      output.tasks[i] = processTask(data.tasks[i], data)
    }
  }

  if (data.stories && data.stories.length > 0) {
    output.stories = []
    for (let i = 0; i < data.stories.length; i++) {
      output.stories[i] = processStory(data.stories[i], data)
    }
  }

  if (data.epics && data.epics.length > 0) {
    output.epics = []
    for (let i = 0; i < data.epics.length; i++) {
      output.epics[i] = processEpic(data.epics[i], data)
    }
  }
  return output
}
