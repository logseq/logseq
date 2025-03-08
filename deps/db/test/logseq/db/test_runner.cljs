(ns logseq.db.test-runner
  "Test runner which enables https://github.com/PEZ/baldr by default"
  (:require [nextjournal.test-runner :as next-runner]
            [pez.baldr]))

(def -main next-runner/-main)
