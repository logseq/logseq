(ns logseq.cli.version
  "Build metadata for logseq-cli.")

(goog-define BUILD_TIME "unknown")
(goog-define REVISION "dev")

(defn build-time
  []
  BUILD_TIME)

(defn revision
  []
  REVISION)

(defn format-version
  []
  (str "Build time: " (build-time) "\n"
       "Revision: " (revision)))
