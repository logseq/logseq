(ns frontend.worker.sync.upload-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.upload :as sync-upload]
            [promesa.core :as p]
            [clojure.string :as string]))

(deftest split-snapshot-rows-by-max-bytes-splits-rows-into-byte-capped-batches-test
  (let [sizes {:a 4
               :b 4
               :c 4
               :d 4}
        rows [[:a] [:b] [:c] [:d]]]
    (with-redefs [sync-upload/snapshot-rows-byte-length
                  (fn [rows']
                    (reduce + (map (fn [[addr]] (get sizes addr 0)) rows')))]
      (is (= [[[:a] [:b]]
              [[:c] [:d]]]
             (#'sync-upload/split-snapshot-rows-by-max-bytes rows 8))))))

(deftest split-snapshot-rows-by-max-bytes-fails-fast-for-oversized-single-row-test
  (let [sizes {:ok 3
               :too-big 11}
        rows [[:ok] [:too-big]]]
    (with-redefs [sync-upload/snapshot-rows-byte-length
                  (fn [rows']
                    (reduce + (map (fn [[addr]] (get sizes addr 0)) rows')))]
      (try
        (#'sync-upload/split-snapshot-rows-by-max-bytes rows 10)
        (is false "expected snapshot row too large error")
        (catch :default error
          (let [data (ex-data error)]
            (is (= "snapshot-row-too-large" (ex-message error)))
            (is (= 10 (:max-bytes data)))
            (is (= 11 (:row-size data)))
            (is (= :too-big (:addr data)))))))))

(deftest upload-snapshot-rows-batches-sets-reset-and-finished-flags-correctly-test
  (async done
         (let [calls* (atom [])
               rows-batches [[[1 "a" nil]]
                            [[2 "b" nil]]
                            [[3 "c" nil]]]]
           (-> (p/with-redefs [sync-upload/<snapshot-upload-body
                               (fn [rows]
                                 (p/resolved {:body rows
                                              :encoding nil}))]
                 (#'sync-upload/<upload-snapshot-rows-batches!
                  rows-batches
                  {:base "https://sync.example.test"
                   :graph-id "graph-1"
                   :first-batch? true
                   :finished? true
                   :checksum "abc+123="
                   :auth-fetch-f
                   (fn [url headers body]
                     (swap! calls* conj {:url url
                                         :headers headers
                                         :body body})
                     (p/resolved true))}))
               (p/then
                (fn [_]
                  (is (= 3 (count @calls*)))
                  (is (string/includes? (:url (nth @calls* 0)) "reset=true"))
                  (is (string/includes? (:url (nth @calls* 0)) "finished=false"))
                  (is (string/includes? (:url (nth @calls* 1)) "reset=false"))
                  (is (string/includes? (:url (nth @calls* 1)) "finished=false"))
                  (is (string/includes? (:url (nth @calls* 2)) "reset=false"))
                  (is (string/includes? (:url (nth @calls* 2)) "finished=true"))
                  (is (string/includes? (:url (nth @calls* 2)) "checksum=abc%2B123%3D"))
                  (done)))
               (p/catch
                (fn [error]
                  (is false (str error))
                  (done)))))))

(deftest drop-oversized-upload-datoms-drops-large-tldraw-page-values-test
  (let [datoms [{:e 1 :a :block/title :v "safe"}
                {:e 2 :a :logseq.property.tldraw/page :v {:id "small"}}
                {:e 3 :a :logseq.property.tldraw/page :v {:id "huge"}}]]
    (with-redefs [sync-upload/datom-value-byte-length
                  (fn [value]
                    (case (:id value)
                      "small" 32
                      "huge" 1500000
                      0))]
      (let [{:keys [kept dropped]} (#'sync-upload/drop-oversized-upload-datoms datoms)]
        (is (= 2 (count kept)))
        (is (= [1 2] (mapv :e kept)))
        (is (= 1 (count dropped)))
        (is (= {:a :logseq.property.tldraw/page
                :e 3
                :bytes 1500000}
               (first dropped)))))))

(deftest create-remote-graph-creates-new-remote-graph-when-no-remote-match-test
  (async done
         (let [calls* (atom [])]
           (-> (p/with-redefs [sync-crypt/<preflight-upload-e2ee! (fn [_repo graph-e2ee?]
                                                                    (swap! calls* conj [:preflight graph-e2ee?])
                                                                    (p/resolved nil))
                               sync-upload/list-remote-graphs! (fn []
                                                                  (swap! calls* conj [:list-remote-graphs])
                                                                  (p/resolved []))
                               sync-upload/<create-remote-graph-aux! (fn [repo opts]
                                                                       (swap! calls* conj [:create-aux repo opts])
                                                                       (p/resolved {:graph-id "new-graph-id"
                                                                                    :graph-e2ee? (:graph-e2ee? opts)}))]
                 (sync-upload/create-remote-graph! "repo-1" {:graph-e2ee? true
                                                              :graph-ready-for-use? false}))
               (p/then (fn [identity]
                         (is (= {:graph-id "new-graph-id" :graph-e2ee? true}
                                identity))
                         (is (= [[:list-remote-graphs]
                                 [:preflight true]
                                 [:create-aux "repo-1" {:graph-e2ee? true
                                                        :graph-ready-for-use? false}]]
                                @calls*))))
               (p/catch (fn [error]
                          (is false (str "unexpected error: " error))))
               (p/finally done)))))

(deftest create-remote-graph-rejects-matching-remote-graph-test
  (async done
         (let [create-aux-called? (atom false)]
           (-> (p/with-redefs [sync-crypt/<preflight-upload-e2ee! (fn [_repo _graph-e2ee?]
                                                                    (p/resolved nil))
                               sync-upload/list-remote-graphs! (fn []
                                                                  (p/resolved [{:graph-name "repo-1"}]))
                               sync-upload/<create-remote-graph-aux! (fn [_repo _opts]
                                                                       (reset! create-aux-called? true)
                                                                       (p/resolved {:graph-id "new-graph-id"}))]
                 (sync-upload/create-remote-graph! "repo-1" {:graph-e2ee? true
                                                              :graph-ready-for-use? false}))
               (p/then (fn [_]
                         (is false "expected graph-already-exists error")))
               (p/catch (fn [error]
                          (is (= "remote graph already exists; delete it before uploading again"
                                 (ex-message error)))
                          (is (= :db-sync/graph-already-exists (:code (ex-data error))))
                          (is (= "repo-1" (:graph-name (ex-data error))))
                          (is (false? @create-aux-called?))))
               (p/finally done)))))

(deftest create-remote-graph-missing-e2ee-password-does-not-create-remote-graph-test
  (async done
         (let [calls* (atom [])]
           (-> (p/with-redefs [sync-upload/list-remote-graphs! (fn []
                                                                  (swap! calls* conj :list-remote-graphs)
                                                                  (p/resolved []))
                               sync-crypt/<preflight-upload-e2ee! (fn [_repo _graph-e2ee?]
                                                                    (swap! calls* conj :preflight)
                                                                    (p/rejected (ex-info "missing-e2ee-password"
                                                                                         {:code :db-sync/missing-e2ee-password
                                                                                          :field :e2ee-password
                                                                                          :reason :missing-persisted-password
                                                                                          :hint "Provide --e2ee-password to persist it."})))
                               sync-upload/<create-remote-graph-aux! (fn [_repo _opts]
                                                                       (swap! calls* conj :create-remote-graph)
                                                                       (p/resolved {:graph-id "new-graph-id"}))]
                 (sync-upload/create-remote-graph! "repo-1" {:graph-e2ee? true
                                                              :graph-ready-for-use? false}))
               (p/then (fn [_]
                         (is false "expected missing e2ee password error")))
               (p/catch (fn [error]
                          (is (= "missing-e2ee-password" (ex-message error)))
                          (is (= :db-sync/missing-e2ee-password (:code (ex-data error))))
                          (is (= [:list-remote-graphs :preflight] @calls*))))
               (p/finally done)))))

(deftest create-remote-graph-missing-e2ee-password-does-not-run-create-aux-test
  (async done
         (let [create-aux-called? (atom false)]
           (-> (p/with-redefs [sync-upload/list-remote-graphs! (fn [] (p/resolved []))
                               sync-crypt/<preflight-upload-e2ee! (fn [_repo _graph-e2ee?]
                                                                    (p/rejected (ex-info "missing-e2ee-password"
                                                                                         {:code :db-sync/missing-e2ee-password})))
                               sync-upload/<create-remote-graph-aux! (fn [_repo _opts]
                                                                       (reset! create-aux-called? true)
                                                                       (p/resolved {:graph-id "new-graph-id"}))]
                 (sync-upload/create-remote-graph! "repo-1" {:graph-e2ee? true
                                                              :graph-ready-for-use? false}))
               (p/then (fn [_]
                         (is false "expected missing e2ee password error")))
               (p/catch (fn [_error]
                          (is (false? @create-aux-called?))))
               (p/finally done)))))
