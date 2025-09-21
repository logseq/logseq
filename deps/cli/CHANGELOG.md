## 0.2.0
* Add export command to export graph as markdown
* Add append command to add text to current page
* Change export-edn command to default to writing to a file, like the export command
* Rename --api-query-token options to --api-server-token
* API related commands can also authenticate with $LOGSEQ_API_SERVER_TOKEN
* Add descriptions for most commands to explain in-depth usage

## 0.1.0

* Initial release!
* Provides commands: list, show, search, query, export-edn and help
* All commands work offline. search and query have options for calling HTTP API Server of
  open desktop Logseq app
