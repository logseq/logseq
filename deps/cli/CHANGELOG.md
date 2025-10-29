## 0.3.0
* Add mcp-server command to run a MCP server
* All commands that have graph args and options now support local paths e.g. `logseq search $HOME/Downloads/logseq_db_yep_1751032977.sqlite foo`
* Fix: Unexpected errors don't exit with 1

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
