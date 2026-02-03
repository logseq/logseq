(ns logseq.db-sync.worker.agent.request)

(defn normalize-session-create
  [body]
  (when (map? body)
    (let [attachments (:attachments body)
          attachments (when (sequential? attachments) (vec attachments))]
      (cond-> {:id (:session-id body)
               :source {:node-id (:node-id body)
                        :node-title (:node-title body)}
               :intent {:content (:content body)}
               :project (:project body)
               :agent (:agent body)}
        (some? attachments) (assoc-in [:intent :attachments] attachments)))))
