(ns logseq.cli.version
  "Build metadata for logseq-cli.")

(goog-define BUILD_TIME "unknown")
(goog-define REVISION "dev")

(defn format-version
  []
  (str "Build time: " BUILD_TIME "\n"
       "Revision: " REVISION))
