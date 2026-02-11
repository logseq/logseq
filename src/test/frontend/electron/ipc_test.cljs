(ns frontend.electron.ipc-test
  (:require [cljs.test :refer [async deftest is]]
            [electron.ipc :as ipc]
            [frontend.util :as util]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(deftest ipc-uses-transit-json-for-main-channel
  (async done
    (let [payloads (atom [])
          original-electron? util/electron?
          original-apis (.-apis js/window)]
      (set! util/electron? (constantly true))
      (set! (.-apis js/window)
            #js {:doAction (fn [payload]
                             (swap! payloads conj payload)
                             (js/Promise.resolve (sqlite-util/write-transit-str {:ok true})))})
      (-> (p/let [result (ipc/ipc :db-worker-runtime "logseq_db_graph_a")]
            (is (= 1 (count @payloads)))
            (is (string? (first @payloads)))
            (is (= [:db-worker-runtime "logseq_db_graph_a"]
                   (vec (sqlite-util/read-transit-str (first @payloads)))))
            (is (= {:ok true} result)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! util/electron? original-electron?)
                       (set! (.-apis js/window) original-apis)
                       (done)))))))

(deftest ipc-keeps-non-string-response-unchanged
  (async done
    (let [original-electron? util/electron?
          original-apis (.-apis js/window)]
      (set! util/electron? (constantly true))
      (set! (.-apis js/window)
            #js {:doAction (fn [_payload]
                             (js/Promise.resolve #js {:legacy true}))})
      (-> (p/let [result (ipc/ipc :system/info)]
            (is (= true (aget result "legacy"))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! util/electron? original-electron?)
                       (set! (.-apis js/window) original-apis)
                       (done)))))))
