(ns frontend.components.cmdk.core-test
  (:require
   [cljs.test :refer [async deftest is testing]]
   [frontend.components.cmdk.core :as cmdk]
   [frontend.db.async :as db-async]
   [frontend.handler.editor :as editor-handler]
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
                          editor-handler/open-block-in-sidebar!
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

(deftest cmdk-search-debouncer-coalesces-continuous-typing-test
  (async done
    (let [calls (atom 0)
          [schedule! cancel!] (cmdk/make-search-debouncer #(swap! calls inc))]
      (doseq [delay [0 100 200 300 400]]
        (js/setTimeout schedule! delay))
      (js/setTimeout
       (fn []
         (cancel!)
         (is (= 1 @calls)
             "five keystrokes 100 ms apart should trigger one search")
         (done))
       700))))

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
