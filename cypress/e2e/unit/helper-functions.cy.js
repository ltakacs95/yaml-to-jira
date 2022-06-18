import {buildDescription, capitalizeTheFirstLetterOfEachWord, matchBoardId, matchSprintNames, prependToSummary} from '../../../src/lib/functions.mjs'

describe('Helper Functions', () => {
  it('prependComponent', () => {
    expect(prependToSummary('Summary', 'Component')).to.eq('Component - Summary')
  })
  it('capitalizeTheFirstLetterOfEachWord', () => {
    expect(capitalizeTheFirstLetterOfEachWord('the words')).eq('The Words')
  })

  it('buildDescription with string', () => {
    expect(buildDescription('my Description')).to.eq('my Description')
  })

  it('buildDescription with object', () => {
    expect(buildDescription({ key: 'value' })).to.contain('<strong>Key</strong>:')
    expect(buildDescription({ key: 'value' })).to.contain('value')
  })

  it('buildDescription multiple values', () => {
    expect(buildDescription({ key: 'value', 'second key': 'second value' })).to.eq('<strong>Key</strong>:<br>value<br><br><strong>Second Key</strong>:<br>second value<br><br>')
  })

  it('matchSprintNames', () => {
    cy.fixture("examples/multipleTasksWithDifferentSprints.yml").then((input) => {
      expect(matchSprintNames(input)).deep.to.eq(['ACTIVE', 'NEXT'])
    })
  })

  it('matchBoardId', () => {
    cy.fixture("examples/multipleTasksWithDifferentSprints.yml").then((input) => {
      expect(matchBoardId(input)).to.eq('430')
    })
  })

})
