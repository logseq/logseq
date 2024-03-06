(ns logseq.db.frontend.class
  "Class related fns for DB graphs and frontend/datascript usage")

;; TODO: disable name changes for those built-in page/class names and their properties names
(def ^:large-vars/data-var built-in-classes
  {:task {:original-name "Task"
          :schema {:properties ["status" "priority"]}}
   :card {:original-name "card"
          ;; :schema {:property []}
          }
   ;; TODO: Add more classes such as :book, :paper, :movie, :music, :project
   })
