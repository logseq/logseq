(ns electron.server-invoke
  "One-shot IPC wait used by the desktop HTTP API.
  Isolated so the timeout contract can be tested without loading Electron."
  (:require [promesa.core :as p]))

(def invoke-timeout-ms
  "Fail fast if the renderer never replies. Fastify requestTimeout only
  covers receiving the request body, not this IPC round-trip."
  30000)

(defn api-invoke-timeout?
  [error]
  (= :api-invoke-timeout (:type (ex-data error))))

(defn timeout-error
  []
  (ex-info "Logseq API invoke timed out"
           {:type :api-invoke-timeout
            :status 504}))

(defn await-ipc-reply!
  "Wait for a one-shot IPC reply. Rejects with `timeout-error` if the
  renderer never answers. `handle-once!` and `remove-handler!` are
  injected so tests can exercise the contract without ipcMain."
  [{:keys [channel handle-once! remove-handler! timeout-ms]
    :or {timeout-ms invoke-timeout-ms}}]
  (p/create
   (fn [resolve reject]
     (let [settled? (atom false)
           *timer (atom nil)
           finish! (fn [cb value]
                     (when (compare-and-set! settled? false true)
                       (when-let [timer @*timer]
                         (js/clearTimeout timer))
                       (cb value)))]
       (reset! *timer
               (js/setTimeout
                (fn []
                  (when remove-handler!
                    (remove-handler! channel))
                  (finish! reject (timeout-error)))
                timeout-ms))
       (handle-once! channel
                     (fn [_event ret]
                       (finish! resolve ret)))))))
