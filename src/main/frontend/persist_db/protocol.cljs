(ns frontend.persist-db.protocol
  "Provides protocol for persisting db")

(defprotocol PersistentDB
  (<list-db [this] "List all databases")
  (<new [this repo opts] "Create or open a graph")
  (<unsafe-delete [this repo] "Delete graph and its vfs")
  (<release-access-handles [this repo] "Release access file handles")
  (<fetch-initial-data [this repo opts] "Fetch Initial data")
  (<export-db [this repo opts] "Save or get SQLite db")
  (<import-db [this repo data] "Import SQLite db"))
