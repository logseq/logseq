(ns mobile.navigation-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [frontend.handler.route :as route-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [mobile.navigation :as mobile-nav]
            [mobile.state :as mobile-state]))

(defn- route-match
  [name]
  {:data {:name name}
   :parameters {:path {} :query {}}})

(defn- stack-entry
  [name path]
  {:path path
   :route {:to name :path-params {} :query-params {}}
   :route-match (route-match name)})

(defn- stack-paths
  [stack]
  (->> (get-in @@#'mobile-nav/stack-history [stack :history])
       (mapv :path)))

(defn- reset-navigation-state! []
  (reset! @#'mobile-nav/navigation-source nil)
  (reset! @#'mobile-nav/initialised-stacks {})
  (reset! @#'mobile-nav/active-stack "home")
  (reset! @#'mobile-nav/stack-history {})
  (reset! @#'mobile-nav/pending-navigation nil)
  (reset! mobile-state/*search-input "")
  (reset! mobile-state/*tab "home"))

(use-fixtures :each
  {:before reset-navigation-state!
   :after reset-navigation-state!})

(deftest switch-stack-from-search-to-non-home-does-not-replace-browser-route-with-home
  (testing "closing native search while selecting another tab should keep the selected stack route"
    (let [replace-calls (atom [])
          route-matches (atom [])]
      (reset! @#'mobile-nav/active-stack "search")
      (reset! @#'mobile-nav/stack-history
              {"search" {:history [(stack-entry :search "/__stack__/search")]}
               "graphs" {:history [(stack-entry :graphs "/__stack__/graphs")]}})
      (with-redefs [mobile-nav/orig-replace-state (fn [& args] (swap! replace-calls conj args))
                    route-handler/set-route-match! (fn [match] (swap! route-matches conj match))
                    mobile-util/native-platform? (constantly false)]
        (mobile-nav/switch-stack! "graphs")
        (is (empty? @replace-calls))
        (is (= :graphs (get-in (last @route-matches) [:data :name])))))))

(deftest switch-stack-from-search-to-home-closes-search-with-home-route
  (testing "closing native search to Home still updates the browser route to Home"
    (let [replace-calls (atom [])]
      (reset! @#'mobile-nav/active-stack "search")
      (reset! @#'mobile-nav/stack-history
              {"search" {:history [(stack-entry :search "/__stack__/search")]}
               "home" {:history [(stack-entry :home "/")]}})
      (with-redefs [mobile-nav/orig-replace-state (fn [& args] (swap! replace-calls conj args))
                    route-handler/set-route-match! (constantly nil)
                    mobile-util/native-platform? (constantly false)]
        (mobile-nav/switch-stack! "home")
        (is (= [[:home {} {}]] @replace-calls))))))

(deftest pop-to-root-notifies-native-reset
  (testing "collapsing a logical stack tells native to rebuild it as a single root view controller"
    (let [payloads (atom [])]
      (reset! @#'mobile-nav/active-stack "home")
      (reset! @#'mobile-nav/stack-history
              {"home" {:history [(stack-entry :home "/")
                                  (stack-entry :page "/page/alpha")]}})
      (with-redefs [mobile-nav/orig-replace-state (constantly nil)
                    route-handler/set-route-match! (constantly nil)
                    mobile-util/native-platform? (constantly true)
                    mobile-util/ui-local #js {:routeDidChange
                                               (fn [payload]
                                                 (swap! payloads conj
                                                        (js->clj payload :keywordize-keys true))
                                                 (js/Promise.resolve nil))}]
        (mobile-nav/pop-to-root! "home")
        (is (= "reset" (:navigationType (last @payloads))))
        (is (= "/" (:path (last @payloads))))))))

(deftest selecting-go-to-from-another-tab-preserves-its-stack-history
  (testing "Go To should restore the last page it opened"
    (let [payloads (atom [])
          route-matches (atom [])
          replace-calls (atom [])]
      (reset! mobile-state/*tab "go to")
      (reset! @#'mobile-nav/active-stack "go to")
      (reset! @#'mobile-nav/stack-history
              {"home" {:history [(stack-entry :home "/")]}
               "go to" {:history [(stack-entry (keyword "go to") "/__stack__/go to")
                                   (stack-entry :page "/page/recent")]}})
      (with-redefs [mobile-nav/orig-replace-state (fn [& args] (swap! replace-calls conj args))
                    route-handler/set-route-match! (fn [match] (swap! route-matches conj match))
                    mobile-util/native-platform? (constantly true)
                    mobile-util/ui-local #js {:routeDidChange
                                               (fn [payload]
                                                 (swap! payloads conj
                                                        (js->clj payload :keywordize-keys true))
                                                 (js/Promise.resolve nil))}]
        (mobile-state/set-tab! "home")
        (mobile-state/set-tab! "go to")
        (is (= :page (get-in (last @route-matches) [:data :name])))
        (is (empty? @payloads))
        (is (= [[:home {} {}]
                [:page {} {}]]
               @replace-calls))))))

(deftest browser-back-prunes-active-stack-before-tab-restore
  (testing "a page popped by Back should not be restored when switching back to the tab"
    (let [route-matches (atom [])
          replace-calls (atom [])]
      (reset! mobile-state/*tab "home")
      (reset! @#'mobile-nav/active-stack "home")
      (reset! @#'mobile-nav/initialised-stacks {"home" true
                                                "graphs" true})
      (reset! @#'mobile-nav/stack-history
              {"home" {:history [(stack-entry :home "/")
                                  (stack-entry :page "/page/recent")]}
               "graphs" {:history [(stack-entry :graphs "/__stack__/graphs")]}})
      (with-redefs [mobile-nav/orig-replace-state (fn [& args] (swap! replace-calls conj args))
                    route-handler/set-route-match! (fn [match] (swap! route-matches conj match))
                    mobile-util/native-platform? (constantly false)]
        (reset! @#'mobile-nav/navigation-source :pop)
        (mobile-nav/notify-route-change!
         {:route {:to :home
                  :path-params {}
                  :query-params {}}
          :route-match (route-match :home)
          :path "/"
          :stack "home"})
        (mobile-state/set-tab! "graphs")
        (mobile-state/set-tab! "home")
        (is (= ["/"] (stack-paths "home")))
        (is (= :home (get-in (last @route-matches) [:data :name])))
        (is (= [[:home {} {}]]
               @replace-calls))))))

(deftest leaving-search-does-not-clear-query-during-tab-transition
  (testing "native clears search state when Search opens, not while Home is appearing"
    (let [replace-calls (atom [])]
      (reset! mobile-state/*tab "search")
      (reset! mobile-state/*search-input "Hello")
      (reset! @#'mobile-nav/active-stack "search")
      (reset! @#'mobile-nav/stack-history
              {"search" {:history [(stack-entry :search "/__stack__/search")]}
               "home" {:history [(stack-entry :home "/")]}})
      (with-redefs [mobile-nav/orig-replace-state (fn [& args] (swap! replace-calls conj args))
                    route-handler/set-route-match! (constantly nil)
                    mobile-util/native-platform? (constantly false)]
        (mobile-state/set-tab! "home")
        (is (= "Hello" @mobile-state/*search-input))
        (is (= [[:home {} {}]] @replace-calls))))))

(deftest leaving-search-result-detail-preserves-search-stack-and-resets-home
  (testing "Home selected from a native search result detail should not discard Search history"
    (let [payloads (atom [])]
      (reset! mobile-state/*tab "search")
      (reset! @#'mobile-nav/active-stack "search")
      (reset! @#'mobile-nav/initialised-stacks {"search" true
                                                "home" true})
      (reset! @#'mobile-nav/stack-history
              {"search" {:history [(stack-entry :page "/page/jun-2nd-2026")]}
               "home" {:history [(stack-entry :home "/")]}})
      (with-redefs [mobile-nav/orig-replace-state (constantly nil)
                    route-handler/set-route-match! (constantly nil)
                    mobile-util/native-platform? (constantly true)
                    mobile-util/ui-local #js {:routeDidChange
                                               (fn [payload]
                                                 (swap! payloads conj
                                                        (js->clj payload :keywordize-keys true))
                                                 (js/Promise.resolve nil))}]
        (mobile-state/set-tab! "home")
        (is (= "home" @mobile-state/*tab))
        (is (= ["reset"] (mapv :navigationType @payloads)))
        (is (= ["/"] (stack-paths "home")))
        (is (= ["/page/jun-2nd-2026"] (stack-paths "search")))))))

(deftest leaving-search-for-another-tab-preserves-search-stack
  (testing "switching away from Search should keep existing results/detail state"
    (let [stacks (atom [])]
      (reset! mobile-state/*tab "search")
      (reset! @#'mobile-nav/active-stack "search")
      (reset! @#'mobile-nav/stack-history
              {"search" {:history [(stack-entry :page "/page/jun-2nd-2026")]}
               "flashcards" {:history [(stack-entry :flashcards "/__stack__/flashcards")]}})
      (with-redefs [mobile-nav/switch-stack! (fn [stack] (swap! stacks conj stack))]
        (mobile-state/set-tab! "flashcards")
        (is (= "flashcards" @mobile-state/*tab))
        (is (= ["flashcards"] @stacks))
        (is (= ["/page/jun-2nd-2026"] (stack-paths "search")))))))

(deftest restoring-search-result-detail-notifies-native-stack
  (testing "returning to a preserved Search detail should reattach native web content"
    (let [payloads (atom [])
          replace-calls (atom [])]
      (reset! @#'mobile-nav/active-stack "home")
      (reset! @#'mobile-nav/initialised-stacks {"home" true
                                                "search" true})
      (reset! @#'mobile-nav/stack-history
              {"home" {:history [(stack-entry :home "/")]}
               "search" {:history [(stack-entry :page "/page/jun-2nd-2026")]}})
      (with-redefs [mobile-nav/orig-replace-state (fn [& args] (swap! replace-calls conj args))
                    route-handler/set-route-match! (constantly nil)
                    mobile-util/native-platform? (constantly true)
                    mobile-util/ui-local #js {:routeDidChange
                                               (fn [payload]
                                                 (swap! payloads conj
                                                        (js->clj payload :keywordize-keys true))
                                                 (js/Promise.resolve nil))}]
        (mobile-nav/switch-stack! "search")
        (is (= [[:page {} {}]] @replace-calls))
        (is (= [{:navigationType "replace"
                 :push false
                 :stack "search"
                 :route {:to "page"
                         :path-params {}
                         :query-params {}}
                 :path "/page/jun-2nd-2026"}]
               @payloads))))))

(deftest selecting-flashcards-does-not-open-cards-dialog
  (testing "flashcards is a normal tab surface, not a modal shortcut"
    (let [events (atom [])
          stacks (atom [])]
      (with-redefs [state/pub-event! (fn [event] (swap! events conj event))
                    mobile-nav/switch-stack! (fn [stack] (swap! stacks conj stack))]
        (mobile-state/set-tab! "flashcards")
        (is (= "flashcards" @mobile-state/*tab))
        (is (= ["flashcards"] @stacks))
        (is (empty? @events))))))
