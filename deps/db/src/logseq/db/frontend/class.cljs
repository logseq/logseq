(ns logseq.db.frontend.class
  "Class related fns for DB graphs and frontend/datascript usage")

(def ^:large-vars/data-var built-in-classes
  "Map of built-in classes for db graphs with their :db/ident as keys"
  {:logseq.class/Root {:original-name "Root class"}

   :logseq.class/task
   {:original-name "Task"
    :schema {:properties [:logseq.task/status :logseq.task/priority :logseq.task/scheduled :logseq.task/deadline]}}

   :logseq.class/card {:original-name "card"
                       ;; :schema {:property []}
                       }
   ;; TODO: Add more classes such as :book, :paper, :movie, :music, :project
   })
