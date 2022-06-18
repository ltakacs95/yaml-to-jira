import {main} from '../../../src/lib/main.mjs'

let singleTaskWithComponentYaml;
let singleTaskWithSprintYaml;
let singleTaskWithPrependYaml;
let singleTaskWithPrependAndComponentYaml;
let multipleTasksWithDifferentSprints;
let storyWithTasks;
let epicWithAStoryWithTasks;

describe('default command', () => {
  beforeEach(() => {
    cy.fixture('examples/singleTaskWithComponent.yml').then(data => {
      return singleTaskWithComponentYaml = data;
    })

    cy.fixture('examples/singleTaskWithPrepend.yml').then(data => {
      return singleTaskWithPrependYaml = data;
    })

    cy.fixture('examples/singleTaskWithPrependAndComponent.yml').then(data => {
      return singleTaskWithPrependAndComponentYaml = data;
    })

    cy.fixture('examples/singleTaskWithSprint.yml').then(data => {
      return singleTaskWithSprintYaml = data;
    })
    cy.fixture('examples/multipleTasksWithDifferentSprints.yml').then(data => {
      return multipleTasksWithDifferentSprints = data;
    })
    cy.fixture('examples/epicWithAStoryWithTasks.yml').then(data => {
      return epicWithAStoryWithTasks = data;
    })
    cy.fixture('examples/storyWithTasks.yml').then(data => {
      return storyWithTasks = data;
    })
  })

  it('fails if no piped input is given',  () => {
    expect(main()).to.eq(null)
    console.clear()
  })


  it('project is required', () => {
    expect(main('test')).to.eq(null)
    console.clear()
  })

  it('fails if yaml is invalid',  () => {
    expect(main(' allow: acl: loopback acl: admin ')).to.eq(null)
    console.clear()
  })

  it('goes on if yaml is valid',  () => {
    cy.fixture('examples/singleTaskWithComponent.yml').then((data) => expect(main(data)).to.not.eq(null))
  })

  it('summary with component', () => {
    let summary = main(singleTaskWithComponentYaml).tasks[0].summary;
    expect(summary).to.eq("example.com - 500 instead of 404 on missing pages")
  })

  it('summary with prepend', () => {
    let summary = main(singleTaskWithPrependYaml).tasks[0].summary;
    expect(summary).to.eq("PREPEND - 500 instead of 404 on missing pages")
  })

  it('summary with prepend and component', () => {
    let summary = main(singleTaskWithPrependAndComponentYaml).tasks[0].summary;
    expect(summary).to.eq("PREPEND - component - 500 instead of 404 on missing pages")
  })

  it('accepts type', () => {
    let type = main(singleTaskWithPrependAndComponentYaml).tasks[0].issuetype.name;
    expect(type).to.eq("Bug")
  })

  it('type falls back to task', () => {
    let type = main(singleTaskWithPrependYaml).tasks[0].issuetype.name;
    expect(type).to.eq("Task")
  })

  it('accepts assignee', () => {
    let assignee = main(singleTaskWithPrependYaml).tasks[0].assignee.name;
    expect(assignee).to.eq("username")
  })

  it('accepts default project from root', () => {
    let project = main(singleTaskWithPrependYaml).tasks[0].project
    expect(project.key).to.eq("JIR")
  })

  it('may overwrite project', () => {
    let project = main(singleTaskWithPrependAndComponentYaml).tasks[0].project
    expect(project.key).to.eq("OVERRIDE")
  })

  it('accepts estimate', () => {
    let estimate = main(singleTaskWithPrependYaml).tasks[0].timetracking
    expect(estimate.originalEstimate).to.eq("2h 30m")
    expect(estimate.remainingEstimate).to.eq("2h 30m")
  })

  it('accepts description', () => {
    let description = main(singleTaskWithPrependAndComponentYaml).tasks[0].description;
    expect(description).to.eq("<strong>Current Situation</strong>:<br>500 status code on missing page<br><br><strong>Requested Situation</strong>:<br>404 status code on missing page<br><br><strong>Notes</strong>:<br>Test first.<br><br>")
  })

  it('boardId is required when sprint is used', () => {
    cy.fixture('bad/wrong__singleTaskWithSprintWithoutBoardId.yml').then((data) => {
      console.clear()
      expect(main(data)).to.eq(null);
    })
  })

  it('sprintField is required when sprint is used', () => {
    cy.fixture('bad/wrong__singleTaskWithSprintWithoutSprintField.yml').then((data) => {
      expect(main(data)).to.eq(null);
      console.clear()
    })
  })

  it('sprintField is set by name', () => {
    let sprintId = main(multipleTasksWithDifferentSprints, '', '', '', {ACTIVE: 42, NEXT: 43}).tasks[0].customfield_1;
    expect(sprintId).to.eq(43)
  })

  it('can process story ', () => {
    let summary = main(storyWithTasks).stories[0].summary;
    expect(summary).to.eq("example.com - story summary")
  })

  it('can process story tasks', () => {
    let summary = main(storyWithTasks).stories[0].tasks[0].summary;
    expect(summary).to.eq("example.com - task summary")
  })

  it('can process epic ', () => {
    let summary = main(epicWithAStoryWithTasks).epics[0].summary;
    expect(summary).to.eq("epic.example - epic summary")
  })

  it('can process epic stories', () => {
    let summary = main(epicWithAStoryWithTasks).epics[0].stories[0].summary;
    expect(summary).to.eq("epic.example - story summary")
  })

  it('can process epic story tasks', () => {
    let summary = main(epicWithAStoryWithTasks).epics[0].stories[0].tasks[0].summary;
    expect(summary).to.eq("epic.example - task summary")
  })
})
