(ns frontend.handler.db-based.editor-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest wrap-parse-block-markdown-heading-test
  (testing "normal blocks save markdown heading syntax as heading property"
    (is (= {:block/title "Heading"
            :logseq.property/heading 1}
           (select-keys (db-editor-handler/wrap-parse-block
                         {:block/title "# Heading"})
                        [:block/title :logseq.property/heading]))))

  (testing "raw display-type blocks preserve leading hash text"
    (doseq [display-type [:code :math]]
      (is (= {:block/title "# shell comment"
              :logseq.property.node/display-type display-type}
             (select-keys (db-editor-handler/wrap-parse-block
                           {:block/title "# shell comment"
                            :logseq.property.node/display-type display-type})
                          [:block/title
                           :logseq.property/heading
                           :logseq.property.node/display-type]))
          (str "Preserves content for " display-type)))))

(deftest wrap-parse-block-markdown-hashtag-link-test
  (testing "markdown link targets cached from hashtag autocomplete are saved as refs"
    (let [tag-uuid #uuid "5c6cd067-c602-4955-96b8-74b62e08113c"
          tag-page {:db/id 12
                    :block/title "Tag1"
                    :block/name "tag1"
                    :block/uuid tag-uuid
                    :block/tags [{:db/ident :logseq.class/Tag}]}]
      (with-redefs [state/get-state (fn [k]
                                      (case k
                                        :editor/block-refs #{tag-page}
                                        nil))]
        (let [result (db-editor-handler/wrap-parse-block
                      {:block/title "alias [Tag Number One](#Tag1)"})]
          (is (= (str "alias [Tag Number One](#[[" tag-uuid "]])")
                 (:block/title result)))
          (is (= [tag-uuid] (map :block/uuid (:block/refs result)))))))))

(deftest wrap-parse-block-preserves-multiple-block-refs-test
  (testing "multiple block refs are preserved without renderer DB validation"
    (let [block-uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
          ref-uuid-a #uuid "11111111-1111-1111-1111-111111111111"
          ref-uuid-b #uuid "22222222-2222-2222-2222-222222222222"]
      (with-redefs [state/get-state (constantly [])
                    ]
        (let [result (db-editor-handler/wrap-parse-block
                      {:block/uuid block-uuid
                       :block/title (str "((" ref-uuid-a ")) ((" ref-uuid-b "))")})]
          (is (= #{[:block/uuid ref-uuid-a]
                   [:block/uuid ref-uuid-b]}
                 (set (:block/refs result))))
          (is (= 2 (count (:block/refs result)))))))))

(deftest wrap-parse-block-uses-passed-block-without-current-block-rehydration-test
  (testing "passed block data is enough for display-type normalization and cached refs"
    (let [block-uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
          cached-ref-uuid #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
          block {:db/id 1
                 :block/uuid block-uuid
                 :block/title "# shell comment"
                 :logseq.property.node/display-type :code
                 :block/refs [{:db/id 2
                               :block/uuid cached-ref-uuid
                               :block/title "Cached Ref"}]}]
      (with-redefs [state/get-state (constantly [])]
        (let [result (db-editor-handler/wrap-parse-block block)]
          (is (= "# shell comment" (:block/title result)))
          (is (= :code (:logseq.property.node/display-type result)))
          (is (= [cached-ref-uuid]
                 (map :block/uuid (:block/refs result)))))))))

(deftest wrap-parse-block-preserves-cached-map-refs-without-renderer-db-test
  (let [block-uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        cached-ref-uuid #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
        cached-ref {:db/id 2
                    :block/uuid cached-ref-uuid
                    :block/title "Cached Ref"}]
    (with-redefs [state/get-state (fn [k]
                                    (case k
                                      :editor/block-refs #{cached-ref}
                                      nil))]
      (let [result (db-editor-handler/wrap-parse-block
                    {:block/uuid block-uuid
                     :block/title "[[Cached Ref]]"})]
        (is (= (str "[[" cached-ref-uuid "]]")
               (:block/title result)))
        (is (= [cached-ref-uuid]
               (map :block/uuid (:block/refs result))))))))

(deftest save-file-transacts-through-worker-test
  (async done
    (let [calls (atom [])]
      (p/with-redefs [state/get-current-repo (constantly "test")
                      state/<invoke-db-worker
                      (fn [& args]
                        (swap! calls conj (vec args))
                        (p/resolved nil))
                      db/transact!
                      (fn [& _]
                        (throw (js/Error. "renderer DB transact should not be used")))]
        (-> (db-editor-handler/save-file! "pages/a.md" "content")
            (p/then
             (fn []
               (let [[api repo tx-data tx-meta context] (first @calls)
                     file-tx (first tx-data)]
                 (is (= :thread-api/transact api))
                 (is (= "test" repo))
                 (is (= "pages/a.md" (:file/path file-tx)))
                 (is (= "content" (:file/content file-tx)))
                 (is (instance? js/Date (:file/created-at file-tx)))
                 (is (instance? js/Date (:file/last-modified-at file-tx)))
                 (is (nil? tx-meta))
                 (is (nil? context)))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally done))))))

(deftest batch-set-heading-loads-blocks-through-worker-test
  (async done
    (let [block-id #uuid "22222222-2222-2222-2222-222222222222"
          previous-state @state/state
          calls (atom [])]
      (swap! state/state assoc :git/current-repo "test")
      (p/with-redefs [db-async/<get-blocks
                      (fn [repo block-ids]
                        (swap! calls conj [:get-blocks repo block-ids])
                        (p/resolved [{:block/uuid block-id
                                      :block/raw-title "## Heading"}]))
                      property-handler/set-block-property!
                      (fn [id property-id value]
                        (swap! calls conj [:set-property id property-id value])
                        (p/resolved nil))
                      property-handler/batch-set-block-property!
                      (fn [ids property-id value]
                        (swap! calls conj [:batch-set-property ids property-id value])
                        (p/resolved nil))]
        (-> (db-editor-handler/batch-set-heading! [block-id] 2)
            (p/then
             (fn []
               (is (= [[:get-blocks "test" [block-id]]
                       [:set-property block-id :block/title "Heading"]
                       [:batch-set-property [block-id] :logseq.property/heading 2]]
                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (reset! state/state previous-state)
               (done))))))))
