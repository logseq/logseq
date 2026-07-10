(ns frontend.handler.db-based.page-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db :as db]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(deftest convert-tag-to-page-uses-worker-build-and-transact-test
  (async done
    (let [previous-state @state/state
          original-invoke-db-worker state/<invoke-db-worker
          class-id 42
          class-uuid #uuid "33333333-3333-3333-3333-333333333333"
          tx-data [[:db/retract class-id :block/tags :logseq.class/Tag]
                   [:db/add class-id :block/tags :logseq.class/Page]]
          calls (atom [])]
      (swap! state/state assoc :git/current-repo "test")
      (set! state/<invoke-db-worker
            (fn [& args]
              (swap! calls conj (vec args))
              (case (first args)
                :thread-api/page-exists?
                (p/resolved false)
                :thread-api/get-structured-children
                (p/resolved [])
                :thread-api/build-convert-tag-to-page-tx (p/resolved tx-data)
                :thread-api/transact (p/resolved {:tx-data tx-data})
                (p/rejected (js/Error. (str "unexpected worker call: " (pr-str args)))))))
      (p/with-redefs [shui/dialog-confirm!
                      (fn [& _]
                        (p/resolved true))
                      db/transact!
                      (fn [& _]
                        (throw (js/Error. "renderer DB transact should not be used")))]
        (-> (db-page-handler/convert-tag-to-page!
             {:db/id class-id
              :block/title "Tag"
              :block/uuid class-uuid
              :block/tags [{:db/ident :logseq.class/Tag}]})
            (p/then
	             (fn []
	               (is (= [[:thread-api/page-exists? "test" "Tag" #{:logseq.class/Page}]
	                       [:thread-api/get-structured-children "test" class-id]
                           [:thread-api/build-convert-tag-to-page-tx "test" class-id]
	                       [:thread-api/transact "test" tx-data {:outliner-op :save-block} nil]]
	                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (set! state/<invoke-db-worker original-invoke-db-worker)
               (reset! state/state previous-state)
               (done))))))))

(deftest add-tag-validates-through-worker-test
  (async done
    (let [previous-state @state/state
          original-invoke-db-worker state/<invoke-db-worker
          original-save-current-block! editor-handler/save-current-block!
          block-id #uuid "11111111-1111-1111-1111-111111111111"
          tag-id 42
          calls (atom [])]
      (swap! state/state assoc :git/current-repo "test")
      (set! state/<invoke-db-worker
            (fn [& args]
              (swap! calls conj (vec args))
              (case (first args)
                :thread-api/validate-block-tag (p/resolved {:valid? true})
                :thread-api/undo-redo-set-pending-editor-info (p/resolved nil)
                :thread-api/apply-outliner-ops (p/resolved nil)
                (p/rejected (js/Error. (str "unexpected worker call: " (pr-str args)))))))
      (set! editor-handler/save-current-block!
            (fn []
              (swap! calls conj [:save-current-block])
              (p/resolved nil)))
      (-> (db-page-handler/add-tag "test" block-id {:db/id tag-id})
          (p/then
           (fn []
             (let [calls' (vec (remove #(= :thread-api/undo-redo-set-pending-editor-info (first %)) @calls))
                   apply-call (nth calls' 2)]
               (is (= [[:save-current-block]
                       [:thread-api/validate-block-tag "test" block-id tag-id]
                       [:thread-api/apply-outliner-ops
                        "test"
                        [[:set-block-property [block-id :block/tags tag-id]]]]]
                      (update calls' 2 subvec 0 3)))
               (is (= :set-block-property (:outliner-op (nth apply-call 3)))))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (set! editor-handler/save-current-block! original-save-current-block!)
             (set! state/<invoke-db-worker original-invoke-db-worker)
             (reset! state/state previous-state)
             (done)))))))

(deftest tag-on-chosen-treats-worker-map-as-existing-page-test
  (async done
    (let [block-id #uuid "44444444-4444-4444-4444-444444444444"
          tag-id 44
          calls (atom [])]
      (p/with-redefs [state/get-edit-block
                      (fn []
                        (swap! calls conj [:get-edit-block])
                        {:block/uuid block-id})
                      page-common-handler/<create!
                      (fn [& _]
                        (throw (js/Error. "existing worker-loaded tag should not be recreated")))
                      db-property-handler/set-block-property!
                      (fn [& _]
                        (throw (js/Error. "non-class tag insert should not set a tag property directly")))]
        (-> (db-page-handler/tag-on-chosen-handler
             "Tag"
             {:db/id tag-id
              :block/title "Tag"}
             nil
             "foo #Ta"
             7
             "#Ta")
            (p/then
             (fn []
               (is (= [[:get-edit-block]]
                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally done))))))

(deftest add-tag-shows-worker-validation-notification-test
  (async done
    (let [previous-state @state/state
          original-invoke-db-worker state/<invoke-db-worker
          block-id #uuid "22222222-2222-2222-2222-222222222222"
          tag-id 43
          calls (atom [])]
      (swap! state/state assoc :git/current-repo "test")
      (set! state/<invoke-db-worker
            (fn [& args]
              (swap! calls conj (vec args))
              (case (first args)
                :thread-api/validate-block-tag
                (p/resolved {:valid? false
                             :payload {:message "Duplicate page"
                                       :type :warning}})
                (p/rejected (js/Error. (str "unexpected worker call: " (pr-str args)))))))
      (p/with-redefs [editor-handler/save-current-block!
                      (fn []
                        (swap! calls conj [:save-current-block])
                        (p/resolved nil))
                      notification/show!
                      (fn [message type]
                        (swap! calls conj [:notification message type]))
                      db-property-handler/set-block-property!
                      (fn [& _]
                        (throw (js/Error. "tag should not be added when validation fails")))]
        (-> (db-page-handler/add-tag "test" block-id {:db/id tag-id})
            (p/then
             (fn []
               (is (= [[:save-current-block]
                       [:thread-api/validate-block-tag "test" block-id tag-id]
                       [:notification "Duplicate page" :warning]]
                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (set! state/<invoke-db-worker original-invoke-db-worker)
               (reset! state/state previous-state)
               (done))))))))

(deftest convert-page-to-tag-uses-worker-build-and-transact-test
  (async done
    (let [previous-state @state/state
          original-invoke-db-worker state/<invoke-db-worker
          page-id 43
          page-uuid #uuid "55555555-5555-5555-5555-555555555555"
          tx-data [{:db/id page-id
                    :block/tags #{:logseq.class/Tag}}
                   [:db/retract page-id :block/tags :logseq.class/Page]]
          calls (atom [])]
      (swap! state/state assoc :git/current-repo "test")
      (set! state/<invoke-db-worker
            (fn [& args]
              (case (first args)
                :thread-api/undo-redo-set-pending-editor-info
                (p/resolved nil)

                :thread-api/page-exists? (p/resolved false)
                :thread-api/build-convert-page-to-tag-tx
                (do
                  (swap! calls conj (vec args))
                  (p/resolved tx-data))

                :thread-api/transact
                (do
                  (swap! calls conj (vec args))
                  (p/resolved {:tx-data tx-data}))

                (p/rejected (js/Error. (str "unexpected worker call: " (pr-str args)))))))
      (p/with-redefs [db/transact!
                      (fn [& _]
                        (throw (js/Error. "renderer DB transact should not be used")))]
        (-> (db-page-handler/convert-page-to-tag!
             {:db/id page-id
              :block/title "Page"
              :block/uuid page-uuid
              :block/tags [{:db/ident :logseq.class/Page}]})
            (p/then
	             (fn []
		               (is (= [[:thread-api/build-convert-page-to-tag-tx "test" page-id]
		                       [:thread-api/transact "test" tx-data {:outliner-op :save-block} nil]]
		                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (set! state/<invoke-db-worker original-invoke-db-worker)
               (reset! state/state previous-state)
               (done))))))))
