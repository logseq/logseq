(ns logseq.api.core-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [electron.ipc :as ipc]
            [frontend.handler.notification :as notification]
            [frontend.handler.search :as search-handler]
            [logseq.api :as api]
            [logseq.api.test-helper :as api-test]
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
    (is (= "plugin-api-test/notification"
           (api/show_msg "hello" "success")))))

(deftest http-request-abort-forwards-ipc
  (let [calls (atom [])]
    (with-redefs [ipc/ipc (fn [& args] (swap! calls conj args))]
      (api/http_request_abort 42)
      (is (= [[:httpRequestAbort 42]] @calls)))))
