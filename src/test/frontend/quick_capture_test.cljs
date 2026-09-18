(ns frontend.quick-capture-test
  (:require [cljs.test :refer [is testing]]
            [frontend.db.async :as db-async]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.quick-capture :as quick-capture]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [promesa.core :as p]))

(def renderer-graph-url "lsp://logseq.com/index.html#/graph")

(defn- with-immediate-timeout
  [f]
  (let [orig js/setTimeout]
    (set! js/setTimeout (fn [callback _] (callback)))
    (-> (f)
        (p/finally (fn []
                     (set! js/setTimeout orig))))))

(defn- capture-inserts
  [args]
  (let [inserted (atom [])
        redirects (atom [])]
    (with-immediate-timeout
      (fn []
        (p/with-redefs
         [db-async/<get-today-journal-title (constantly (p/resolved "Sep 18th, 2026"))
          state/get-current-repo (constantly "test")
          state/get-config (constantly {})
          state/get-current-page (constantly nil)
          state/editing? (constantly false)
          state/get-edit-content (constantly nil)
          editor-handler/escape-editing (constantly nil)
          page-handler/<create! (constantly (p/resolved nil))
          editor-handler/insert (fn [content & _]
                                  (swap! inserted conj content)
                                  (p/resolved content))
          editor-handler/api-insert-new-block! (fn [content & _]
                                                 (swap! inserted conj content)
                                                 (p/resolved content))
          route-handler/redirect-to-graph-view! (fn []
                                                  (swap! redirects conj :graph))]
          (p/let [_ (quick-capture/quick-capture args)]
            {:inserted @inserted
             :redirects @redirects}))))))

(deftest-async quick-capture-does-not-insert-renderer-origin-url
  (testing "quickCapture of the privileged renderer Graph View URL does not insert a block title"
    (p/let [{:keys [inserted redirects]} (capture-inserts {:url renderer-graph-url
                                                           :title renderer-graph-url
                                                           :content renderer-graph-url})]
      (is (empty? inserted)
          "Renderer origin must not be inserted as journal/block content")
      (is (= [:graph] redirects)
          "Graph View renderer URLs open Graph View instead of capturing text"))))
