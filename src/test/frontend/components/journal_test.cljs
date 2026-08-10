(ns frontend.components.journal-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.components.journal :as journal]
            [frontend.components.page :as page]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.subs :as subs]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]))

(def ^:private test-graph-id "journal-membership-test")

(defn- block
  [block-uuid tx-id title]
  {:block/uuid block-uuid
   :block/tx-id tx-id
   :block/title title})

(defn- finish-async!
  [done promise]
  (-> promise
      (p/catch (fn [error]
                 (is false (str error))))
      (p/finally done)))

(defn- render-static
  [element]
  (let [previous-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (.renderToStaticMarkup react-dom-server element)
      (finally
        (if (some? previous-react)
          (gobj/set js/globalThis "React" previous-react)
          (js-delete js/globalThis "React"))))))

(defn- with-use-sync-external-store
  [replacement f]
  (let [original-use-ref (gobj/get react "useRef")
        original-use-callback (gobj/get react "useCallback")
        original (gobj/get react "useSyncExternalStore")]
    (gobj/set react "useRef" (fn [value] #js {:current value}))
    (gobj/set react "useCallback" (fn [callback _deps] callback))
    (gobj/set react "useSyncExternalStore" replacement)
    (try
      (f)
      (finally
        (gobj/set react "useRef" original-use-ref)
        (gobj/set react "useCallback" original-use-callback)
        (gobj/set react "useSyncExternalStore" original)))))

(defn- mount-hook!
  "Mount one real renderer hook behind a minimal external-store harness."
  [hook key]
  (let [*mounted? (atom true)
        *unsubscribe (atom nil)
        value (atom nil)
        render-count (atom 0)]
    (letfn [(listener! []
              (when @*mounted?
                (render!)))
            (render! []
              (when @*mounted?
                (with-use-sync-external-store
                  (fn [subscribe get-snapshot _get-server-snapshot]
                    (when-not @*unsubscribe
                      (reset! *unsubscribe (subscribe listener!)))
                    (get-snapshot))
                  (fn []
                    (swap! render-count inc)
                    (reset! value (hook key))))))]
      (render!)
      {:value value
       :render-count render-count
       :unmount! (fn []
                   (reset! *mounted? false)
                   (when-let [unsubscribe @*unsubscribe]
                     (unsubscribe)
                     (reset! *unsubscribe nil)))})))

(defn- unmount!
  [mounted]
  ((:unmount! mounted)))

(use-fixtures :each
  {:before #(subs/reset-graph! test-graph-id)
   :after #(subs/reset-graph! test-graph-id)})

(deftest journals-root-fills-its-scroll-container-test
  (let [journal-uuid (random-uuid)]
    (with-redefs [db-hooks/use-resource (constantly [journal-uuid])
                  db-hooks/use-block (constantly {})
                  subs/block-snapshot
                  (constantly {:status :ready})
                  hooks/use-effect! (fn [& _args])
                  hooks/use-ref (fn [value] #js {:current value})
                  util/app-scroll-container-node
                  (constantly #js {:clientHeight 800})
                  util/rtc-test-without-virtualization? (constantly true)
                  page/journal-page (fn [& _args] [:div "Journal"])]
      (let [markup (render-static (journal/all-journals))]
        (is (re-find #"id=\"journals\"[^>]*class=\"[^\"]*h-full" markup)
            "The virtualized journal root must fill the mobile scroll container.")))))

(deftest journals-use-one-resource-and-need-no-scroll-loader-test
  (let [journal-uuids (vec (repeatedly 12 random-uuid))
        resource-keys (atom [])
        virtual-opts (atom nil)]
    (with-redefs [db-hooks/use-resource
                  (fn [resource-key]
                    (swap! resource-keys conj resource-key)
                    journal-uuids)
                  subs/block-snapshot (constantly {:status :ready})
                  hooks/use-effect! (fn [& _args])
                  hooks/use-ref (fn [value] #js {:current value})
                  util/app-scroll-container-node
                  (constantly #js {:clientHeight 800})
                  util/rtc-test-without-virtualization? (constantly false)
                  ui/virtualized-list
                  (fn [opts]
                    (reset! virtual-opts opts)
                    [:div])]
      (render-static (journal/all-journals))
      (is (= [[:journals]] @resource-keys))
      (is (nil? (:items-rendered @virtual-opts))
          "Scrolling does not schedule a second resource path.")
      (is (fn? (:is-scrolling @virtual-opts))
          "The list suppresses missing journal loads while scrolling."))))

(deftest fast-scrolling-does-not-render-an-unseeded-journal-test
  (let [journal-uuid (random-uuid)
        scrolling? (atom true)
        block-value (atom nil)
        virtual-opts (atom nil)
        page-calls (atom [])]
    (with-redefs [db-hooks/use-resource (constantly [journal-uuid])
                  subs/block-snapshot (constantly {:status :loading})
                  hooks/use-state
                  (fn [initial]
                    (is (false? initial))
                    [@scrolling? #(reset! scrolling? %)])
                  hooks/use-effect! (fn [& _args])
                  util/app-scroll-container-node
                  (constantly #js {:clientHeight 800})
                  util/rtc-test-without-virtualization? (constantly false)
                  page/journal-page
                  (fn [requested-uuid _opts]
                    (swap! page-calls conj requested-uuid)
                    (when @block-value [:div "Journal"]))
                  ui/virtualized-list
                  (fn [opts]
                    (reset! virtual-opts opts)
                    [:div])]
      (render-static (journal/all-journals))
      (let [markup (render-static
                    ((:item-content @virtual-opts) 0 journal-uuid))]
        (is (re-find #"journal-item-placeholder" markup)
            "Intermediate virtual items show a stable placeholder."))
      (is (empty? @page-calls)
          "Intermediate virtual items do not start block requests.")
      ((:is-scrolling @virtual-opts) false)
      (render-static (journal/all-journals))
      (let [markup (render-static
                    ((:item-content @virtual-opts) 0 journal-uuid))]
        (is (re-find #"journal-item-placeholder" markup))
        (is (= [journal-uuid] @page-calls)
            "The final visible journal starts its normal page subscriptions."))
      (reset! block-value {})
      (let [markup (render-static
                    ((:item-content @virtual-opts) 0 journal-uuid))]
        (is (re-find #"Journal" markup)
            "The loaded journal replaces its placeholder.")))))

(deftest visible-journal-loads-through-the-normal-block-path-test
  (async done
         (let [journal-a (random-uuid)
               journal-b (random-uuid)
               journal-a-block (block journal-a 1 "Journal A")
               resource-loads (atom [])
               block-loads (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id resource-key]
                              (swap! resource-loads conj resource-key)
                              (if (= [:journals] resource-key)
                                (p/resolved {:basis-rev 1
                                             :slots
                                             {[:resource resource-key]
                                              {:watch {:keys #{[:journals]}
                                                       :all? false}
                                               :value [journal-a journal-b]}}})
                                (p/rejected
                                 (js/Error. "unexpected journal resource"))))
                            subs/<load-block
                            (fn [_graph-id block-uuid]
                              (swap! block-loads conj block-uuid)
                              (p/resolved
                               {:basis-rev 1
                                :slots {[:block block-uuid]
                                        {:value journal-a-block}}}))]
              (let [outer (mount-hook! db-hooks/use-resource [:journals])]
                (p/let [_ (p/delay 0)
                        _ (is (= [journal-a journal-b]
                                 @(:value outer)))
                        _ (is (= [[:journals]] @resource-loads))
                        mounted-page (mount-hook! db-hooks/use-block journal-a)
                        _ (p/delay 0)]
                  (is (= "Journal A" (:block/title @(:value mounted-page))))
                  (is (= [journal-a] @block-loads)
                      "Only the mounted journal root loads on demand.")
                  (unmount! mounted-page)
                  (unmount! outer))))))))
