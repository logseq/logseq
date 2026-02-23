## 0.4.3
* Add `--roundtrip` option to `export-edn` command
* Fix `list` command to only display DB graphs
* Fix `validate` command not working with latest schema

## 0.4.2
* Add `--help` to all commands as an alternative to `help [command]`
* Add `--validate` option to `export-edn` command
* Fix cli can't run in CI environments
* Fix `import-edn` and `mcp-server` commands not building refs for new or edited nodes

## 0.4.1
* Add `--open-schema` option to `validate` command
* Fix `append` command fails
* Fix `import-edn` command hangs on unexpected errors

## 0.4.0
* BREAKING CHANGE: Commands that call local graphs are invoked with `-g` instead of as an argument e.g. `logseq search foo -g db-name` instead of `logseq search db-name foo`
* Add `import-edn` command for local and in-app graphs
* Add `validate` command for local graphs
* Add `export-edn` command for API mode
* Fix most commands with API mode not respecting `$LOGSEQ_API_SERVER_TOKEN`
* Fix API `mcp-server` command failing lazily
* Fix commands failing confusingly when given a file graph
* Fix `query` command with multiple local graphs not switching graphs
* Fix API `search` command

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
