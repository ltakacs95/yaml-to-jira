# Supported Fields 
## project *root*
This should be defined at root level, not as part of a ticket

## summary
In yaml specified as `summary` in a context of a task/story/epic.

## component (optional)
Component is prepended in front of summary divided by ` - `.

If used on story, all task will receive this value (if not overwritten)

If used on epic, all stories ( and tasks ) will receive this value (if not overwritten)

## prepend (optional)
Prepend is prepended in front of summary (or component is present) divided by ` - `.

If used on story, all task will receive this value (if not overwritten)

If used on epic, all stories ( and tasks ) will receive this value (if not overwritten)

## type (optional)
If you provide this string, it will be set as the name of the issue type. Default: `Task`

## assignee (optional)
If you provide this string, it will be set as the name of the assignee

## description (optional)
Description can be a simple string or an YAML Object with headings. If you provide a YAML Object the headings will be bold.

## estimate (optional)
If you provide estime field, timetracking will also be set when creating the issue. original and remaining time estimates will be the same at this point.

## sprint (optional)
Name of the Sprint the Ticket should be added to. By default, the ticket won't be added to a sprint.

### boardId *root* (required with sprint)
This should be defined at root level, not as part of a ticket.

This is the board id the used sprints belong to.

### sprintField *root* (required with sprint)
This should be defined at root level, not as part of a ticket.

This is the customfield name how your JIRA saves Sprints, (example: `customfield_10015˙)

# Examples

See [cypress/fixtures](https://github.com/ltakacs95/yaml-to-jira/tree/main/cypress/fixtures) for more examples.
