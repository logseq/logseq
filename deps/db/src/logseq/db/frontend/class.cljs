(ns logseq.db.frontend.class
  "Class related fns for DB graphs and frontend/datascript usage")

(def ^:large-vars/data-var built-in-classes
  {:task {:original-name "Task"
          :schema {:properties ["status" "priority"]}}
   ;; TODO: Add more classes such as :book, :paper, :movie, :music, :project
   })
