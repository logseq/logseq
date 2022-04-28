(ns frontend.modules.rtc.yjs-test
  (:require [cljs.test :refer [deftest is use-fixtures testing async] :as test]
            [clojure.test.check.generators :as gen]
            [frontend.test.fixtures :as fixtures]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.test.helper :as helper]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.modules.outliner.core-test :as outliner-core-test]
            [frontend.modules.crdt.yjs :as yjs]
            ["yjs" :as y]
            ["fs-extra" :as fs]
            ["ws" :as ws]
            [cljs.core.async :as async :refer [go <! timeout]]
            [promesa.core :as p]
            [clojure.string :as string]))

;; How to run this test? (TODO: bb script)
;; 1. Start y-websocket
;;    HOST=localhost PORT=1234 npx y-websocket
;; 2. Run this specific test
;;    node static/tests.js --namespace frontend.modules.rtc.yjs-test
;; 3. In the meantime, run another test with the same command to simulate
;;    concurrent clients.

(def test-db helper/test-db)

;; Both not exist on the nodejs environment
(js/Object.assign js/global #js {:WebSocket ws})
(js/Object.assign js/window #js {:addEventListener (fn [_])})

(defn- write-ydoc-json!
  [id state]
  (let [doc (new yjs/YDoc)
        _ (y/applyUpdate doc state)
        m (.getMap doc test-db)]
    (fs/writeFileSync (str "/tmp/yjs/" id ".json") (js/JSON.stringify (.toJSON m)))))

(deftest random-mixed-ops
  (testing "RTC random mixed operations"
    (async done
           (let [id (str (random-uuid))]
             (go
              (try
                (when (fs/statSync "/tmp/yjs")
                  (fs/rmdirSync "/tmp/yjs" #js {:recursive true}))
                (catch :default e
                  nil))
              (fixtures/reset-datascript test-db)
              (yjs/debug-sync! test-db)
              (outliner-core-test/transact-random-tree!)
              (let [*random-count (atom 0)
                    c1 (outliner-core-test/get-blocks-count)
                    ops [
                         ;; insert
                         (fn []
                           (let [blocks (outliner-core-test/gen-blocks)]
                             (swap! *random-count + (count blocks))
                             (outliner-core-test/insert-blocks! blocks (outliner-core-test/get-random-block))))

                         ;; delete
                         (fn []
                           (let [blocks (outliner-core-test/get-random-successive-blocks)]
                             (when (seq blocks)
                               (swap! *random-count - (count blocks))
                               (outliner-tx/transact! {:graph test-db}
                                 (outliner-core/delete-blocks! blocks {})))))

                         ;; move
                         (fn []
                           (let [blocks (outliner-core-test/get-random-successive-blocks)]
                             (when (seq blocks)
                               (outliner-tx/transact! {:graph test-db}
                                 (outliner-core/move-blocks! blocks (outliner-core-test/get-random-block) (gen/generate gen/boolean))))))

                         ;; move up down
                         (fn []
                           (let [blocks (outliner-core-test/get-random-successive-blocks)]
                             (when (seq blocks)
                               (outliner-tx/transact! {:graph test-db}
                                 (outliner-core/move-blocks-up-down! blocks (gen/generate gen/boolean))))))

                         ;; indent outdent
                         (fn []
                           (let [blocks (outliner-core-test/get-random-successive-blocks)]
                             (when (seq blocks)
                               (outliner-tx/transact! {:graph test-db}
                                 (outliner-core/indent-outdent-blocks! blocks (gen/generate gen/boolean))))))]
                    ]
                (dotimes [_i 1000]
                  ((rand-nth ops)))

                (let [
                      total (outliner-core-test/get-blocks-count)
                      page-id 1
                      path (str "/tmp/yjs/" id ".data")]

                  ;; Invariants:

                  ;; ;; 1. created blocks length >= existing blocks + deleted top-level blocks
                  (is (<= total (+ c1 @*random-count)))

                  ;; ;; 2. verify page's length + page itself = total blocks
                  ;; (is (= (inc (db-model/get-page-blocks-count test-db page-id))
                  ;;        total))

                  ;; 3. verify the outliner parent/left structure
                  (is (= (inc (count (db-model/get-paginated-blocks test-db page-id {:limit total
                                                                                     :use-cache? false})))
                         total))

                  (fs/ensureDirSync "/tmp/yjs")

                  (<! (timeout 15000))

                  (let [doc (yjs/get-local-doc test-db)
                        binary (yjs/doc->binary doc)]
                    (write-ydoc-json! id binary))

                  (<! (timeout 15000))

                  ;; check whether json equals
                  (let [files (->> (fs/readdirSync "/tmp/yjs")
                                   (filter #(string/ends-with? % ".json")))
                        contents (map #(.toString (fs/readFileSync (str "/tmp/yjs/" %))) files)]
                    (println "Size: " (map count contents))
                    (assert (every? #(= (first contents) %) contents) (str "y.js JSON not matched: /tmp/yjs/" files)))

                  (done))))))))
