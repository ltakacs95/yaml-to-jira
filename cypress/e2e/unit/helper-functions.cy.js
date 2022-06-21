import { addHierarchicalIssueSplitLinks, buildDescription, capitalizeTheFirstLetterOfEachWord, collectIssueLinks, getIssueLinkRequestsFields, matchBoardId, matchSprintNames, prependToSummary } from '../../../src/lib/functions.mjs'

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
    cy.fixture('examples/multipleTasksWithDifferentSprints.yml').then((input) => {
      expect(matchSprintNames(input)).deep.to.eq(['NEXT','ACTIVE'])
    })
  })

  it('matchBoardId', () => {
    cy.fixture('examples/multipleTasksWithDifferentSprints.yml').then((input) => {
      expect(matchBoardId(input)).to.eq('430')
    })
  })

  it('collectIssueLinks', () => {
    expect(collectIssueLinks([
      {
        ref: 'main',
        key: 'JIRA-0000'
      },
      {
        ref: 'sub1',
        key: 'JIRA-1111',
        links: [
          { split_from: 'main' }
        ]
      },
      {
        ref: 'sub2',
        key: 'JIRA-2222',
        links: [
          { split_from: 'main' },
          { blocked_by: 'main' }
        ]
      },
      {
        ref: 'sub3',
        key: 'JIRA-3333',
        links: [
          { split_from: 'main' },
          { relates: 'sub1' },
          { blocked_by: 'sub2' }
        ]
      }
    ])).deep.to.eq([
      {
        a: 'JIRA-1111',
        type: 'split_from',
        b: 'JIRA-0000'
      },
      {
        a: 'JIRA-2222',
        type: 'split_from',
        b: 'JIRA-0000'
      },
      {
        a: 'JIRA-2222',
        type: 'blocked_by',
        b: 'JIRA-0000'
      },
      {
        a: 'JIRA-3333',
        type: 'split_from',
        b: 'JIRA-0000'
      },
      {
        a: 'JIRA-3333',
        type: 'relates',
        b: 'JIRA-1111'
      },
      {
        a: 'JIRA-3333',
        type: 'blocked_by',
        b: 'JIRA-2222'
      }
    ])
  })

  it('addHierarchicalIssueSplitLinks', () => {
    expect(addHierarchicalIssueSplitLinks({
      epics: [
        {
          ref: 'main_epic',
          stories: [
            {
              ref: 'main_story',
              tasks: [
                {
                  ref: 'main_task'
                }
              ]
            }
          ]
        }
      ],
      stories: [
        {
          ref: 'second_story',
          tasks: [
            {
              ref: 'second_task'
            }
          ]
        }
      ]
    })).deep.to.eq(
      {
        epics: [
          {
            ref: 'main_epic',
            stories: [
              {
                ref: 'main_story',
                links: [
                  { split_from: 'main_epic' }
                ],
                tasks: [
                  {
                    ref: 'main_task',
                    links: [
                      { split_from: 'main_story' }
                    ]
                  }
                ]
              }
            ]
          }
        ],

        stories: [
          {
            ref: 'second_story',
            tasks: [
              {
                ref: 'second_task',
                links: [
                  { split_from: 'second_story' }
                ]
              }
            ]
          }
        ]
      }
    )
  })

  it('canCreateIssueLinkRequestsFields', () => {
    expect(JSON.stringify(getIssueLinkRequestsFields([
      {
        a: 'JIRA-1111',
        type: 'split_from',
        b: 'JIRA-0000'
      },
      {
        a: 'JIRA-2222',
        type: 'split_from',
        b: 'JIRA-0000'
      },
      {
        a: 'JIRA-2222',
        type: 'blocked_by',
        b: 'JIRA-0000'
      },
      {
        a: 'JIRA-3333',
        type: 'split_from',
        b: 'JIRA-0000'
      },
      {
        a: 'JIRA-3333',
        type: 'relates_to',
        b: 'JIRA-1111'
      },
      {
        a: 'JIRA-3333',
        type: 'blocked_by',
        b: 'JIRA-2222'
      }
    ]))).deep.to.eq(JSON.stringify([
      {
        key: 'JIRA-0000',
        update: {
          issuelinks: [
            {
              add: {
                type: {
                  name: 'Issue split',
                  inward: 'split from',
                  outward: 'split to'
                },
                outwardIssue: {
                  key: 'JIRA-1111'
                }
              }
            }
          ]
        }
      },
      {
        key: 'JIRA-0000',
        update: {
          issuelinks: [
            {
              add: {
                type: {
                  name: 'Issue split',
                  inward: 'split from',
                  outward: 'split to'
                },
                outwardIssue: {
                  key: 'JIRA-2222'
                }
              }
            }
          ]
        }
      },
      {
        key: 'JIRA-0000',
        update: {
          issuelinks: [
            {
              add: {
                type: {
                  name: 'Blocks',
                  inward: 'is blocked by',
                  outward: 'blocks'
                },
                outwardIssue: {
                  key: 'JIRA-2222'
                }
              }
            }
          ]
        }
      },
      {
        key: 'JIRA-0000',
        update: {
          issuelinks: [
            {
              add: {
                type: {
                  name: 'Issue split',
                  inward: 'split from',
                  outward: 'split to'
                },
                outwardIssue: {
                  key: 'JIRA-3333'
                }
              }
            }
          ]
        }
      },
      {
        key: 'JIRA-3333',
        update: {
          issuelinks: [
            {
              add: {
                type: {
                  name: 'Relates',
                  inward: 'relates to',
                  outward: 'relates to'
                },
                outwardIssue: {
                  key: 'JIRA-1111'
                }
              }
            }
          ]
        }
      },
      {
        key: 'JIRA-2222',
        update: {
          issuelinks: [
            {
              add: {
                type: {
                  name: 'Blocks',
                  inward: 'is blocked by',
                  outward: 'blocks'
                },
                outwardIssue: {
                  key: 'JIRA-3333'
                }
              }
            }
          ]
        }
      }
    ]))
  })
})
