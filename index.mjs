import axios from 'axios'
import {Command} from 'commander'
import {readFile} from 'fs/promises'
import {addHierarchicalIssueSplitLinks, collectIssueLinks, fetchSprint, flattenTickets, getIssueLinkRequestsFields, matchBoardId, matchSprintNames} from './src/lib/functions.mjs'
import {main} from './src/lib/main.mjs'

const program = new Command()
program.exitOverride((err) => {
  if (err.code === 'commander.missingArgument') {
    console.log()
    program.outputHelp()
  }
  process.exit(err.exitCode)
})

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
    if (!password && !username) {
      process.exit(0)
    }
    const stdin = process.openStdin();

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

      const boardId = matchBoardId(input)
      const sprintNames = matchSprintNames(input);
      const sprintRequests = sprintNames.map((sprintName) => fetchSprint(baseUrl, boardId, sprintName))
      const sprintIds = {}
      const sprintResponses = await Promise.all(sprintRequests)
      sprintResponses.forEach(({id}, index) => {
        sprintIds[sprintNames[index]] = id
      })

      const hierarchicalTicketFields = main(input, domain, username, password, sprintIds)

      if (!hierarchicalTicketFields) {
        process.exit(0)
      }

      const hierarchicalTicketFieldsWithLinks = addHierarchicalIssueSplitLinks(hierarchicalTicketFields)
      const tickets = flattenTickets(hierarchicalTicketFieldsWithLinks)

      const createTicket = (fields, url) => {
        const {ref, links, ...fieldsToSend} = fields // clone without ref, links, epicField
        url = url + '/rest/api/2/issue/'
        return axios.request({
          method: 'POST',
          url,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            fields: {...fieldsToSend}
          }
        })
          .catch(({response}) => {
            console.log(Object.entries(response.data.errors).reduce((errors, [key, error]) => {
              return errors + key + ':' + error + '\n'
            }, 'JIRA Errors: \n'))
            process.exit(1)
          })
      }

      const responses = await Promise.all(
        tickets.map((ticket, index) => {
          if (ticket.ref.match(/^[A-Z]{2,}-\d+$/) !== null) {
            // ticket already exists
            return {key: ticket.ref}
          }

          return createTicket(ticket, baseUrl).then((response) => response.data);
        })
      ).catch((response) => {
        console.log({response})
      })

      const refMap = new Map()
      responses.forEach(({key}, index) => {
        tickets[index].key = key
        refMap.set(tickets[index].ref,key)
      })

      if (hierarchicalTicketFieldsWithLinks.epicField) {
        const epicRequests = tickets
          .filter((ticket) => ticket[hierarchicalTicketFieldsWithLinks.epicField])
          .map((ticket) => {
            const url = baseUrl + '/rest/api/2/issue/' + ticket.key
            const epicRef = ticket[hierarchicalTicketFieldsWithLinks.epicField];
            return axios.request({
              method: 'PUT',
              url,
              headers: {
                'Content-Type': 'application/json'
              },
              data: {
                fields: {
                  [hierarchicalTicketFieldsWithLinks.epicField]: refMap.get(epicRef)
                }
              }
            }).catch(({response}) => {
              console.log(JSON.stringify(response.data,null,2))
              console.log('Epic Link PUT Request failed')
              process.exit(1)
            })
          });
        await Promise.all(epicRequests)
      }

      const links = collectIssueLinks(tickets)
      const linkRequests = getIssueLinkRequestsFields(links)
        .map(({key, update}) => {
          return axios.request({
            method: 'PUT',
            url: `${baseUrl}/rest/api/2/issue/${key}`,
            headers: {
              'Content-Type': 'application/json'
            },
            data: {
              update
            }
          })
            .catch(({response}) => {
              console.log(JSON.stringify(response.data,null,2))
              console.log('Link PUT Request failed')
              process.exit(1)
            })
        })

      await Promise.all(linkRequests)
    })
  })

program.parseAsync()
