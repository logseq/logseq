(ns logseq.agents.dispatch
  (:require [clojure.string :as string]
            [logseq.agents.handler :as agent-handler]
            [logseq.sync.common :as common]
            [logseq.sync.platform.core :as platform]
            [logseq.sync.worker.http :as http]
            [promesa.core :as p]))

(defn handle-worker-fetch [request ^js env]
  (->
   (p/do
     (let [url (platform/request-url request)
           path (.-pathname url)
           method (.-method request)]
       (cond
         (= path "/health")
         (http/json-response :worker/health {:ok true})

         (or (string/starts-with? path "/auth")
             (string/starts-with? path "/planning")
             (string/starts-with? path "/sessions")
             (string/starts-with? path "/runners"))
         (agent-handler/handle-fetch #js {:env env} request)

         (= method "OPTIONS")
         (common/options-response)

         :else
         (http/not-found))))
   (p/catch (fn [error]
              ;; Avoid deep error introspection here. Some V8/runtime failures can
              ;; abort the process while materializing stack/JSON from optimized frames.
              (let [message (try (.-message error) (catch :default _ nil))
                    data (try (ex-data error) (catch :default _ nil))]
                (common/json-response
                 {:error "agents dispatch error"
                  :debug-message (or message (str error))
                  :debug-data (when data (pr-str data))}
                 500))))))
