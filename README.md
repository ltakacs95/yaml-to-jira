# yaml-to-jira

> Create JIRA Issues using the REST API from YAML.

It takes time to write a good description for a JIRA task. If I loose focus of the tab, where I started creating ticket, all my work is gone.
When writing these tickets in yaml, I can use my favorite text editor or IDE and send off the tickets to jira together.

Furthermore, I can even link together issues before they are created.

## Usage

```shell
cat tickets.yml | y2j piped example-jira myUser myPassword
```

```yml
#tickets.yml
tasks:
  - component: example.com
    type: Task
    sprint: NEXT
    summary: another Todo
    assignee: username
    estimate: 4h
    ref: temporary-handle
    description:
      current situation: >-
        description of current situation
      requested situation: requested situation description
      notes: additional notes
  - component: example.com
    type: Bug
    sprint: NEXT
    summary: 500 instead of 404 on missing pages
    ref: 500
    description:
      current situation: >-
        500 status code on missing page
      requested situation: 404 status code on missing page
      notes: Test first.
```

See [cypress/fixtures](https://github.com/ltakacs95/yaml-to-jira/tree/main/cypress/fixtures) for more examples.

## Usage with npx

With [npm](https://npmjs.org/) installed, run

```
$ npx y2j --help
```

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install --global yaml-to-jira
```

## License

MIT

