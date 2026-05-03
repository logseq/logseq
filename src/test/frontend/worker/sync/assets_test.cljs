(ns frontend.worker.sync.assets-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.common.crypt :as crypt]
            [frontend.worker.platform :as platform]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.assets :as sync-assets]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(deftest upload-remote-asset-serializes-resolved-encrypted-payload-test
  (async done
         (let [repo "asset-upload-repo"
               graph-id "graph-1"
               asset-uuid (random-uuid)
               checksum "sha-256-value"
               asset-bytes (js/Uint8Array. #js [1 2 3])
               encrypted-payload {:cipher "encrypted-payload"}
               expected-body (ldb/write-transit-str encrypted-payload)
               fetch-call* (atom nil)
               encrypt-input* (atom nil)
               original-fetch js/fetch
               db-sync-config @worker-state/*db-sync-config]
           (reset! worker-state/*db-sync-config
                   {:http-base "https://sync.example.test"})
           (set! js/fetch
                 (fn [url opts]
                   (reset! fetch-call*
                           {:url url
                            :body (.-body opts)})
                   (p/resolved #js {:ok true
                                     :status 200})))
           (-> (p/with-redefs [sync-assets/graph-aes-key
                               (fn [_repo _graph-id _fail-fast-f]
                                 (p/resolved "aes-key"))
                               platform/current
                               (fn [] {})
                               platform/asset-read-bytes!
                               (fn [_platform _repo _file-name]
                                 (p/resolved asset-bytes))
                               crypt/<encrypt-uint8array
                               (fn [_aes-key payload]
                                 (reset! encrypt-input* payload)
                                 (p/resolved encrypted-payload))
                               shared-service/broadcast-to-clients!
                               (fn [& _] nil)]
                 (sync-assets/upload-remote-asset!
                  repo graph-id asset-uuid "png" checksum))
               (p/then
                (fn [_]
                  (is (instance? js/Uint8Array @encrypt-input*))
                  (is (= expected-body (:body @fetch-call*)))))
               (p/catch
                (fn [error]
                  (is false (str "unexpected error: " error))))
               (p/finally
                 (fn []
                   (set! js/fetch original-fetch)
                   (reset! worker-state/*db-sync-config db-sync-config)
                   (done)))))))
