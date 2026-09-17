(ns logseq.api.editor-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.commands :as commands]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.code :as code-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export :as export-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.api.db-based :as db-based-api]
            [logseq.api.editor :as api-editor]
            [logseq.api.test-helper :as api-test]
            [promesa.core :as p]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(defn- collect-titles
  [nodes]
  (mapcat (fn [node]
            (let [m (if (map? node) node (api-test/js->clj-kw node))]
              (cons (api-test/api-title m)
                    (collect-titles (or (:children m) (:block/children m) [])))))
          (cond
            (nil? nodes) []
            (sequential? nodes) nodes
            :else [nodes])))

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
            (p/let [page (test-helper/find-page-by-title "Editor API Page")
                    result (api-editor/insert_batch_block
                            (str (:block/uuid page))
                            #js [#js {:content "batch-1"
                                      :children #js [#js {:content "batch-1.1"}]}
                                 #js {:content "batch-2"}]
                            #js {:sibling false})
                    titles (map api-test/api-title (api-test/js->clj-kw result))
                    tree (api-editor/get_page_blocks_tree "Editor API Page")
                    tree-titles (set (collect-titles (api-test/js->clj-kw tree)))]
              (is (or (= ["batch-1" "batch-1.1" "batch-2"] titles)
                      (and (contains? tree-titles "batch-1")
                           (contains? tree-titles "batch-1.1")
                           (contains? tree-titles "batch-2")))))))
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
              (is (= 8 (or (some-> value (aget "value")) value)))
              (is (or (some? (some-> properties (aget ":plugin.property._test_plugin/score")))
                      (some? (some-> properties (aget "score")))))
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
    (let [page (test-helper/find-page-by-title "Editor API Page")
          alpha (test-helper/find-block-by-content "alpha")]
      (state/swap-state! assoc :route-match {:data {:name :page}
                                            :path-params {:name (str (:block/uuid page))}})
      (-> (api-test/with-plugin-api
            (fn []
              (p/with-redefs [state/get-current-page (constantly (str (:block/uuid page)))]
                (p/let [current-page (api-editor/get_current_page)
                        current-tree (api-editor/get_current_page_blocks_tree)
                        current-block (p/with-redefs [state/get-edit-block (constantly alpha)]
                                        (api-editor/get_current_block nil))]
                  (is (= "Editor API Page" (api-test/api-title current-page)))
                  (is (some #{"alpha"} (map api-test/api-title (api-test/js->clj-kw current-tree))))
                  (is (= "alpha" (api-test/api-title current-block)))))))
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
                    result (api-editor/set_block_collapsed uuid' true)]
              (is (nil? result)))))
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
                      (true? (aget deleted "recycled"))
                      (some? (aget deleted ":logseq.property/deleted-at"))
                      (some? (aget deleted "deletedAt"))))
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
                      _ (p/with-redefs [editor-handler/open-block-in-sidebar!
                                        (fn [_block-id]
                                          (state/update-state! :sidebar/blocks
                                                               (fn [blocks]
                                                                 (cons [(state/get-current-repo)
                                                                        (:db/id alpha)
                                                                        :block]
                                                                       (or blocks [])))))
                                        editor-handler/select-block!
                                        (fn [block-uuid]
                                          (reset! selected block-uuid))]
                          (p/do!
                           (api-editor/open_in_right_sidebar uuid')
                           (api-editor/select_block uuid')))]
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

(deftest delete-recycled-page-permanently-removes-page
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [created (api-editor/create_page "Permanent Delete Page" nil #js {:redirect false})
                    uuid' (:uuid (api-test/js->clj-kw created))
                    _ (api-editor/delete_page "Permanent Delete Page")
                    recycled (api-editor/get_page uuid')
                    _ (api-editor/delete_recycled_page_permanently uuid')
                    gone (api-editor/get_page uuid')]
              (is (or (true? (aget recycled "recycled"))
                      (some? (aget recycled ":logseq.property/deleted-at"))
                      (some? (aget recycled "deletedAt"))))
              (is (nil? gone)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest create-page-with-properties-and-existing-lookup
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [created (api-editor/create_page
                             "Property Page"
                             #js {:score 3}
                             #js {:redirect false})
                    again (api-editor/create_page "Property Page" nil #js {:redirect false})
                    missing (api-editor/get_page "Missing Page")
                    by-uuid (api-editor/get_page (:uuid (api-test/js->clj-kw created)))
                    properties (api-editor/get_page_properties "Property Page")]
              (is (= (:uuid (api-test/js->clj-kw created))
                     (:uuid (api-test/js->clj-kw again))))
              (is (nil? missing))
              (is (= "Property Page" (api-test/api-title by-uuid)))
              (is (some? properties)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest create-journal-page-rejects-invalid-date
  (is (nil? (api-editor/create_journal_page (js/Date. "not-a-date")))))

(deftest edit-exit-and-code-editor-helpers
  (let [edited (atom nil)
        escaped (atom nil)
        saved (atom false)]
    (with-redefs [editor-handler/edit-block!
                  (fn [block pos opts]
                    (reset! edited [(:block/uuid block) pos opts]))
                  editor-handler/escape-editing
                  (fn [opts]
                    (reset! escaped opts))
                  code-handler/save-code-editor!
                  (fn []
                    (reset! saved true)
                    :saved)]
      (is (nil? (api-editor/exit_editing_mode true)))
      (is (= {:select? true} @escaped))
      (is (= :saved (api-editor/save_focused_code_editor_content)))
      (is (true? @saved))))
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [alpha (test-helper/find-block-by-content "alpha")
                    result (p/with-redefs [editor-handler/edit-block!
                                           (fn [block pos _opts]
                                             {:uuid (:block/uuid block)
                                              :pos pos})]
                             (api-editor/edit_block (str (:block/uuid alpha)) #js {:pos 2}))]
              (is (= (:block/uuid alpha) (:uuid result)))
              (is (= 2 (:pos result))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest editing-cursor-helpers-use-input
  (let [inserted (atom nil)
        focused (atom 0)
        input #js {:focus (fn [] (swap! focused inc))}]
    (with-redefs [state/get-edit-input-id (constantly "edit-block")
                  commands/simple-insert! (fn [input-id content _opts]
                                            (reset! inserted [input-id content]))
                  gdom/getElement (fn [_] input)
                  cursor/get-caret-pos (fn [_] {:pos 4 :line 1})
                  util/el-visible-in-viewport? (fn [_] true)]
      (api-editor/insert_at_editing_cursor "xyz")
      (api-editor/restore_editing_cursor)
      (is (= ["edit-block" "xyz"] @inserted))
      (is (= 2 @focused))
      (is (= 4 (aget (api-editor/get_editing_cursor_position) "pos"))))))

(deftest selected-blocks-and-current-block-from-selection
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [alpha (test-helper/find-block-by-content "alpha")
                    el #js {:getAttribute (fn [_] (str (:block/uuid alpha)))}
                    selected (p/with-redefs [state/selection? (constantly [el])]
                               (api-editor/get_selected_blocks))
                    current (p/with-redefs [state/get-edit-block (constantly nil)
                                            state/get-selection-blocks (constantly [el])
                                            state/get-editor-block-container (constantly nil)]
                              (api-editor/get_current_block nil))]
              (is (= "alpha" (api-test/api-title (aget selected 0))))
              (is (= "alpha" (api-test/api-title current))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest append-to-current-page-overload
  (async done
    (load-editor-page!)
    (let [page (test-helper/find-page-by-title "Editor API Page")]
      (-> (api-test/with-plugin-api
            (fn []
              (p/with-redefs [state/get-current-page (constantly (str (:block/uuid page)))]
                (p/let [appended (api-editor/append_block_in_page "current-page-block")
                        block (api-editor/get_block (aget appended "uuid") #js {})]
                  (is (= "current-page-block" (api-test/api-title appended)))
                  (is (= (:db/id page)
                         (get-in (api-test/js->clj-kw block) [:parent :id])))))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest download-graph-exports-current-repo
  (let [zip-repos (atom [])
        sqlite-repos (atom [])]
    (with-redefs [export-handler/export-repo-as-zip!
                  (fn [repo] (swap! zip-repos conj repo) :zip)
                  export-handler/export-repo-as-sqlite-db!
                  (fn [repo] (swap! sqlite-repos conj repo) :sqlite)]
      (is (= :sqlite (api-editor/download_graph_db)))
      (is (= :zip (api-editor/download_graph_pages)))
      (is (= ["logseq_db_test-db"] @sqlite-repos))
      (is (= ["logseq_db_test-db"] @zip-repos)))))

(deftest open-pdf-viewer-sets-current-pdf
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/with-redefs [assets-handler/<make-asset-url (fn [href] (p/resolved href))
                            pdf-assets/inflate-asset (fn [href opts]
                                                       {:href href :opts opts})]
              (p/do!
               (api-editor/open_pdf_viewer "https://example.com/doc.pdf")
               (is (= "https://example.com/doc.pdf"
                      (:href (:pdf/current (state/get-state)))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest open-in-right-sidebar-accepts-plugin-slot
  (let [previous (gobj/get js/window "$$callerPluginID")]
    (try
      (gobj/set js/window "$$callerPluginID" "test-plugin")
      (api-editor/open_in_right_sidebar "custom-slot")
      (is (some (fn [[_ id type]]
                  (and (= :plugin type)
                       (= :test-plugin/custom-slot id)))
                (:sidebar/blocks (state/get-state))))
      (finally
        (if (nil? previous)
          (js-delete js/window "$$callerPluginID")
          (gobj/set js/window "$$callerPluginID" previous))))))

(deftest editor-get-block-includes-page-by-default
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [page (test-helper/find-page-by-title "Editor API Page")
                    via-editor (api-editor/get_block (str (:block/uuid page)) nil)
                    alpha (test-helper/find-block-by-content "alpha")
                    block (api-editor/get_block (str (:block/uuid alpha)) #js {:includeChildren true})]
              (is (= "Editor API Page" (api-test/api-title via-editor)))
              (is (= "alpha" (api-test/api-title block)))
              (is (some #{"alpha-child"}
                        (map api-test/api-title (:children (api-test/js->clj-kw block))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest json-block-property-parses-on-read
  (async done
    (load-editor-page!)
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [_ (db-based-api/upsert-property "payload" #js {:type "json"} nil)
                    alpha (test-helper/find-block-by-content "alpha")
                    uuid' (str (:block/uuid alpha))
                    _ (api-editor/upsert_block_property uuid' "payload" #js {:ok true} nil)
                    value (api-editor/get_block_property uuid' "payload")]
              (is (or (true? (aget value "ok"))
                      (true? (aget value "value" "ok"))
                      (true? (get-in (api-test/js->clj-kw value) [:value :ok])))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest collapse-toggle-flag-calls-editor-helpers
  (async done
    (load-editor-page!)
    (let [collapsed (atom [])
          expanded (atom [])]
      (-> (api-test/with-plugin-api
            (fn []
              (p/let [alpha (test-helper/find-block-by-content "alpha")
                      uuid' (str (:block/uuid alpha))]
                (p/with-redefs [editor-handler/collapse-block!
                                (fn [block-uuid]
                                  (swap! collapsed conj block-uuid)
                                  (p/resolved nil))
                                editor-handler/expand-block!
                                (fn [block-uuid]
                                  (swap! expanded conj block-uuid)
                                  (p/resolved nil))
                                util/collapsed? (constantly false)]
                  (p/do!
                   (api-editor/set_block_collapsed uuid' "toggle")
                   (api-editor/set_block_collapsed uuid' #js {:flag false})
                   (is (= [(:block/uuid alpha)] @collapsed))
                   (is (= [(:block/uuid alpha)] @expanded)))))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))
