(ns frontend.worker.db-worker
  "Browser worker entrypoint."
  (:require ["comlink" :as Comlink]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.platform.browser :as platform-browser]
            [frontend.worker.state :as worker-state]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(.importScripts js/self "worker.js")

(defn- check-worker-scope!
  []
  (when (or (gobj/get js/self "React")
            (gobj/get js/self "module$react"))
    (throw (js/Error. "[db-worker] React is forbidden in worker scope!"))))

(defn init
  "web worker entry"
  []
  (let [platform (platform-browser/browser-platform)
        proxy-object (db-core/init-core! platform)]
    (glogi-console/install!)
    (log/set-levels {:glogi/root :info})
    (log/add-handler worker-state/log-append!)
    (check-worker-scope!)
    ((get-in platform [:timers :set-interval!])
     #(.postMessage js/self "keepAliveResponse")
     (* 1000 25))
    (Comlink/expose proxy-object)
    (let [^js wrapped-main-thread* (Comlink/wrap js/self)
          wrapped-main-thread (fn [qkw direct-pass? & args]
                                (p/let [result (.remoteInvoke wrapped-main-thread*
                                                              (str (namespace qkw) "/" (name qkw))
                                                              direct-pass?
                                                              (if direct-pass?
                                                                (into-array args)
                                                                (ldb/write-transit-str args)))]
                                  (if direct-pass?
                                    result
                                    (ldb/read-transit-str result))))]
      (reset! worker-state/*main-thread wrapped-main-thread))))
