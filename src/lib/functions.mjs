import axios from 'axios'

export const prependToSummary = (summary, component) => {
  if (!component) {
    return summary
  }
  return `${component} - ${summary}`
}

export const capitalizeTheFirstLetterOfEachWord = words => {
  const separateWord = words.toLowerCase().split(' ')
  for (let i = 0; i < separateWord.length; i++) {
    separateWord[i] = separateWord[i].charAt(0).toUpperCase() +
      separateWord[i].substring(1)
  }

  return separateWord.join(' ')
}

export const buildDescription = description => {
  if (typeof description === 'string') {
    return description
  }

  return Object.entries(description)
    .reduce((builtDescription, [key, value]) => {
      const capitalized = capitalizeTheFirstLetterOfEachWord(key)
      builtDescription += `<strong>${capitalized}</strong>:<br>${value}<br><br>`
      return builtDescription
    }, '')
    .replace(/\n/g, '<br>')
}

export const fetchSprint = (baseUrl, boardId, sprintName) => {
  const options = {
    method: 'GET',
    url: `${baseUrl}/rest/agile/1.0/board/${boardId}/sprint`,
    params: { state: 'active,future' },
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return axios.request(options).then(response => response.data.values)
    .then((sprints) => {
      if (!sprints.length) {
        throw new Error('No sprint were returned.')
      }
      return sprints.filter(({ name }) => name === sprintName)[0]
    })
    .catch((error) => {
      console.error(`Couldn't fetch sprint with name ${sprintName} from board ${boardId}.`)
      console.log('Error: ' + error)
      process.exit(1)
    })
}

export const matchSprintNames = (input) => {
  const match = input.match(/sprint: (.*)/ig)
  if (!match) {
    return []
  }
  return  [...new Set(match.map((string) => string.replace('sprint: ', '')))];
}

export const matchBoardId = (input) => {
  const match = input.match(/boardId: (\d*)/)
  if (!match) {
    return 0
  }
  return match.slice(1)[0]
}
export const flattenTickets = (hierarchicalTicketFields) => {
  let epicsToCreate = []
  let storiesToCreate = []
  let tasksToCreate = []

  const handleStory = ticket => {
    tasksToCreate = tasksToCreate.concat([...ticket.tasks])
    const { tasks, ...ticketToReturn } = ticket // clone without tasks
    return ticketToReturn
  }

  if (hierarchicalTicketFields.epics && hierarchicalTicketFields.epics.length > 0) {
    epicsToCreate = hierarchicalTicketFields.epics.map((epic) => {
      storiesToCreate = storiesToCreate.concat(epic.stories.map(handleStory))
      const { stories, ...epicToReturn } = epic // clone without stories
      return epicToReturn
    })
  }
  if (hierarchicalTicketFields.stories && hierarchicalTicketFields.stories.length > 0) {
    storiesToCreate = storiesToCreate.concat(hierarchicalTicketFields.stories.map(handleStory))
  }

  if (hierarchicalTicketFields.tasks && hierarchicalTicketFields.tasks.length > 0) {
    tasksToCreate = tasksToCreate.concat(tasksToCreate.concat((hierarchicalTicketFields.tasks)))
  }

  return epicsToCreate
    .concat(storiesToCreate)
    .concat(tasksToCreate)
}

export const collectIssueLinks = (tickets) => {
  return tickets.reduce((issueLinks, ticket) => {
    if (!ticket.links || !ticket.links.length) {
      return issueLinks
    }

    const newLinks = ticket.links.reduce((links, link) => {
      const [type, bRef] = Object.entries(link)[0]
      const b = tickets.find((otherTicket) => otherTicket.ref === bRef).key
      return [
        ...links,
        {
          a: ticket.key,
          type,
          b
        }
      ]
    }, [])
    return issueLinks.concat(newLinks)
  }, [])
}

export const addHierarchicalIssueSplitLinks = (data) => {
  if (data.epics) {
    data.epics = data.epics.map((epic) => {
      return {
        ...epic,
        stories: epic.stories.map((story) => {
          const links = story.links || []
          return {
            ...story,
            links: [
              {
                split_from: epic.ref
              },
              ...links
            ],
            tasks: story.tasks.map((task) => {
              const links = task.links || []
              return {
                ...task,
                links: [
                  {
                    split_from: story.ref
                  },
                  ...links
                ]
              };
            })
          };
        })
      }
    })
  }

  if (data.stories) {
    data.stories = data.stories.map((story) => {
      return {
        ...story,
        tasks: story.tasks.map((task) => {
          console.log({links:task.links})
          const links = task.links || []
          return {
            ...task,
            links: [
              {
                split_from: story.ref
              },
              ...links
            ]
          };
        })
      }
    })
  }
  return data
}

export const getIssueLinkRequestsFields = (links) => {
  return links.map((link) => {
    let type, a, b
    a = link.a
    b = link.b
    switch (link.type) {
      case 'split_from':
        // reverse
        a = link.b
        b = link.a
        type = {
          name: 'Issue split',
          inward: 'split from',
          outward: 'split to'
        }
        break
      case 'blocks':
        type = {
          name: 'Blocks',
          inward: 'is blocked by',
          outward: 'blocks'
        }
        break
      case 'blocked_by':
        // reverse
        a = link.b
        b = link.a
        type = {
          name: 'Blocks',
          inward: 'is blocked by',
          outward: 'blocks'
        }
        break
      case 'relates_to':
        type = {
          name: 'Relates',
          inward: 'relates to',
          outward: 'relates to'
        }
        break
    }
    return {
      key: a,
      update: {
        issuelinks: [
          {
            add: {
              type,
              outwardIssue: {
                key: b
              }
            }
          }
        ]
      }
    }
  })
}
