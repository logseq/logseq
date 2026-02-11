(ns logseq.db-sync.worker.agent.request)

(defn normalize-session-create
  [body]
  (when (map? body)
    (let [attachments (:attachments body)
          attachments (when (sequential? attachments) (vec attachments))
          capabilities (if (map? (:capabilities body))
                         (:capabilities body)
                         {})
          capabilities (merge {:push-enabled true
                               :pr-enabled true}
                              (select-keys capabilities [:push-enabled :pr-enabled]))]
      (cond-> {:id (:session-id body)
               :source {:node-id (:node-id body)
                        :node-title (:node-title body)}
               :intent {:content (:content body)}
               :project (:project body)
               :agent (:agent body)
               :capabilities capabilities}
        (some? attachments) (assoc-in [:intent :attachments] attachments)))))
