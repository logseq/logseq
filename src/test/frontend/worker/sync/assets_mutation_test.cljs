(ns frontend.worker.sync.assets-mutation-test
  "Tests for frontend.worker.sync.assets found by mutation testing"
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [frontend.common.crypt :as crypt]
            [frontend.worker.platform :as platform]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.assets :as sync-assets]
            [frontend.worker.sync.client-op :as client-op]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

(defn- <upload
  "Runs upload-remote-asset! for asset-id with read-bytes-f giving the local
  file's bytes per asset id. Resolves to what the upload did:
  {:error :encrypt-input :fetch-bodies :broadcasts}."
  [{:keys [repo asset-id aes-key read-bytes-f]}]
  (let [encrypt-input (atom nil)
        fetch-bodies (atom [])
        broadcasts (atom [])
        original-fetch js/fetch
        db-sync-config @worker-state/*db-sync-config]
    (reset! worker-state/*db-sync-config {:http-base "https://sync.example.test"})
    (set! js/fetch (fn [_url opts]
                     (swap! fetch-bodies conj (.-body opts))
                     (p/resolved #js {:ok true :status 200})))
    (-> (p/with-redefs [sync-assets/graph-aes-key (fn [& _] (p/resolved aes-key))
                        platform/current (fn [] {})
                        platform/asset-read-bytes! (fn [_platform _repo file-name]
                                                     (read-bytes-f file-name))
                        crypt/<encrypt-uint8array (fn [_aes-key payload]
                                                    (reset! encrypt-input payload)
                                                    (p/resolved {:cipher "x"}))
                        shared-service/broadcast-to-clients! (fn [event payload]
                                                               (swap! broadcasts conj [event payload]))]
          (-> (sync-assets/upload-remote-asset! repo "graph-1" asset-id "png" "sha")
              (p/then (fn [_] {:error nil}))
              (p/catch (fn [e] {:error e}))))
        (p/then (fn [result]
                  (assoc result
                         :encrypt-input @encrypt-input
                         :fetch-bodies @fetch-bodies
                         :broadcasts @broadcasts)))
        (p/finally (fn []
                     (set! js/fetch original-fetch)
                     (reset! worker-state/*db-sync-config db-sync-config))))))

(defn- bytes-of [x] (vec (js/Array.from x)))

(deftest upload-encrypts-bytes-of-an-array-payload-test
  (async done
         (-> (p/let [r (<upload {:repo "r" :asset-id "a" :aes-key "k"
                                 :read-bytes-f (fn [_] (p/resolved #js [1 2 3]))})]
               (is (nil? (:error r)))
               (is (instance? js/Uint8Array (:encrypt-input r)))
               (is (= [1 2 3] (bytes-of (:encrypt-input r)))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest upload-encrypts-bytes-of-a-serialized-buffer-payload-test
  (async done
         (-> (p/let [r (<upload {:repo "r" :asset-id "a" :aes-key "k"
                                 :read-bytes-f (fn [_] (p/resolved #js {:type "Buffer" :data #js [4 5]}))})]
               (is (nil? (:error r)))
               (is (= [4 5] (some-> (:encrypt-input r) bytes-of))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest upload-rejects-an-unsupported-object-payload-test
  (async done
         (-> (p/let [r (<upload {:repo "r" :asset-id "a" :aes-key "k"
                                 :read-bytes-f (fn [_] (p/resolved #js {:type "Other" :data #js [4 5]}))})]
               (is (= :rtc.exception/upload-asset-failed (:type (ex-data (:error r)))))
               (is (nil? (:encrypt-input r)))
               (is (= [] (:fetch-bodies r))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest upload-progress-total-of-an-array-buffer-test
  (async done
         (-> (p/let [r (<upload {:repo "r" :asset-id "a" :aes-key nil
                                 :read-bytes-f (fn [_] (p/resolved (js/ArrayBuffer. 5)))})]
               (is (nil? (:error r)))
               (is (= [0 5] (->> (:broadcasts r)
                                 (filter #(= :rtc-asset-upload-download-progress (first %)))
                                 (map #(get-in % [1 :progress :loaded]))
                                 vec)))
               (is (= [5 5] (->> (:broadcasts r)
                                 (filter #(= :rtc-asset-upload-download-progress (first %)))
                                 (map #(get-in % [1 :progress :total]))
                                 vec))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest upload-of-one-asset-keeps-other-missing-asset-files-test
  (async done
         (let [repo "missing-files-repo"
               present (atom #{})
               read-bytes-f (fn [file-name]
                              (if (contains? @present file-name)
                                (p/resolved (js/Uint8Array. #js [1]))
                                (p/rejected (js/Error. "ENOENT"))))]
           (sync-assets/clear-missing-asset-upload-files! repo)
           (-> (p/let [_ (<upload {:repo repo :asset-id "a" :read-bytes-f read-bytes-f})
                       _ (<upload {:repo repo :asset-id "b" :read-bytes-f read-bytes-f})
                       _ (is (= ["a" "b"] (mapv :asset-id (sync-assets/get-missing-asset-upload-files repo))))
                       _ (swap! present conj "a.png")
                       r (<upload {:repo repo :asset-id "a" :read-bytes-f read-bytes-f})]
                 (is (nil? (:error r)))
                 (is (= ["b"] (mapv :asset-id (sync-assets/get-missing-asset-upload-files repo)))
                     "uploading a clears only a's missing file"))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (sync-assets/clear-missing-asset-upload-files! repo)
                            (done)))))))

(deftest enqueue-asset-task-runs-tasks-one-after-another-test
  (async done
         (let [events (atom [])
               client {:asset-queue (atom (p/resolved nil))}]
           (sync-assets/enqueue-asset-task! client (fn []
                                                     (swap! events conj :a-start)
                                                     (p/let [_ (p/delay 30)]
                                                       (swap! events conj :a-end))))
           (sync-assets/enqueue-asset-task! client (fn []
                                                     (swap! events conj :b-start)
                                                     (p/resolved nil)))
           (-> (p/let [_ (p/delay 80)]
                 (is (= [:a-start :a-end :b-start] @events)))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest request-asset-download-of-missing-asset-removes-its-asset-op-test
  (async done
         (let [repo "asset-download-repo"
               asset-uuid (random-uuid)
               conn (d/create-conn db-schema/schema)
               remove-calls (atom [])]
           (ldb/transact! conn [{:block/uuid asset-uuid
                                 :logseq.property.asset/type "png"
                                 :logseq.property.asset/remote-metadata {:checksum "c" :type "png"}}])
           (-> (p/with-redefs [worker-state/get-datascript-conn (fn [_repo] conn)
                               platform/current (fn [] {})
                               platform/asset-stat (fn [& _] (p/resolved nil))
                               sync-assets/download-remote-asset! (fn [& _] (p/resolved nil))
                               client-op/remove-asset-op (fn [& args] (swap! remove-calls conj (vec args)) nil)]
                 (sync-assets/request-asset-download!
                  repo asset-uuid
                  {:current-client-f (fn [_repo] {:graph-id "graph-1"})
                   :enqueue-asset-task-f (fn [_client task] (task))
                   :broadcast-rtc-state!-f (fn [& _] nil)}))
               (p/then (fn [_] (is (= [[repo asset-uuid]] @remove-calls))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest remote-asset-download-candidates-in-tx-only-added-remote-metadata-test
  (let [uploaded (random-uuid)
        renamed (random-uuid)
        unshared (random-uuid)
        conn (d/create-conn db-schema/schema)
        _ (ldb/transact! conn [{:block/uuid uploaded
                                :logseq.property.asset/type "png"}
                               {:block/uuid renamed
                                :logseq.property.asset/type "pdf"
                                :block/title "old"}
                               {:block/uuid unshared
                                :logseq.property.asset/type "gif"
                                :logseq.property.asset/remote-metadata {:checksum "c" :type "gif"}}])
        report (d/with @conn [[:db/add [:block/uuid uploaded] :logseq.property.asset/remote-metadata {:checksum "c" :type "png"}]
                              [:db/add [:block/uuid renamed] :block/title "new"]
                              [:db/retract [:block/uuid unshared] :logseq.property.asset/remote-metadata {:checksum "c" :type "gif"}]])]
    (is (= [{:asset-uuid uploaded :asset-type "png"}]
           (vec (sync-assets/remote-asset-download-candidates-in-tx (:db-after report) (:tx-data report)))))))
