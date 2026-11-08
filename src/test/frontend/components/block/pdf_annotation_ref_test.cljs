(ns frontend.components.block.pdf-annotation-ref-test
  "Clicking a [[uuid]] page-ref to a PDF annotation must open the PDF at the
  highlight (db-test#1511). Shift/meta/ctrl keep normal page-ref behavior."
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.components.block :as block]
            [frontend.db.async :as db-async]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [promesa.core :as p]))

(def ^:private annotation-uuid
  #uuid "6aef96c7-adbb-4fe3-ab3f-54e6aad7c6f3")

(def ^:private annotation-block
  {:db/id 42
   :block/uuid annotation-uuid
   :block/title "highlighted passage"
   :block/tags [{:db/ident :logseq.class/Pdf-annotation}]
   :logseq.property/ls-type :annotation
   :logseq.property.pdf/hl-page 3
   :logseq.property.pdf/hl-value {:id annotation-uuid :page 3}
   :logseq.property/asset {:db/id 7
                           :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                           :block/title "assets/filename.pdf"}})

(def ^:private ordinary-page
  {:db/id 9
   :block/uuid #uuid "22222222-2222-2222-2222-222222222222"
   :block/title "Ordinary page"
   :block/name "ordinary page"
   :block/tags [{:db/ident :logseq.class/Page}]})

(defn- pointer-event
  [{:keys [shift? meta? ctrl? button]
    :or {shift? false meta? false ctrl? false button 0}}]
  #js {:shiftKey shift?
       :metaKey meta?
       :ctrlKey ctrl?
       :button button
       :which 1})

(defn- open-ref!
  [entity event]
  (let [calls (atom [])]
    ;; <open-page-ref launches a promise as a side effect and returns nil, so
    ;; keep the redefs in place until that lookup finishes.
    (-> (p/with-redefs [state/get-current-repo (constantly "test")
                        db-async/<get-alias-source-page (fn [_ _] (p/resolved nil))
                        db-async/<get-block-source (fn [_ _] (p/resolved nil))
                        pdf-assets/open-block-ref! (fn [block]
                                                     (swap! calls conj [:open-pdf (:block/uuid block)]))
                        route-handler/redirect-to-page! (fn [id opts]
                                                          (swap! calls conj [:redirect id opts]))
                        state/sidebar-add-block! (fn [repo db-id type]
                                                   (swap! calls conj [:sidebar repo db-id type]))
                        state/pub-event! (fn [event]
                                           (swap! calls conj [:event event]))
                        page-util/entity-is-current-page? (constantly false)
                        util/mobile? (constantly false)]
          (block/<open-page-ref {} entity event (:block/title entity) false)
          (p/delay 0))
        (p/then (fn [_] @calls)))))

(deftest click-pdf-annotation-page-ref-opens-pdf-not-asset-page-test
  (async done
    (-> (p/let [normal (open-ref! annotation-block (pointer-event {}))
                shift (open-ref! annotation-block (pointer-event {:shift? true}))
                meta (open-ref! annotation-block (pointer-event {:meta? true}))
                ctrl (open-ref! annotation-block (pointer-event {:ctrl? true}))
                middle (open-ref! annotation-block (pointer-event {:button 1}))
                page (open-ref! ordinary-page (pointer-event {}))]
          (testing "normal click on an annotation ref opens the PDF at the highlight"
            (is (= [[:open-pdf annotation-uuid]] normal)
                "Must not redirect to the annotation/asset page (db-test#1511)"))
          (testing "shift-click still opens the annotation block in the sidebar"
            (is (= [[:sidebar "test" 42 :page]] shift)))
          (testing "modifier clicks keep a way to reach the annotation block itself"
            (is (= [[:redirect annotation-uuid {:ignore-alias? nil}]] meta))
            (is (= [[:redirect annotation-uuid {:ignore-alias? nil}]] ctrl))
            (is (= [[:redirect annotation-uuid {:ignore-alias? nil}]] middle)))
          (testing "ordinary page refs still navigate"
            (is (= [[:redirect (:block/uuid ordinary-page) {:ignore-alias? nil}]] page))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))
