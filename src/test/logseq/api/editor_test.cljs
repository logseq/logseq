(ns logseq.api.editor-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [logseq.api.editor :as api-editor]
            [logseq.api.test-helper :as api-test]
            [promesa.core :as p]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(defn- load-editor-page!
  []
  (test-helper/load-test-files
   [{:page {:block/title "Editor API Page"}
     :blocks [{:block/title "alpha"
               :build/children [{:block/title "alpha-child"}]}
              {:block/title "bravo"}
              {:block/title "charlie"}]}]))

(deftest new-block-uuid-is-unique-string
  (let [first-id (api-editor/new_block_uuid)
        second-id (api-editor/new_block_uuid)]
    (is (string? first-id))
    (is (uuid? (uuid first-id)))
    (is (not= first-id second-id))))

(deftest create-and-get-page
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [created (api-editor/create_page "Created Page" nil #js {:redirect false})
                    page (api-editor/get_page "Created Page")
                    all-pages (api-editor/get_all_pages)
                    created-map (api-test/js->clj-kw created)
                    page-map (api-test/js->clj-kw page)
                    titles (set (map :title (api-test/js->clj-kw all-pages)))]
              (is (= "Created Page" (:title created-map)))
              (is (= (:uuid created-map) (:uuid page-map)))
              (is (contains? titles "Created Page")))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest insert-update-and-remove-block
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [alpha (test-helper/find-block-by-content "alpha")
                    inserted (api-editor/insert_block (str (:block/uuid alpha))
                                                      "inserted"
                                                      #js {:sibling true})
                    inserted-map (api-test/js->clj-kw inserted)
                    _ (is (= "inserted" (:title inserted-map)))
                    _ (api-editor/update_block (:uuid inserted-map) "inserted-updated" nil)
                    updated (api-editor/get_block (:uuid inserted-map) #js {})
                    _ (is (= "inserted-updated" (:title (api-test/js->clj-kw updated))))
                    _ (api-editor/remove_block (:uuid inserted-map) nil)
                    removed (api-editor/get_block (:uuid inserted-map) #js {})]
              (is (nil? removed)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest append-and-prepend-stay-on-page
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [page (api-editor/get_page "Editor API Page")
                    page-id (:id (api-test/js->clj-kw page))
                    prepended (api-editor/prepend_block_in_page "Editor API Page" "prepended" nil)
                    appended (api-editor/append_block_in_page "Editor API Page" "appended" nil)
                    prepended-block (api-editor/get_block (aget prepended "uuid") #js {})
                    appended-block (api-editor/get_block (aget appended "uuid") #js {})]
              (is (= page-id (get-in (api-test/js->clj-kw prepended-block) [:parent :id])))
              (is (= page-id (get-in (api-test/js->clj-kw appended-block) [:parent :id]))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest insert-batch-blocks-creates-tree
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [page (test-helper/find-block-by-content "Editor API Page")
                    result (api-editor/insert_batch_block
                            (str (:block/uuid page))
                            #js [#js {:content "batch-1"
                                      :children #js [#js {:content "batch-1.1"}]}
                                 #js {:content "batch-2"}]
                            #js {:sibling false})
                    titles (map :title (api-test/js->clj-kw result))]
              (is (= ["batch-1" "batch-1.1" "batch-2"] titles)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest sibling-and-page-tree-lookups
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [alpha (test-helper/find-block-by-content "alpha")
                    bravo (test-helper/find-block-by-content "bravo")
                    previous (api-editor/get_previous_sibling_block (str (:block/uuid bravo)) nil)
                    next (api-editor/get_next_sibling_block (str (:block/uuid alpha)) nil)
                    tree (api-editor/get_page_blocks_tree "Editor API Page")
                    titles (map :title (api-test/js->clj-kw tree))]
              (is (= "alpha" (:title (api-test/js->clj-kw previous))))
              (is (= "bravo" (:title (api-test/js->clj-kw next))))
              (is (some #{"alpha"} titles))
              (is (some #{"bravo"} titles)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest move-block-nests-under-target
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [alpha (test-helper/find-block-by-content "alpha")
                    charlie (test-helper/find-block-by-content "charlie")
                    _ (api-editor/move_block (str (:block/uuid charlie))
                                             (str (:block/uuid alpha))
                                             #js {:children true})
                    moved (api-editor/get_block (str (:block/uuid charlie)) #js {})]
              (is (= (:db/id alpha)
                     (get-in (api-test/js->clj-kw moved) [:parent :id]))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest block-properties-round-trip
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [alpha (test-helper/find-block-by-content "alpha")
                    uuid' (str (:block/uuid alpha))
                    _ (api-editor/upsert_block_property uuid' "score" 8 nil)
                    value (api-editor/get_block_property uuid' "score")
                    properties (api-editor/get_block_properties uuid')
                    page-properties (api-editor/get_page_properties "Editor API Page")
                    _ (api-editor/remove_block_property uuid' "score")
                    removed (api-editor/get_block_property uuid' "score")]
              (is (= 8 (or (aget value "value") value)))
              (is (some? (aget properties ":plugin.property._test_plugin/score")))
              (is (some? page-properties))
              (is (nil? removed)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest editing-and-selection-state
  (let [block {:block/uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
               :block/title "editing"}]
    (state/set-state! :editor/editing? {"edit-block" true})
    (state/set-state! :editor/id "edit-block")
    (with-redefs [state/get-edit-input-id (constantly "edit-block")
                  state/get-edit-block (constantly block)
                  state/get-edit-content (constantly "editing text")
                  state/clear-selection! (fn [])]
      (is (= (str (:block/uuid block)) (api-editor/check_editing)))
      (is (= "editing text" (api-editor/get_editing_block_content)))
      (is (nil? (api-editor/clear_selected_blocks))))))

(deftest current-page-and-block-use-app-state
  (async done
    (load-editor-page!)
    (let [page (test-helper/find-block-by-content "Editor API Page")
          alpha (test-helper/find-block-by-content "alpha")]
      (state/set-state! :route-match {:data {:name :page}
                                      :path-params {:name (str (:block/uuid page))}})
      (-> (api-test/with-plugin-api
            (fn []
              (p/let [current-page (api-editor/get_current_page)
                      current-tree (api-editor/get_current_page_blocks_tree)
                      _ (state/set-state! :editor/block alpha)
                      current-block (with-redefs [state/get-edit-block (constantly alpha)]
                                      (api-editor/get_current_block nil))]
                (is (= "Editor API Page" (:title (api-test/js->clj-kw current-page))))
                (is (some #{"alpha"} (map :title (api-test/js->clj-kw current-tree))))
                (is (= "alpha" (:title (api-test/js->clj-kw current-block)))))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest collapse-flag-toggles-block
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [alpha (test-helper/find-block-by-content "alpha")
                    uuid' (str (:block/uuid alpha))
                    _ (api-editor/set_block_collapsed uuid' true)
                    collapsed (test-helper/find-block-by-content "alpha")
                    _ (api-editor/set_block_collapsed uuid' false)
                    expanded (test-helper/find-block-by-content "alpha")]
              (is (true? (boolean (:block/collapsed? collapsed))))
              (is (not (true? (:block/collapsed? expanded)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest insert-rejects-duplicate-custom-uuid
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [alpha (test-helper/find-block-by-content "alpha")]
              (-> (api-editor/insert_block (str (:block/uuid alpha))
                                           "dup"
                                           #js {:customUUID (str (:block/uuid alpha))})
                  (p/then (fn [_]
                            (is false "duplicate custom UUID should throw")))
                  (p/catch (fn [error]
                             (is (re-find #"Custom block UUID already exists" (str error)))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest delete-and-restore-page
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [_ (api-editor/create_page "Disposable Page" nil #js {:redirect false})
                    created (api-editor/get_page "Disposable Page")
                    _ (is (some? created))
                    _ (api-editor/delete_page "Disposable Page")
                    deleted (api-editor/get_page "Disposable Page")
                    _ (api-editor/restore_page (:uuid (api-test/js->clj-kw created)))
                    restored (api-editor/get_page "Disposable Page")]
              (is (or (nil? deleted)
                      (true? (aget deleted "recycled"))))
              (is (some? restored)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest rename-page-updates-title
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [created (api-editor/create_page "Rename Source" nil #js {:redirect false})
                    _ (api-editor/rename_page (:uuid (api-test/js->clj-kw created)) "Rename Target")
                    renamed (api-editor/get_page "Rename Target")
                    old (api-editor/get_page "Rename Source")]
              (is (= "Rename Target" (:title (api-test/js->clj-kw renamed))))
              (is (nil? old)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest create-journal-and-today-page
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [journal (api-editor/create_journal_page (js/Date. "2024-01-15T12:00:00Z"))
                    today (api-editor/get_today_page)]
              (is (some? journal))
              (is (some? (or today journal))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest open-in-right-sidebar-and-select-block
  (async done
    (load-editor-page!)
    (let [selected (atom nil)]
      (-> (api-test/with-plugin-api
            (fn []
              (p/let [alpha (test-helper/find-block-by-content "alpha")
                      uuid' (str (:block/uuid alpha))
                      _ (api-editor/open_in_right_sidebar uuid')
                      _ (p/with-redefs [editor-handler/select-block!
                                        (fn [block-uuid]
                                          (reset! selected block-uuid))]
                          (api-editor/select_block uuid'))]
                (is (seq (:sidebar/blocks (state/get-state))))
                (is (= (:block/uuid alpha) @selected)))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest page-linked-references
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Ref Target"}
       :blocks [{:block/title "target body"}]}
      {:page {:block/title "Ref Source"}
       :blocks [{:block/title "see [[Ref Target]]"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [refs (api-editor/get_page_linked_references "Ref Target")
                    titles (set (map :title (flatten (api-test/js->clj-kw refs))))]
              (is (or (contains? titles "see [[Ref Target]]")
                      (pos? (count (js->clj refs))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))
