(ns logseq.db-sync.node.api-docs
  (:require ["node:fs" :as fs]
            [logseq.db-sync.worker.routes.semantic :as semantic-routes]))

(defn main []
  (let [issuer (or (aget js/process.env "COGNITO_ISSUER") "")
        document (semantic-routes/openapi-document issuer)]
    (.mkdirSync fs "worker/dist" #js {:recursive true})
    (.writeFileSync fs "worker/dist/openapi.json"
                    (js/JSON.stringify (clj->js document) nil 2))))
