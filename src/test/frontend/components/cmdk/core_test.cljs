(ns frontend.components.cmdk.core-test
  (:require
   [cljs.test :refer [async deftest is testing]]
   [frontend.components.block.breadcrumb :as block-breadcrumb]
   [frontend.components.cmdk.core :as cmdk]
   [frontend.components.icon :as icon-component]
   [frontend.db.async :as db-async]
   [frontend.handler.command-palette :as command-palette]
   [frontend.handler.db-based.recent :as db-recent-handler]
   [frontend.handler.editor.format :as editor-format]
   [frontend.handler.route :as route-handler]
   [frontend.modules.shortcut.config :as shortcut-config]
   [frontend.search :as search]
   [frontend.state :as state]
   [frontend.util :as util]
   [frontend.util.page :as page-util]
   [goog.object :as gobj]
   [logseq.shui.ui :as shui]
   [promesa.core :as p]))

(deftest existing-matches-precede-page-creation-test
  (let [page {:result-type :page
              :source-block {:page? true :block.temp/original-title "car"}}
        alias-target {:page? true :block.temp/original-title "vehicle"}
        alias {:result-type :page :alias alias-target :source-block alias-target}
        another-page {:result-type :page
                      :source-block {:page? true :block.temp/original-title "cart"}}
        block {:result-type :block :source-block {:block/title "hello"}}
        another-block {:result-type :block :source-block {:block/title "hello again"}}
        command {:source-command {:id :test-command}}
        file {:file-path "car.pdf"}
        filter-item {:filter {:group :nodes}}
        namespaced-page {:result-type :page
                         :source-block {:page? true :block.temp/original-title "transport/car"}}
        namespace-child {:result-type :page
                         :source-block {:page? true
                                        :block.temp/original-title "car"
                                        :block/parent 10
                                        :block.temp/breadcrumb [{:db/id 10 :block/title "transport"}]}}
        library-page {:result-type :page
                      :source-block {:page? true
                                     :block.temp/original-title "car"
                                     :block/parent 11
                                     :block.temp/breadcrumb [{:db/id 11
                                                              :block/title "Library"
                                                              :logseq.property/built-in? true}]}}
        tag {:result-type :page
             :source-block {:page? true
                            :block.temp/original-title "car"
                            :block/tags [{:db/ident :logseq.class/Tag}]}}
        property {:result-type :page
                  :source-block {:page? true
                                 :block.temp/original-title "car"
                                 :block/tags [{:db/ident :logseq.class/Property}]}}]
    (doseq [[input filter-group results expected-groups expected-action]
            [["c" nil {:nodes {:items [page]}} [:nodes :create] :open]
             ["ca" nil {:nodes {:items [page]}} [:nodes :create] :open]
             ["car" nil {:nodes {:items [page]}} [:nodes] :open]
             ["car" nil {:nodes {:items [namespace-child]}} [:nodes :create] :open]
             ["car" nil {:nodes {:items [library-page]}} [:nodes] :open]
             ["car" nil {:nodes {:items [tag]}} [:nodes :create] :open]
             ["car" nil {:nodes {:items [property]}} [:nodes :create] :open]
             ["car" nil {:nodes {:items [alias]}} [:nodes :create] :open]
             ["transport/ca" nil {:nodes {:items [namespaced-page]}} [:nodes :create] :open]
             ["ca" :nodes {:nodes {:items [page]}} [:nodes :create] :open]
             ["ca" nil {:current-page {:items [page]}} [:current-page :create] :open]
             ["ca" nil {:nodes {:items [page another-page]}
                        :commands {:items [command]}
                        :files {:items [file]}}
              [:nodes :create :nodes :commands :files] :open]
             ["car" nil {:nodes {:items [alias another-page]}}
              [:nodes :create :nodes] :open]
             ["transport/ca" nil {:nodes {:items [namespaced-page another-page]}
                                  :files {:items [file]}}
              [:nodes :create :nodes :files] :open]
             ["ca" :nodes {:nodes {:items [page another-page]}}
              [:nodes :create :nodes] :open]
             ["hello" nil {:nodes {:items [block another-block]}
                           :commands {:items [command]}
                           :filters {:items [filter-item]}}
              [:nodes :create :nodes :commands :filters] :open]
             ["ca" nil {:current-page {:items [block another-block]}
                        :nodes {:items [page another-page]}}
              [:current-page :current-page :nodes :create :nodes] :open]
             ["carr" nil {:filters {:items [filter-item]}} [:create :filters] :create]
             ["transport/carr" nil {:filters {:items [filter-item]}} [:create :filters] :create]]]
      (testing (str "Default action for " input " with filter " filter-group)
        (let [state {::cmdk/input (atom input)
                     ::cmdk/filter (atom (when filter-group {:group filter-group}))
                     ::cmdk/results (atom results)
                     ::cmdk/highlighted-item (atom nil)
                     ::cmdk/all-items-cache (atom [])
                     ::cmdk/focus-source (atom :keyboard)
                     ::cmdk/scroll-container-ref (atom nil)}
              items (vec (mapcat last (cmdk/state->results-ordered state)))]
          (reset! (::cmdk/all-items-cache state) items)
          (is (= expected-groups (mapv :group items)))
          (is (= expected-action (cmdk/state->action state)))
          (when-let [creation-index (some #(when (:source-create %) (:item-index %)) items)]
            (cmdk/move-highlight state creation-index)
            (is (= :create (cmdk/state->action state)))))))))

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

(defn- with-document-body
  "Run `f` with a stub `js/document` whose body is `body`; node has no DOM."
  [body f]
  (let [original-document (aget js/global "document")]
    (set! (.-document js/global) #js {:body body})
    (try
      (f)
      (finally
        (if (nil? original-document)
          (js-delete js/global "document")
          (set! (.-document js/global) original-document))))))

(defn- trigger-palette-command!
  "Run `command` the way the palette runs a highlighted command."
  [command]
  (let [state {::cmdk/highlighted-item (atom {:source-command command})
               ::cmdk/input-ref (atom #js {:value "" :focus (fn [])})}]
    (with-redefs [shui/dialog-close! (fn [_])]
      (cmdk/handle-action :trigger state nil))))

(defn- palette-shortcut-command
  [id]
  (some #(when (= id (:id %)) %) (command-palette/global-shortcut-commands)))

(deftest trigger-passes-shortcut-event-to-every-palette-shortcut-command-test
  (testing "the shortcut handler calls every shortcut :fn with its event, so the palette must too"
    (let [original-config @shortcut-config/*config
          received-args (atom {})
          body #js {:nodeName "BODY"}]
      (try
        (swap! shortcut-config/*config update-vals
               (fn [shortcuts]
                 (into {}
                       (map (fn [[id shortcut]]
                              [id (cond-> shortcut
                                    (:fn shortcut)
                                    (assoc :fn (fn [& args] (swap! received-args assoc id args))))]))
                       shortcuts)))
        (let [commands (filter :action (command-palette/global-shortcut-commands))]
          (is (contains? (set (map :id commands)) :editor/toggle-block-children))
          (with-document-body body #(doseq [command commands] (trigger-palette-command! command)))
          (doseq [{:keys [id]} commands
                  :let [args (get @received-args id)]]
            (is (= 1 (count args)) (str id " :fn gets exactly one event argument"))
            (is (identical? body (some-> (first args) .-target)) (str id " event targets the document body"))
            (is (= (subs (str id) 1) (some-> (first args) .-identifier)) (str id " event carries the shortcut identifier"))))
        (finally
          (reset! shortcut-config/*config original-config))))))

(deftest trigger-toggle-block-children-command-test
  (testing "toggle-collapse! has no 0-arity; running it from the palette must not throw Invalid arity"
    (let [checked-editing? (atom false)
          command (palette-shortcut-command :editor/toggle-block-children)]
      (with-redefs [state/editing? (fn [] (reset! checked-editing? true) false)
                    state/selection? (constantly false)]
        (with-document-body #js {:nodeName "BODY"} #(trigger-palette-command! command)))
      (is (true? @checked-editing?) "toggle-collapse! ran past its arity dispatch"))))

(deftest trigger-zero-arity-shortcut-command-test
  (testing "a 0-arity shortcut :fn still runs from the palette"
    (let [redirected? (atom false)]
      (with-redefs [route-handler/redirect-to-home! (fn [& _] (reset! redirected? true))]
        (with-document-body #js {:nodeName "BODY"}
          #(trigger-palette-command! (palette-shortcut-command :go/home))))
      (is (true? @redirected?)))))

(deftest load-results-codes-unwraps-matched-count-map-test
  (async done
    (let [block {:block/uuid #uuid "22222222-2222-2222-2222-222222222222"
                 :block/title "code snippet"}
          results (atom {:codes {:status :success :items nil}})
          state {::cmdk/input (atom "x")
                 ::cmdk/results results}
          search-opts (atom nil)
          breadcrumb-ids (atom [])]
      (-> (p/with-redefs [state/get-current-repo (constantly "repo")
                          state/get-current-page (constantly nil)
                          page-util/get-current-page-uuid (constantly nil)
                          search/block-search
                          (fn [_repo _input opts]
                            (reset! search-opts opts)
                            (p/resolved {:items [block] :matched-count 1}))
                          icon-component/get-node-icon-cp (fn [_ _] "code")
                          block-breadcrumb/breadcrumb
                          (fn [_opts _repo id _breadcrumb-opts]
                            (swap! breadcrumb-ids conj id)
                            [:breadcrumb id])]
            (cmdk/load-results :codes state)
            (p/delay 40))
          (p/then
           (fn []
             (is (true? (:code-only? @search-opts)))
             (is (true? (:include-matched-count? @search-opts)))
             (let [items (get-in @results [:codes :items])]
               (is (= :success (get-in @results [:codes :status])))
               (is (= 1 (count items)))
               (is (= block (:source-block (first items))))
               (is (= [#uuid "22222222-2222-2222-2222-222222222222"]
                      @breadcrumb-ids)
                   "Code search must unwrap :items so breadcrumbs get a real block uuid, not nil."))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))
