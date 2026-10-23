(ns frontend.worker.sync.large-title-mutation-test
  "Cases of frontend.worker.sync.large-title that no other test checks: a
   change to any of these lines left every test passing."
  (:require [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.sync.large-title :as large-title]
            [logseq.db.test.helper :as db-test]
            [promesa.core :as p]))

;; Fails if, in `large-title?`, `>` becomes `>=`.
(deftest large-title-is-strictly-over-the-byte-limit
  (is (false? (large-title/large-title? (apply str (repeat large-title/large-title-byte-limit "a")))))
  (is (true? (large-title/large-title? (apply str (repeat (inc large-title/large-title-byte-limit) "a"))))))

;; Fails if, in `large-title-object?`, `and` becomes `or`.
(deftest large-title-object-needs-both-fields
  (is (true? (large-title/large-title-object? {:asset-uuid "u" :asset-type "txt"})))
  (is (false? (large-title/large-title-object? {:asset-uuid "u"})))
  (is (false? (large-title/large-title-object? {:asset-type "txt"}))))

(def ^:private repo "large-title-mutation-test-repo")

(defn- recording-fail-fast
  [*calls]
  (fn [k data]
    (swap! *calls conj [k (:field data)])
    (throw (ex-info "fail-fast" {:k k :field (:field data)}))))

