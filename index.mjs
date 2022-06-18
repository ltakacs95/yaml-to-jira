import {Command} from 'commander'
import {readFile} from 'fs/promises'
import {fetchSprint, getTicketsToCreate, matchBoardId, matchSprintNames} from "./src/lib/functions.mjs";
import {main} from './src/lib/main.mjs'

const program = new Command()

const version = JSON.parse(
  await readFile(new URL('./package.json', import.meta.url))
).version

program
  .name('y2j')
  .description('Create JIRA Issues using the REST API from YAML.')
  .version(version)
  .command('pipe', {isDefault: true})
  .description('Create JIRA Issues using the REST API from piped in YAML ')
  .argument('<baseUrl>', 'JIRA Instance URL without https:// prefix')
  .argument('<username>', 'JIRA Instance Username')
  .argument('<password>', 'JIRA Instance Password')
  // .argument('<baseUrl>', 'The base issue url of your jira ')
  .action((domain, username, password) => {
    if (process.stdin.isTTY !== undefined) {
      main(null)
    }
    const stdin = process.openStdin()

    const baseUrl = `https://${username}:${password}@${domain}`
    let input = ''

    stdin.on('data', function (chunk) {
      input += chunk
    })

    stdin.on('end', async function () {
      if (!input) {
        console.error('Please pipe in data as yaml. \n Example: \n cat my-tasks.yml | y2j http://example-jira.com username password')
        process.exit(9)
      }

      const sprintNames = matchSprintNames(input)
      const boardId = matchBoardId(input)
      const sprintIds = {}

      for (let i = 0; i < sprintNames.length; i++) {
        const sprint = await fetchSprint(baseUrl, boardId, sprintNames[i])
        sprintIds[sprintNames[i]] = sprint.id
      }

      const hierarchicalTicketFields = main(input, domain, username, password, sprintIds);
      const ticketsToCreate = getTicketsToCreate(hierarchicalTicketFields);
      console.log(JSON.stringify(ticketsToCreate, null, 2));
    })
  })

program.parseAsync()
