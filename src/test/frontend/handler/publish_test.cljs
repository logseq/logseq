(ns frontend.handler.publish-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.config :as config]
            [frontend.handler.notification :as notification]
            [frontend.handler.publish :as publish-handler]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest jpeg-xl-asset-content-type-test
  (is (= "image/jxl" (#'publish-handler/asset-content-type "jxl")))
  (is (= "image/jxl" (#'publish-handler/asset-content-type "JXL"))))

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
          previous-state (state/get-state)
          original-auth-id-token state/get-auth-id-token
          original-get-graph-uuid publish-handler/<get-graph-uuid
          original-sha256 publish-handler/<sha256-hex
          original-fetch js/fetch]
      (state/swap-state! assoc :git/current-repo repo)
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
             (state/replace-state! previous-state)
             (set! state/get-auth-id-token original-auth-id-token)
             (set! publish-handler/<get-graph-uuid original-get-graph-uuid)
             (set! publish-handler/<sha256-hex original-sha256)
             (set! js/fetch original-fetch)
             (done)))))))

(deftest unpublish-stored-link-test
  (async done
    (let [server "https://publish.example/site"
          page-id "22222222-2222-2222-2222-222222222222"
          graph-id "33333333-3333-3333-3333-333333333333"
          ids (str "/" graph-id "/" page-id)
          run-case (fn [[url endpoint status body success?]]
                     (let [requests (atom [])
                           removed (atom [])]
                       (p/with-redefs [config/publish-api-base (constantly server)
                                       js/fetch (fn [target opts]
                                                  (swap! requests conj [(.-method opts) target])
                                                  (js/Response. body #js {:status status}))
                                       property-handler/remove-block-property! (fn [& args] (swap! removed conj args))
                                       notification/show! (fn [& _])]
                         (p/let [_ (publish-handler/<unpublish-page! (uuid page-id) url)]
                           (is (= (if endpoint [["DELETE" (str server endpoint)]] []) @requests))
                           (is (= (if success? [[(uuid page-id) :logseq.property.publish/published-url]] [])
                                  @removed))))))]
      (-> (p/run! run-case
                  [[(str server "/s/abc123") "/p/abc123" 200 "{\"ok\":true}" true]
                   [(str server "/page" ids) (str "/pages" ids) 200 "{\"ok\":true}" true]
                   ["https://other.example/p/abc123" nil 200 "" false]
                   [(str server "/p/abc123") "/p/abc123" 200 "<html>Not found</html>" false]
                   [(str server "/p/abc123") "/p/abc123" 404 "{}" false]
                   [(str server "/p/abc123") "/p/abc123" 403 "{}" false]])
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))
