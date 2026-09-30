(ns frontend.components.cmdk.core-test
  (:require
   [cljs.test :refer [async deftest is testing]]
   [frontend.components.cmdk.core :as cmdk]
   [frontend.db.async :as db-async]
   [frontend.handler.db-based.recent :as db-recent-handler]
   [frontend.handler.editor.format :as editor-format]
   [frontend.state :as state]
   [frontend.util :as util]
   [goog.object :as gobj]
   [logseq.shui.ui :as shui]
   [promesa.core :as p]))

(deftest shift-open-page-uses-page-action-test
  (async done
    (let [page-id #uuid "11111111-1111-1111-1111-111111111111"
          item {:result-type :page
                :source-block {:block/uuid page-id
                               :block/name "ordinary page"}}
          state {::cmdk/highlighted-item (atom item)}
          calls (atom [])]
      (-> (p/with-redefs [db-async/<get-block
                          (fn [& args]
                            (swap! calls conj [:get-block args])
                            (p/resolved (:source-block item)))
                          editor-format/open-block-in-sidebar!
                          (fn [block-id]
                            (swap! calls conj [:open block-id]))
                          shui/dialog-close!
                          (fn [dialog-id]
                            (swap! calls conj [:close dialog-id]))]
            (cmdk/handle-action :open state {:shift? true}))
          (p/then
           (fn []
             (is (= [[:open page-id]
                     [:close :ls-dialog-cmdk]]
                    @calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(defn- cmdk-input-state
  []
  {::cmdk/input (atom "")
   ::cmdk/input-ref (atom #js {:value ""})
   ::cmdk/focus-source (atom nil)
   ::cmdk/highlighted-item (atom {:text "Tag"})
   ::cmdk/pending-scroll-item-idx (atom 2)
   ::cmdk/scroll-container-ref (atom nil)})

(deftest cmdk-input-change-does-not-search-on-the-keystroke-test
  (is (false? (cmdk/search-on-input-event? false false false))
      "Each typed character updates input only; search is not armed on the keystroke.")
  (is (false? (cmdk/search-on-input-event? false true false)))
  (is (true? (cmdk/search-on-input-event? true false false)))
  (is (false? (cmdk/search-on-input-event? true true false))
      "IME composition does not search on each key.")
  (is (true? (cmdk/search-on-input-event? true true true)))
  (let [state (cmdk-input-state)
        event (js-obj)]
    (gobj/set event "type" "input")
    (gobj/set event "target" #js {:value "t"})
    (cmdk/handle-input-change state event "t" false)
    (is (= "t" @(::cmdk/input state)))
    (let [search-calls (atom 0)]
      (with-redefs [cmdk/load-results (fn [& _args] (swap! search-calls inc))]
        (cmdk/handle-input-change state event "ta" false)
        (is (zero? @search-calls)
            "The input event used while typing must not search.")))))

(deftest cmdk-initial-results-do-not-clobber-typed-search-test
  (async done
    (let [kept [{:text "kept-node"}]
          results (atom {:nodes {:status :success :items kept}})
          state {::cmdk/input (atom "table-search-filter-actions")
                 ::cmdk/filter (atom nil)
                 ::cmdk/results results}]
      (p/with-redefs [db-recent-handler/get-recent-pages
                      (fn [] (p/delay 20 [{:block/title "Recent"}]))]
        (cmdk/load-results :initial state)
        (js/setTimeout
         (fn []
           (is (= kept (get-in @results [:nodes :items]))
               "A late empty-state fetch must not reset nodes from a typed search.")
           (done))
         40)))))

(deftest cmdk-search-debouncer-coalesces-continuous-typing-test
  (async done
    (is (= 300 cmdk/search-debounce-ms)
        "CMDK search waits 300ms after typing stops.")
    (let [calls (atom 0)
          [schedule! cancel!] (cmdk/make-search-debouncer #(swap! calls inc))
          keystroke-gap 80
          last-keystroke (* 4 keystroke-gap)]
      (doseq [delay (range 0 (+ last-keystroke 1) keystroke-gap)]
        (js/setTimeout schedule! delay))
      (js/setTimeout
       (fn []
         (is (zero? @calls)
             "Search must not run at the old 150 ms per-character cadence."))
       (+ last-keystroke 200))
      (js/setTimeout
       (fn []
         (cancel!)
         (is (= 1 @calls)
             "five keystrokes 80 ms apart should trigger one search after the pause")
         (done))
       (+ last-keystroke cmdk/search-debounce-ms 80)))))

(deftest refresh-results-skips-duplicate-search-key-test
  (let [calls (atom [])
        cmdk-state {::cmdk/input (atom "#Movies")
                    ::cmdk/filter (atom {:group :nodes})
                    ::cmdk/last-refresh-key (atom nil)}]
    (with-redefs [cmdk/load-results (fn [& args] (swap! calls conj args))
                  cmdk/persist-cmdk-query-state! (fn [_state])
                  state/get-current-repo (constantly "repo-a")
                  state/get-state (constantly nil)]
      (#'cmdk/refresh-results! cmdk-state)
      (#'cmdk/refresh-results! cmdk-state)
      (is (= 1 (count @calls))
          "Mount effects with the same repo/input/filter/action should issue one search."))))

(defn- keydown-event
  [{:keys [key key-code composing?]}]
  (let [stopped? (atom false)
        event (js-obj)]
    (gobj/set event "key" key)
    (gobj/set event "keyCode" key-code)
    (gobj/set event "isComposing" (boolean composing?))
    (gobj/set event "ctrlKey" false)
    (gobj/set event "metaKey" false)
    (gobj/set event "shiftKey" false)
    (gobj/set event "stopPropagation" #(reset! stopped? true))
    {:event event
     :stopped? stopped?}))

(defn- cmdk-keydown-state
  []
  {::cmdk/input (atom "nihao")
   ::cmdk/filter (atom nil)
   ::cmdk/highlighted-item (atom {:text "Create page" :source-create :page :group :create})
   ::cmdk/all-items-cache (atom [])
   ::cmdk/focus-source (atom :keyboard)
   ::cmdk/results (atom {})
   ::cmdk/scroll-container-ref (atom nil)})

(defn- enter-action-calls
  [event]
  (let [calls (atom [])]
    (with-redefs [shui/shortcut-press! (fn [shortcut & _]
                                         (swap! calls conj [:shortcut shortcut]))
                  cmdk/handle-action (fn [action & _]
                                       (swap! calls conj [:action action]))
                  util/stop-propagation (fn [_]
                                          (swap! calls conj [:stop-propagation]))]
      (#'cmdk/keydown-handler (cmdk-keydown-state) event))
    @calls))

(deftest keydown-handler-ignores-ime-composition-enter
  (testing "macOS IME commit Enter (keyCode 229) does not run the highlighted action"
    (let [{:keys [event]} (keydown-event {:key "Enter" :key-code 229 :composing? false})]
      (is (empty? (enter-action-calls event)))))

  (testing "isComposing Enter does not run the highlighted action"
    (let [{:keys [event]} (keydown-event {:key "Enter" :key-code 13 :composing? true})]
      (is (empty? (enter-action-calls event)))))

  (testing "Process key from IME does not run the highlighted action"
    (let [{:keys [event]} (keydown-event {:key "Process" :key-code 229 :composing? false})]
      (is (empty? (enter-action-calls event))))))

(deftest keydown-handler-runs-highlighted-action-on-plain-enter
  (testing "plain Enter still selects the highlighted cmdk item"
    (let [{:keys [event]} (keydown-event {:key "Enter" :key-code 13 :composing? false})]
      (is (= [[:shortcut "return"]
              [:action :default]
              [:stop-propagation]]
             (enter-action-calls event))))))
