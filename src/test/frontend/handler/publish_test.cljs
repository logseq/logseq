(ns frontend.handler.publish-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [frontend.handler.publish :as publish-handler]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest upload-custom-publish-assets-reads-files-through-worker-test
  (async done
    (let [repo "logseq_db_publish_worker"
          graph-uuid "graph-1"
          worker-calls (atom [])
          uploads (atom [])
          original-auth-id-token state/get-auth-id-token
          original-get-file-content publish-handler/<get-file-content
          original-sha256 publish-handler/<sha256-hex
          original-upload-raw publish-handler/<upload-raw-asset!]
      (set! state/get-auth-id-token (constantly "token"))
      (set! publish-handler/<get-file-content
            (fn [repo' path]
              (swap! worker-calls conj [:thread-api/get-file-content repo' path])
              (p/resolved
               (case path
                 "logseq/publish.css" "body { color: green; }"
                 "logseq/publish.js" "   "))))
      (set! publish-handler/<sha256-hex
            (fn [content]
              (is (= "body { color: green; }" content))
              (p/resolved "css-hash")))
      (set! publish-handler/<upload-raw-asset!
            (fn [token meta content-type content]
              (swap! uploads conj [token meta content-type content])
              (p/resolved #js {:ok true})))
      (-> (p/let [result (#'publish-handler/<upload-custom-publish-assets! repo graph-uuid)]
            (is (= [[:thread-api/get-file-content repo "logseq/publish.css"]
                    [:thread-api/get-file-content repo "logseq/publish.js"]]
                   @worker-calls))
            (is (= [["token"
                     {:graph graph-uuid
                      :asset_uuid "publish"
                      :asset_type "css"
                      :content_type "text/css; charset=utf-8"
                      :checksum "css-hash"
                      :title "publish.css"}
                     "text/css; charset=utf-8"
                     "body { color: green; }"]]
                   @uploads))
            (is (= {:custom_publish_css_hash "css-hash"} result)))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (set! state/get-auth-id-token original-auth-id-token)
             (set! publish-handler/<get-file-content original-get-file-content)
             (set! publish-handler/<sha256-hex original-sha256)
             (set! publish-handler/<upload-raw-asset! original-upload-raw)
             (done)))))))

(deftest post-publish-gets-missing-graph-uuid-from-worker-test
  (async done
    (let [repo "logseq_db_publish_graph_uuid"
          worker-calls (atom [])
          fetch-calls (atom [])
          previous-state @state/state
          original-auth-id-token state/get-auth-id-token
          original-get-graph-uuid publish-handler/<get-graph-uuid
          original-sha256 publish-handler/<sha256-hex
          original-fetch js/fetch]
      (swap! state/state assoc :git/current-repo repo)
      (set! js/fetch
            (fn [url opts]
              (swap! fetch-calls conj [url opts])
              (p/resolved #js {:ok true})))
      (set! state/get-auth-id-token (constantly nil))
      (set! publish-handler/<get-graph-uuid
            (fn [repo']
              (swap! worker-calls conj [:thread-api/get-graph-uuid repo'])
              (p/resolved "11111111-1111-1111-1111-111111111111")))
      (set! publish-handler/<sha256-hex (fn [_] (p/resolved "content-hash")))
      (-> (p/let [resp (#'publish-handler/<post-publish!
                         {:page-uuid #uuid "22222222-2222-2222-2222-222222222222"
                          :block-count 1
                          :schema-version "65.0"}
                         {})]
            (is (.-ok resp))
            (is (= [[:thread-api/get-graph-uuid repo]]
                   @worker-calls))
            (is (= 1 (count @fetch-calls)))
            (let [[_url opts] (first @fetch-calls)
                  meta (js->clj (js/JSON.parse (get (js->clj (.-headers opts) :keywordize-keys false)
                                                    "x-publish-meta"))
                                :keywordize-keys true)]
              (is (= "11111111-1111-1111-1111-111111111111"
                     (:graph meta)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (reset! state/state previous-state)
             (set! state/get-auth-id-token original-auth-id-token)
             (set! publish-handler/<get-graph-uuid original-get-graph-uuid)
             (set! publish-handler/<sha256-hex original-sha256)
             (set! js/fetch original-fetch)
             (done)))))))

(deftest unpublish-page-gets-graph-uuid-from-worker-test
  (async done
    (let [repo "logseq_db_unpublish_graph_uuid"
          worker-calls (atom [])
          fetch-calls (atom [])
          removed-properties (atom [])
          notifications (atom [])
          previous-state @state/state
          original-auth-id-token state/get-auth-id-token
          original-get-graph-uuid publish-handler/<get-graph-uuid
          original-remove-property property-handler/remove-block-property!
          original-notification-show notification/show!
          original-fetch js/fetch]
      (swap! state/state assoc :git/current-repo repo)
      (set! js/fetch
            (fn [url opts]
              (swap! fetch-calls conj [url opts])
              (p/resolved #js {:ok true})))
      (set! state/get-auth-id-token (constantly nil))
      (set! publish-handler/<get-graph-uuid
            (fn [repo']
              (swap! worker-calls conj [:thread-api/get-graph-uuid repo'])
              (p/resolved "11111111-1111-1111-1111-111111111111")))
      (set! property-handler/remove-block-property!
            (fn [block-id property]
              (swap! removed-properties conj [block-id property])))
      (set! notification/show!
            (fn [& args]
              (swap! notifications conj args)))
      (-> (publish-handler/unpublish-page! {:db/id 42
                                            :block/uuid #uuid "22222222-2222-2222-2222-222222222222"})
          (p/then
           (fn [_]
             (is (= [[:thread-api/get-graph-uuid repo]]
                    @worker-calls))
             (is (= 1 (count @fetch-calls)))
             (when-let [url (ffirst @fetch-calls)]
               (is (string/includes? url
                                     "/pages/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222")))
             (is (= [[42 :logseq.property.publish/published-url]]
                    @removed-properties))
             (is (= 1 (count @notifications)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (reset! state/state previous-state)
             (set! state/get-auth-id-token original-auth-id-token)
             (set! publish-handler/<get-graph-uuid original-get-graph-uuid)
             (set! property-handler/remove-block-property! original-remove-property)
             (set! notification/show! original-notification-show)
             (set! js/fetch original-fetch)
             (done)))))))
