(ns logseq.agents.dispatch
  (:require [clojure.string :as string]
            [logseq.sync.common :as common]
            [logseq.sync.platform.core :as platform]
            [logseq.agents.handler :as agent-handler]
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

         (string/starts-with? path "/sessions")
         (agent-handler/handle-fetch #js {:env env} request)

         (= method "OPTIONS")
         (common/options-response)

         :else
         (http/not-found))))
   (p/catch (fn [error]
              (let [err-type (str (type error))
                    message (try (.-message error) (catch :default _ nil))
                    data (try (ex-data error) (catch :default _ nil))
                    stack (try (.-stack error) (catch :default _ nil))
                    json-str (try (js/JSON.stringify error) (catch :default _ nil))]
                (common/json-response
                 {:error "agents dispatch error"
                  :debug-type err-type
                  :debug-message message
                  :debug-data (when data (pr-str data))
                  :debug-json json-str
                  :debug-stack stack}
                 500))))))
