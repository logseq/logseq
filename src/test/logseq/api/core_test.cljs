(ns logseq.api.core-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [electron.ipc :as ipc]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.search :as search-handler]
            [frontend.loader :as loader]
            [frontend.state :as state]
            [goog.dom :as gdom]
            [logseq.api :as api]
            [logseq.api.test-helper :as api-test]
            [logseq.sdk.experiments :as exper]
            [logseq.sdk.ui :as sdk-ui]
            [promesa.core :as p]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(deftest search-normalizes-worker-results
  (async done
    (-> (p/with-redefs [search-handler/search
                        (fn [_repo q' _opts]
                          (p/resolved {:blocks [{:block/title q'}]}))]
          (p/let [result (api/search "hello graph")]
            (is (= "hello graph" (aget result "blocks" 0 "title")))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest show-msg-uses-notification-helper
  (with-redefs [notification/show! (fn [& _] :plugin-api-test/notification)]
    (is (string? (api/show_msg "hello" "success")))))

(deftest http-request-abort-forwards-ipc
  (let [calls (atom [])]
    (with-redefs [ipc/ipc (fn [& args] (swap! calls conj args))]
      (api/http_request_abort 42)
      (is (= [[:httpRequestAbort 42]] @calls)))))

(deftest show-msg-parses-hiccup-content
  (let [shown (atom [])]
    (with-redefs [notification/show!
                  (fn [content status clear? uid timeout _opts]
                    (swap! shown conj {:content content :status status :clear? clear? :uid uid :timeout timeout})
                    :hiccup-key)]
      (is (= "hiccup-key" (api/show_msg "[:div \"Hi\"]" "warning" #js {:key "msg-1" :timeout 0})))
      (is (= [:div "Hi"] (:content (first @shown))))
      (is (= :warning (:status (first @shown))))
      (is (false? (:clear? (first @shown))))
      (is (= :msg-1 (:uid (first @shown)))))))

(deftest query-element-helpers
  (let [rect #js {:toJSON (fn [] #js {:x 1 :y 2 :width 10 :height 4})}
        previous-document (.-document js/globalThis)]
    (set! (.-document js/globalThis)
          #js {:querySelector (fn [selector]
                                (when (= ".box" selector)
                                  #js {:getBoundingClientRect (fn [] rect)}))})
    (try
      (with-redefs [gdom/getElement (fn [id]
                                      (when (= "slot-1" id)
                                        #js {:tagName "DIV"}))]
        (is (= "DIV#slot-1" (sdk-ui/query_element_by_id "slot-1")))
        (is (false? (sdk-ui/query_element_by_id "missing")))
        (is (true? (sdk-ui/check_slot_valid "slot-1")))
        (is (= 10 (aget (sdk-ui/query_element_rect ".box") "width")))
        (is (nil? (sdk-ui/query_element_rect ".missing"))))
      (finally
        (set! (.-document js/globalThis) previous-document)))))

(deftest make-asset-url-forwards-to-handler
  (async done
    (-> (p/with-redefs [assets-handler/<make-asset-url
                        (fn [path]
                          (p/resolved (str "asset:" path)))]
          (p/let [url (api/make_asset_url "../assets/file.png")]
            (is (= "asset:../assets/file.png" url))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest experiment-request-and-scripts
  (async done
    (let [ipc-calls (atom [])
          plugin #js {:id "test-plugin"}]
      (-> (p/with-redefs [plugin-handler/get-plugin-inst (constantly plugin)
                          plugin-handler/request-callback (fn [_pl req-id payload]
                                                            {:req-id req-id :payload payload})
                          ipc/ipc (fn [op req-id options]
                                    (swap! ipc-calls conj [op req-id options])
                                    (p/resolved #js {:ok true}))
                          loader/load (fn [src _el _opts]
                                        (p/resolved src))]
            (p/let [req-id (api/exper_request "test-plugin" #js {:url "https://example.com"})
                    _ (api/exper_load_scripts "test-plugin" "https://example.com/a.js")]
              (is (number? req-id))
              (is (= :httpRequest (ffirst @ipc-calls)))
              (is (some? (get-in (state/get-state)
                                 [:plugin/installed-resources :test-plugin :scripts "https://example.com/a.js"]))))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest experiment-register-fenced-code-renderer
  (let [registered (atom [])]
    (with-redefs [plugin-handler/get-plugin-inst (constantly #js {:id "test-plugin"})
                  plugin-handler/register-fenced-code-renderer
                  (fn [pid type payload]
                    (swap! registered conj [pid type payload])
                    true)]
      (is (true? (exper/register_fenced_code_renderer
                  "test-plugin"
                  "mermaid"
                  #js {:edit true :render (fn [])})))
      (is (= :test-plugin (ffirst @registered)))
      (is (= "mermaid" (second (first @registered)))))))
