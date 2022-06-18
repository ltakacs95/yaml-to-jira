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
  return Object.entries(description).reduce((builtDescription, [key, value]) => {
    const capitalitedKey = capitalizeTheFirstLetterOfEachWord(key)
    builtDescription += `<strong>${capitalitedKey}</strong>:<br>${value}<br><br>`
    return builtDescription
  }, '').replace(/\n/g, '<br>')
}

export const getPipedInput = () => new Promise((resolve, reject) => {
  const stdin = process.stdin
  let data = ''

  stdin.setEncoding('utf8')
  stdin.on('data', chunk => {
    data += chunk
  })

  stdin.on('end', () => {
    resolve(data)
  })

  stdin.on('error', reject)
})

export const fetchSprint = (baseUrl, boardId, sprintName) => {
  const options = {
    method: 'GET',
    url: `${baseUrl}/rest/agile/1.0/board/${boardId}/sprint`,
    params: {state: 'active,future'},
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return axios.request(options).then(response => response.data.values)
    .then((sprints) => {
      if (!sprints.length) {
        throw new Error("No sprint were returned.")
      }
      return sprints.filter(({name}) => name === sprintName)[0];
    })
    .catch((error) => {
      console.error(`Couldn't fetch sprint with name ${sprintName} from board ${boardId}.`)
      console.log("Error: " + error)
      process.exit(1)
    })
}

export const matchSprintNames = (input) => {
  let match = input.match(/sprint: (.*)/ig);
  if (!match) {
    return[]
  }
  return match.slice(1).map((string) => string.replace("sprint: ", ""));
}

export const matchBoardId = (input) => {
  let match = input.match(/boardId: (\d*)/);
  if (!match) {
    return 0
  }
  return match.slice(1)[0];
}
export const getTicketsToCreate = (hierarchicalTicketFields) => {
  let epicsToCreate = []
  let storiesToCreate = []
  let tasksToCreate = []

  const handleStory = ticket => {
    tasksToCreate = tasksToCreate.concat([...ticket.tasks])
    delete ticket.tasks
    return ticket
  };

  if (hierarchicalTicketFields.epics && hierarchicalTicketFields.epics.length > 0) {
    epicsToCreate = hierarchicalTicketFields.epics.map((epic) => {
      storiesToCreate = storiesToCreate.concat(epic.stories.map(handleStory))
      delete epic.stories
      return epic
    })
  }
  if (hierarchicalTicketFields.stories && hierarchicalTicketFields.stories.length > 0) {
    storiesToCreate = hierarchicalTicketFields.stories.map(handleStory)
  }

  if (hierarchicalTicketFields.tasks && hierarchicalTicketFields.tasks.length > 0) {
    tasksToCreate = tasksToCreate.concat((hierarchicalTicketFields.tasks))
  }

  return epicsToCreate.concat(storiesToCreate).concat(tasksToCreate);
};