(defn- upload!
  "upload-large-title! with recorded fail-fast calls; resolves to
   {:result ..} or {:error ..} plus :fail-fasts and :urls."
  [opts]
  (let [*fail-fasts (atom [])
        *urls (atom [])
        fetch-prev js/fetch]
    (set! js/fetch (fn [url _opts]
                     (swap! *urls conj url)
                     (js/Promise.resolve #js {:ok true})))
    (-> (p/let [result (try
                         (large-title/upload-large-title!
                          (merge {:repo repo
                                  :graph-id "graph-1"
                                  :title "big title"
                                  :http-base "https://example.com"
                                  :fail-fast-f (recording-fail-fast *fail-fasts)}
                                 opts))
                         (catch :default e (p/rejected e)))]
          {:result result})
        (p/catch (fn [e] {:error e}))
        (p/then (fn [m] (assoc m :fail-fasts @*fail-fasts :urls @*urls)))
        (p/finally (fn [] (set! js/fetch fetch-prev))))))

;; Fails if, in `upload-large-title!`, `when-not` becomes `when` or `seq` becomes `empty?`.
(deftest upload-large-title-checks-http-base-and-graph-id
  (async done
         (-> (p/let [ok (upload! {})
                     no-base (upload! {:http-base ""})
                     no-graph (upload! {:graph-id nil})]
               (testing "both given: uploads, no fail-fast"
                 (is (= [] (:fail-fasts ok)))
                 (is (= "txt" (:asset-type (:result ok))))
                 (is (= 1 (count (:urls ok)))))
               (testing "an empty http base fails fast on that field"
                 (is (= [[:db-sync/missing-field :http-base]] (:fail-fasts no-base)))
                 (is (some? (:error no-base))))
               (testing "a missing graph id fails fast on that field"
                 (is (= [[:db-sync/missing-field :graph-id]] (:fail-fasts no-graph)))
                 (is (some? (:error no-graph)))))
             (p/catch (fn [e] (is (nil? e))))
             (p/finally done))))

(def ^:private title-obj {:asset-uuid "title-obj-1" :asset-type "txt"})

(def ^:private base-db
  (delay @(db-test/create-conn-with-blocks
           {:pages-and-blocks [{:page {:block/title "large title page"}
                                :blocks [{:block/title "large title block"}]}]})))

(defn- conn-and-eid
  "A fresh conn on the shared db and the block's db id; the block holds an
   offloaded title (empty title plus the object) when `stored-object?`."
  [stored-object?]
  (let [conn (d/conn-from-db @base-db)
        eid (:db/id (db-test/find-block-by-content @conn "large title block"))]
    (when stored-object?
      (d/transact! conn [[:db/add eid :block/title ""]
                         [:db/add eid large-title/large-title-object-attr title-obj]]))
    [conn eid]))

(defn- rehydrate!
  "rehydrate-large-titles! with recording fns; resolves to {:returned? ..
   :error .. :downloads [{:graph-id :aes-key}] :fail-fasts [..] :title ..}."
  [conn eid opts]
  (let [*downloads (atom [])
        *fail-fasts (atom [])
        opts' (merge {:graph-id "graph-1"
                      :download-fn (fn [_repo graph-id _obj aes-key]
                                     (swap! *downloads conj {:graph-id graph-id :aes-key aes-key})
                                     (p/resolved "rehydrated title"))
                      :graph-e2ee?-f (constantly false)
                      :ensure-graph-aes-key-f (fn [_repo _graph-id] (p/resolved "ensured-key"))
                      :fail-fast-f (recording-fail-fast *fail-fasts)}
                     opts)
        result (try (large-title/rehydrate-large-titles! repo opts')
                    (catch :default e (p/rejected e)))]
    (-> (p/let [_ result]
          {:returned? (some? result)})
        (p/catch (fn [e] {:error e}))
        (p/then (fn [m]
                  (assoc m
                         :downloads @*downloads
                         :fail-fasts @*fail-fasts
                         :title (:block/title (d/entity @conn eid))))))))

(defn- object-tx
  [eid]
  [[:db/add eid large-title/large-title-object-attr title-obj]])

;; Fails if, in `rehydrate-large-titles!`, `or` becomes `and`, `when` becomes `when-not` or `nil?` becomes `some?`.
(deftest rehydrate-large-titles-uses-given-or-looked-up-inputs
  (async done
         (-> (p/let [[conn1 eid1] (conn-and-eid false)
                     by-conn (rehydrate! conn1 eid1 {:conn conn1 :tx-data (object-tx eid1)})
                     [conn2 eid2] (conn-and-eid false)
                     by-get-conn (rehydrate! conn2 eid2 {:get-conn-f (fn [r] (when (= r repo) conn2))
                                                         :tx-data (object-tx eid2)})
                     [conn3 eid3] (conn-and-eid true)
                     from-db (rehydrate! conn3 eid3 {:conn conn3})
                     [conn4 eid4] (conn-and-eid false)
                     given-key (rehydrate! conn4 eid4 {:conn conn4 :tx-data (object-tx eid4)
                                                       :aes-key "given-key"})
                     [conn5 eid5] (conn-and-eid false)
                     e2ee (rehydrate! conn5 eid5 {:conn conn5 :tx-data (object-tx eid5)
                                                  :graph-e2ee?-f (constantly true)})]
               (testing "a given conn, no get-conn-f: the given graph id reaches the download"
                 (is (nil? (:error by-conn)))
                 (is (= [{:graph-id "graph-1" :aes-key nil}] (:downloads by-conn)))
                 (is (= "rehydrated title" (:title by-conn))))
               (testing "no conn given: the conn comes from get-conn-f"
                 (is (true? (:returned? by-get-conn)))
                 (is (= "rehydrated title" (:title by-get-conn))))
               (testing "no tx-data: the objects stored in the db are rehydrated"
                 (is (true? (:returned? from-db)))
                 (is (= 1 (count (:downloads from-db))))
                 (is (= "rehydrated title" (:title from-db))))
               (testing "a given aes key is used as is on a graph without e2ee"
                 (is (= [{:graph-id "graph-1" :aes-key "given-key"}] (:downloads given-key))))
               (testing "an e2ee graph without a given key: the ensured key is used, no fail-fast"
                 (is (nil? (:error e2ee)))
                 (is (= [] (:fail-fasts e2ee)))
                 (is (= [{:graph-id "graph-1" :aes-key "ensured-key"}] (:downloads e2ee)))
                 (is (= "rehydrated title" (:title e2ee)))))
             (p/catch (fn [e] (is (nil? e))))
             (p/finally done))))
