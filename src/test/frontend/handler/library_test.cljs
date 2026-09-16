(ns frontend.handler.library-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.components.library :as library-component]
            [frontend.handler.library :as library-handler]
            [frontend.state :as state]
            [logseq.common.config :as common-config]
            [logseq.common.uuid :as common-uuid]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(deftest page-uuid-matches-built-in-library-id
  (is (= (common-uuid/gen-uuid :builtin-block-uuid common-config/library-page-name)
         (library-handler/page-uuid))))

(deftest member-ids-use-direct-children
  (is (= #{10 11}
         (library-handler/member-ids
          {:block/_parent [{:db/id 10 :block/title "A"}
                           {:db/id 11 :block/title "B"}]})))
  (is (= #{} (library-handler/member-ids {}))))

(deftest unfile-pages-tx-clears-parent-and-order
  (is (= [[:db/retract 10 :block/parent]
          [:db/retract 10 :block/order]
          [:db/retract 11 :block/parent]
          [:db/retract 11 :block/order]]
         (library-handler/unfile-pages-tx [10 11]))))

(deftest merge-library-select-items-seeds-members-and-keeps-search-hits
  (let [members (library-handler/member-items
                 [{:db/id 1 :block/title "In Library"}])
        search-blocks [{:db/id 2 :block/title "Unfiled"}
                       {:db/id 1 :block/title "In Library"}]]
    (is (= [{:value 1 :label "In Library"}
            {:value 2 :label "Unfiled"}]
           (library-component/merge-library-select-items members search-blocks "")))
    (is (= [{:value 1 :label "In Library"}]
           (library-component/merge-library-select-items members search-blocks "lib")))
    (is (= [{:value 2 :label "Unfiled"}]
           (library-component/merge-library-select-items members search-blocks "unf")))))

(deftest confirm-remove-page-uses-named-unfile-op
  (async done
    (let [previous-state (state/get-state)
          original-invoke-db-worker state/<invoke-db-worker
          calls (atom [])]
      (state/swap-state! assoc :git/current-repo "test")
      (set! state/<invoke-db-worker
            (fn [& args]
              (swap! calls conj (vec args))
              (p/resolved nil)))
      (p/with-redefs [shui/dialog-confirm!
                      (fn [_content opts]
                        (swap! calls conj [:confirm (:id opts)])
                        (p/resolved true))]
        (-> (library-handler/<confirm-remove-page! 42)
            (p/then
             (fn [removed?]
               (is (true? removed?))
               (is (= [[:confirm :library-remove-page]
                       [:thread-api/transact
                        "test"
                        [[:db/retract 42 :block/parent]
                         [:db/retract 42 :block/order]]
                        {:outliner-op :remove-from-library}
                        nil]]
                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (set! state/<invoke-db-worker original-invoke-db-worker)
               (state/replace-state! previous-state)
               (done))))))))
