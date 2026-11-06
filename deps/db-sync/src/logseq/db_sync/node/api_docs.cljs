(ns logseq.db-sync.node.api-docs
  (:require ["node:fs" :as fs]
            [clojure.string :as string]
            [logseq.db-sync.worker.routes.semantic :as semantic-routes]))

(defn ^:export main []
  (let [origin (string/replace
                (or (not-empty (aget js/process.env "DB_SYNC_BASE_URL"))
                    "https://api.logseq.io")
                #"/+$" "")
        document (semantic-routes/openapi-document origin)]
    (.mkdirSync fs "worker/dist" #js {:recursive true})
    (.writeFileSync fs "worker/dist/openapi.json"
                    (js/JSON.stringify (clj->js document) nil 2))))
