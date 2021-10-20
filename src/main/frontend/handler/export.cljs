(ns frontend.handler.export
  (:require [cljs.pprint :as pprint]
            [clojure.set :as s]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.extensions.zip :as zip]
            [frontend.external.roam-export :as roam-export]
            [frontend.format :as f]
            [frontend.format.protocol :as fp]
            [frontend.handler.file :as file-handler]
            [frontend.modules.file.core :as outliner-file]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.publishing.html :as html]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.format.mldoc :as mldoc]
            [goog.dom :as gdom]
            [promesa.core :as p]))

(defn- get-page-content
  [repo page]
  (outliner-file/tree->file-content
   (outliner-tree/blocks->vec-tree
    (db/get-page-blocks-no-cache repo page) page) {:init-level 1}))

(defn- get-page-content-debug
  [repo page]
  (outliner-file/tree->file-content
   (outliner-tree/blocks->vec-tree
    (db/get-page-blocks-no-cache repo page) page) {:init-level 1
                                              :heading-to-list? true}))
(defn- get-file-content
  [repo file-path]
  (if-let [page-name
           (ffirst (d/q '[:find ?pn
                          :in $ ?path
                          :where
                          [?p :block/file ?f]
                          [?p :block/name ?pn]
                          [?f :file/path ?path]]
                        (db/get-conn repo) file-path))]
    (get-page-content repo page-name)
    (ffirst
     (d/q '[:find ?content
            :in $ ?path
            :where
            [?f :file/path ?path]
            [?f :file/content ?content]]
          (db/get-conn repo) file-path))))

(defn- get-blocks-contents
  [repo root-block-uuid]
  (->
   (db/get-block-and-children repo root-block-uuid)
   (outliner-tree/blocks->vec-tree (str root-block-uuid))
   (outliner-file/tree->file-content {:init-level 1})))

(defn- get-block-content
  [block]
  (->
   [block]
   (outliner-tree/blocks->vec-tree (str (:block/uuid block)))
   (outliner-file/tree->file-content {:init-level 1})))


(defn export-repo-as-json!
  [repo]
  (when-let [db (db/get-conn repo)]
    (let [db-json (db/db->json db)
          data-str (str "data:text/json;charset=utf-8," (js/encodeURIComponent db-json))]
      (when-let [anchor (gdom/getElement "download-as-json")]
        (.setAttribute anchor "href" data-str)
        (.setAttribute anchor "download" (str (last (string/split repo #"/")) ".json"))
        (.click anchor)))))

(defn download-file!
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [content (get-file-content repo file-path)]
      (let [data (js/Blob. ["\ufeff" (array content)] ; prepend BOM
                           (clj->js {:type "text/plain;charset=utf-8,"}))]
        (let [anchor (gdom/getElement "download")
              url (js/window.URL.createObjectURL data)]
          (.setAttribute anchor "href" url)
          (.setAttribute anchor "download" file-path)
          (.click anchor))))))

(defn export-repo-as-html!
  [repo]
  (when-let [db (db/get-conn repo)]
    (let [[db asset-filenames]           (if (state/all-pages-public?)
                                           (db/clean-export! db)
                                           (db/filter-only-public-pages-and-blocks db))
          db-str       (db/db->string db)
          state        (select-keys @state/state
                                    [:ui/theme :ui/cycle-collapse
                                     :ui/sidebar-collapsed-blocks
                                     :ui/show-recent?
                                     :config])
          state        (update state :config (fn [config]
                                               {"local" (get config repo)}))
          raw-html-str (html/publishing-html db-str (pr-str state))
          html-str     (str "data:text/html;charset=UTF-8,"
                            (js/encodeURIComponent raw-html-str))]
      (if (util/electron?)
        (js/window.apis.exportPublishAssets raw-html-str (config/get-custom-css-path) (config/get-repo-dir repo) (clj->js asset-filenames))

        (when-let [anchor (gdom/getElement "download-as-html")]
          (.setAttribute anchor "href" html-str)
          (.setAttribute anchor "download" "index.html")
          (.click anchor))))))

(defn- get-file-contents
  ([repo]
   (get-file-contents repo {:init-level 1}))
  ([repo file-opts]
   (let [conn (db/get-conn repo)]
     (->> (d/q '[:find ?n ?fp
                 :where
                 [?e :block/file ?f]
                 [?f :file/path ?fp]
                 [?e :block/name ?n]] conn)
          (mapv (fn [[page-name file-path]]
                  [file-path
                   (outliner-file/tree->file-content
                    (outliner-tree/blocks->vec-tree
                     (db/get-page-blocks-no-cache page-name) page-name)
                    file-opts)]))))))

(defn export-repo-as-zip!
  [repo]
  (let [files (get-file-contents repo)
        [owner repo-name] (util/get-git-owner-and-repo repo)
        repo-name (str owner "-" repo-name)]
    (when (seq files)
      (p/let [zipfile (zip/make-zip repo-name files repo)]
        (when-let [anchor (gdom/getElement "download")]
          (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
          (.setAttribute anchor "download" (.-name zipfile))
          (.click anchor))))))

(defn export-git-repo-as-zip!
  [repo]
  (p/let [files (file-handler/load-files repo)
          contents (file-handler/load-multiple-files repo files)
          files (zipmap files contents)
          [owner repo-name] (util/get-git-owner-and-repo repo)
          repo-name (str owner "-" repo-name)]
    (when (seq files)
      (p/let [zipfile (zip/make-zip repo-name files repo)]
        (when-let [anchor (gdom/getElement "download")]
          (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
          (.setAttribute anchor "download" (.-name zipfile))
          (.click anchor))))))

(defn get-md-file-contents
  [repo]
  (let [conn (db/get-conn repo)]
    (filter (fn [[path _]]
              (let [path (string/lower-case path)]
                (re-find #"\.(?:md|markdown)$" path)))
            (get-file-contents repo {:init-level 1
                                     :heading-to-list? true}))))


(defn- get-embed-pages-from-ast [ast]
  (let [result (transient #{})]
    (doseq [item ast]
      (walk/prewalk (fn [i]
                      (cond
                        (and (vector? i)
                             (= "Macro" (first i))
                             (= "embed" (some-> (:name (second i))
                                                (string/lower-case)))
                             (some-> (:arguments (second i))
                                     (first)
                                     (string/starts-with? "[["))
                             (some-> (:arguments (second i))
                                     (first)
                                     (string/ends-with? "]]")))
                        (let [arguments (:arguments (second i))
                              page-ref (first arguments)
                              page-name (-> page-ref
                                          (subs 2)
                                          (#(subs % 0 (- (count %) 2)))
                                          (string/lower-case))]
                          (conj! result page-name)
                          i)
                        :else
                        i))
                    item))
    (persistent! result)))

(defn- get-embed-blocks-from-ast [ast]
  (let [result (transient #{})]
    (doseq [item ast]
      (walk/prewalk (fn [i]
                      (cond
                        (and (vector? i)
                             (= "Macro" (first i))
                             (= "embed" (some-> (:name (second i))
                                                (string/lower-case)))
                             (some-> (:arguments (second i))
                                     (first)
                                     (string/starts-with? "(("))
                             (some-> (:arguments (second i))
                                     (first)
                                     (string/ends-with? "))")))
                        (let [arguments (:arguments (second i))
                              block-ref (first arguments)
                              block-uuid (-> block-ref
                                             (subs 2)
                                             (#(subs % 0 (- (count %) 2))))]
                          (conj! result block-uuid)
                          i)
                        :else
                        i)) item))
    (persistent! result)))

(defn- get-block-refs-from-ast [ast]
  (let [result (transient #{})]
    (doseq [item ast]
      (walk/prewalk (fn [i]
                      (cond
                        (and (vector? i)
                             (= "Block_ref" (first i))
                             (some? (second i)))
                        (let [block-uuid (second i)]
                          (conj! result block-uuid)
                          i)
                        :else
                        i)) item))
    (persistent! result)))

(declare get-page-page&block-refs)
(defn get-block-page&block-refs [repo block-uuid embed-pages embed-blocks block-refs]
  (let [block (db/entity [:block/uuid (uuid block-uuid)])
        block-content (get-blocks-contents repo (:block/uuid block))
        format (:block/format block)
        ast (mldoc/->edn block-content (mldoc/default-config format))
        embed-pages-new  (get-embed-pages-from-ast ast)
        embed-blocks-new  (get-embed-blocks-from-ast ast)
        block-refs-new (get-block-refs-from-ast ast)
        embed-pages-diff (s/difference embed-pages-new embed-pages)
        embed-blocks-diff (s/difference embed-blocks-new embed-blocks)
        block-refs-diff (s/difference block-refs-new block-refs)
        embed-pages* (s/union embed-pages-new embed-pages)
        embed-blocks* (s/union embed-blocks-new embed-blocks)
        block-refs* (s/union block-refs-new block-refs)
        [embed-pages-1 embed-blocks-1 block-refs-1]
        (->>
         (mapv (fn [page-name]
                 (let [{:keys [embed-pages embed-blocks block-refs]}
                       (get-page-page&block-refs repo page-name embed-pages* embed-blocks* block-refs*)]
                   [embed-pages embed-blocks block-refs])) embed-pages-diff)
         (apply mapv vector) ; [[1 2 3] [4 5 6] [7 8 9]] -> [[1 4 7] [2 5 8] [3 6 9]]
         (mapv #(apply s/union %)))
        [embed-pages-2 embed-blocks-2 block-refs-2]
        (->>
         (mapv (fn [block-uuid]
                 (let [{:keys [embed-pages embed-blocks block-refs]}
                       (get-block-page&block-refs repo block-uuid embed-pages* embed-blocks* block-refs*)]
                   [embed-pages embed-blocks block-refs])) (s/union embed-blocks-diff block-refs-diff))
         (apply mapv vector)
         (mapv #(apply s/union %)))]
    {:embed-pages (s/union embed-pages-1 embed-pages-2 embed-pages*)
     :embed-blocks (s/union embed-blocks-1 embed-blocks-2 embed-blocks*)
     :block-refs (s/union block-refs-1 block-refs-2 block-refs*)}))

(defn get-blocks-page&block-refs [repo block-uuids embed-pages embed-blocks block-refs]
  (let [[embed-pages embed-blocks block-refs]
        (reduce (fn [[embed-pages embed-blocks block-refs] block-uuid]
                  (let [result (get-block-page&block-refs repo block-uuid embed-pages embed-blocks block-refs)]
                    [(:embed-pages result) (:embed-blocks result) (:block-refs result)]))
                [embed-pages embed-blocks block-refs] block-uuids)]
    {:embed-pages embed-pages
     :embed-blocks embed-blocks
     :block-refs block-refs}))

(defn get-page-page&block-refs [repo page-name embed-pages embed-blocks block-refs]
  (let [page-name* (string/lower-case page-name)
        page-content (get-page-content repo page-name*)
        format (:block/format (db/entity [:block/name page-name*]))
        ast (mldoc/->edn page-content (mldoc/default-config format))
        embed-pages-new (get-embed-pages-from-ast ast)
        embed-blocks-new (get-embed-blocks-from-ast ast)
        block-refs-new (get-block-refs-from-ast ast)
        embed-pages-diff (s/difference embed-pages-new embed-pages)
        embed-blocks-diff (s/difference embed-blocks-new embed-blocks)
        block-refs-diff (s/difference block-refs-new block-refs)
        embed-pages* (s/union embed-pages-new embed-pages)
        embed-blocks* (s/union embed-blocks-new embed-blocks)
        block-refs* (s/union block-refs-new block-refs)
        [embed-pages-1 embed-blocks-1 block-refs-1]
        (->>
         (mapv (fn [page-name]
                 (let [{:keys [embed-pages embed-blocks block-refs]}
                       (get-page-page&block-refs repo page-name embed-pages* embed-blocks* block-refs*)]
                   [embed-pages embed-blocks block-refs])) embed-pages-diff)
         (apply mapv vector)
         (mapv #(apply s/union %)))
        [embed-pages-2 embed-blocks-2 block-refs-2]
        (->>
         (mapv (fn [block-uuid]
                 (let [{:keys [embed-pages embed-blocks block-refs]}
                       (get-block-page&block-refs repo block-uuid embed-pages* embed-blocks* block-refs*)]
                   [embed-pages embed-blocks block-refs])) (s/union embed-blocks-diff block-refs-diff))
         (apply mapv vector)
         (mapv #(apply s/union %)))]
    {:embed-pages (s/union embed-pages-1 embed-pages-2 embed-pages*)
     :embed-blocks (s/union embed-blocks-1 embed-blocks-2 embed-blocks*)
     :block-refs (s/union block-refs-1 block-refs-2 block-refs*)}))

(defn- get-export-references [repo {:keys [embed-pages embed-blocks block-refs]}]
  (let [embed-blocks-and-contents
        (mapv (fn [id]
                (let [id-s (str id)
                      id (uuid id-s)]
                  [id-s
                   [(get-blocks-contents repo id)
                    (get-block-content (db/pull [:block/uuid id]))]]))
              (s/union embed-blocks block-refs))

        embed-pages-and-contents
        (mapv (fn [page-name] [page-name (get-page-content repo page-name)]) embed-pages)]
    {:embed_blocks embed-blocks-and-contents
     :embed_pages embed-pages-and-contents}))

(defn- export-files-as-markdown [repo files heading-to-list?]
  (->> files
       (mapv (fn [{:keys [path content names format]}]
               (when (first names)
                 [path (fp/exportMarkdown f/mldoc-record content
                                          (f/get-default-config format {:export-heading-to-list? heading-to-list?})
                                          (js/JSON.stringify
                                           (clj->js (get-export-references
                                                     repo
                                                     (get-page-page&block-refs repo (first names) #{} #{} #{})))))])))))

(defn- export-files-as-opml [repo files]
  (->> files
       (mapv (fn [{:keys [path content names format]}]
               (when (first names)
                   (let [path
                         (string/replace
                          (string/lower-case path) #"(.+)\.(md|markdown|org)" "$1.opml")]
                     [path (fp/exportOPML f/mldoc-record content
                                          (f/get-default-config format)
                                          (first names)
                                          (js/JSON.stringify
                                           (clj->js (get-export-references
                                                     repo
                                                     (get-page-page&block-refs repo (first names) #{} #{} #{})))))]))))))

(defn export-blocks-as-aux
  [repo root-block-uuids auxf]
  {:pre [(> (count root-block-uuids) 0)]}
  (let [f #(get-export-references repo (get-blocks-page&block-refs repo % #{} #{} #{}))
        root-blocks (mapv #(db/entity [:block/uuid %]) root-block-uuids)
        blocks (mapcat #(db/get-block-and-children repo %) root-block-uuids)
        refs (f (mapv #(str (:block/uuid %)) blocks))
        contents (mapv #(get-blocks-contents repo %) root-block-uuids)
        content (string/join "\n" (mapv string/trim-newline contents))
        format (or (:block/format (first root-blocks)) (state/get-preferred-format))]
    (auxf content format refs)))

(defn export-blocks-as-opml
  [repo root-block-uuids]
  (export-blocks-as-aux repo root-block-uuids
                        #(fp/exportOPML f/mldoc-record %1
                                        (f/get-default-config %2)
                                        "untitled"
                                        (js/JSON.stringify (clj->js %3)))))

(defn export-blocks-as-markdown
  [repo root-block-uuids indent-style remove-options]
  (export-blocks-as-aux repo root-block-uuids
                        #(fp/exportMarkdown f/mldoc-record %1
                                            (f/get-default-config
                                             %2
                                             {:export-md-indent-style indent-style
                                              :export-md-remove-options remove-options})
                                            (js/JSON.stringify (clj->js %3)))))
(defn export-blocks-as-html
  [repo root-block-uuids]
  (export-blocks-as-aux repo root-block-uuids
                        #(fp/toHtml f/mldoc-record %1
                                    (f/get-default-config %2)
                                    (js/JSON.stringify (clj->js %3)))))

(defn- convert-md-files-unordered-list-or-heading
  [repo files heading-to-list?]
  (->> files
       (mapv (fn [{:keys [path content names format]}]
               (when (first names)
                 [path (fp/exportMarkdown f/mldoc-record content
                                          (f/get-default-config format {:export-heading-to-list? heading-to-list? :export-keep-properties? true})
                                          nil)])))
       (remove nil?)))

(defn- get-file-contents-with-suffix
  [repo]
  (let [conn (db/get-conn repo)
        md-files (get-md-file-contents repo)]
    (->>
     md-files
     (map (fn [[path content]] {:path path :content content
                                :names (d/q '[:find [?n ?n2]
                                              :in $ ?p
                                              :where [?e :file/path ?p]
                                              [?e2 :block/file ?e]
                                              [?e2 :block/name ?n]
                                              [?e2 :block/original-name ?n2]] conn path)
                                :format (f/get-format path)})))))


(defn export-repo-as-markdown!
  [repo]
  (when-let [files (get-file-contents-with-suffix repo)]
    (let [heading-to-list? (state/export-heading-to-list?)
          files
          (export-files-as-markdown repo files heading-to-list?)
          zip-file-name (str repo "_markdown_" (quot (util/time-ms) 1000))]
      (p/let [zipfile (zip/make-zip zip-file-name files repo)]
        (when-let [anchor (gdom/getElement "export-as-markdown")]
          (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
          (.setAttribute anchor "download" (.-name zipfile))
          (.click anchor))))))

(defn export-page-as-markdown!
  [page-name]
  (when-let [repo (state/get-current-repo)]
    (when-let [file (db/get-page-file page-name)]
      (when-let [path (:file/path file)]
        (when-let [content (get-page-content repo page-name)]
          (let [names [page-name]
                format (f/get-format path)
                files [{:path path :content content :names names :format format}]]
            (let [files
                  (export-files-as-markdown repo files (state/export-heading-to-list?))]
              (let [data (js/Blob. [(second (first files))]
                                   (clj->js {:type "text/plain;charset=utf-8,"}))]
                (let [anchor (gdom/getElement "export-page-as-markdown")
                      url (js/window.URL.createObjectURL data)]
                  (.setAttribute anchor "href" url)
                  (.setAttribute anchor "download" path)
                  (.click anchor))))))))))

(defn export-repo-as-opml!
  [repo]
  (when-let [repo (state/get-current-repo)]
    (when-let [files (get-file-contents-with-suffix repo)]
      (let [files (export-files-as-opml repo files)
            zip-file-name (str repo "_opml_" (quot (util/time-ms) 1000))]
        (p/let [zipfile (zip/make-zip zip-file-name files repo)]
          (when-let [anchor (gdom/getElement "export-as-opml")]
            (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
            (.setAttribute anchor "download" (.-name zipfile))
            (.click anchor)))))))

(defn export-page-as-opml!
  [page-name]
  (when-let [repo (state/get-current-repo)]
    (when-let [file (db/get-page-file page-name)]
      (when-let [path (:file/path file)]
        (when-let [content (get-page-content repo page-name)]
          (let [names [page-name]
                format (f/get-format path)
                files [{:path path :content content :names names :format format}]]
            (let [files (export-files-as-opml repo files)]
              (let [data (js/Blob. [(second (first files))]
                                   (clj->js {:type "text/plain;charset=utf-8,"}))]
                (let [anchor (gdom/getElement "export-page-as-opml")
                      url (js/window.URL.createObjectURL data)
                      opml-path (string/replace (string/lower-case path) #"(.+)\.(md|org|markdown)$" "$1.opml")]
                  (.setAttribute anchor "href" url)
                  (.setAttribute anchor "download" opml-path)
                  (.click anchor))))))))))

(defn convert-page-markdown-unordered-list-or-heading!
  [page-name]
  (when-let [repo (state/get-current-repo)]
    (when-let [file (db/get-page-file page-name)]
      (when-let [path (:file/path file)]
        (when-let [content (get-page-content repo page-name)]
          (let [names [page-name]
                format (f/get-format path)
                files [{:path path :content content :names names :format format}]]
            (let [files (convert-md-files-unordered-list-or-heading repo files (state/export-heading-to-list?))]
              (let [data (js/Blob. [(second (first files))]
                                   (clj->js {:type "text/plain;charset=utf-8,"}))]
                (let [anchor (gdom/getElement "convert-markdown-to-unordered-list-or-heading")
                      url (js/window.URL.createObjectURL data)]
                  (.setAttribute anchor "href" url)
                  (.setAttribute anchor "download" path)
                  (.click anchor))))))))))

(defn- dissoc-properties [m ks]
  (if (:block/properties m)
    (update m :block/properties
            (fn [v]
              (apply dissoc v ks)))
    m))

(defn- nested-select-keys
  [keyseq vec-tree]
  (walk/postwalk
   (fn [x]
     (cond
       (and (map? x) (contains? x :block/uuid))
       (-> x
           (s/rename-keys {:block/uuid :block/id
                           :block/original-name :block/page-name})
           (dissoc-properties [:id])
           (select-keys keyseq))

       :else
       x))
   vec-tree))

(defn- blocks [conn]
  {:version 1
   :blocks
   (->> (d/q '[:find (pull ?b [*])
               :in $
               :where
               [?b :block/file]
               [?b :block/original-name]
               [?b :block/name]] conn)

        (map (fn [[{:block/keys [name] :as page}]]
               (assoc page
                      :block/children
                      (outliner-tree/blocks->vec-tree
                       (db/get-page-blocks-no-cache
                        (state/get-current-repo)
                        name
                        {:transform? false}) name))))

        (nested-select-keys
         [:block/id
          :block/page-name
          :block/properties
          :block/heading-level
          :block/format
          :block/children
          :block/title
          :block/body
          :block/content]))})

(defn- file-name [repo extension]
  (-> (string/replace repo config/local-db-prefix "")
      (string/replace #"^/+" "")
      (str "_" (quot (util/time-ms) 1000))
      (str "." (string/lower-case (name extension)))))

(defn export-repo-as-edn-v2!
  [repo]
  (when-let [conn (db/get-conn repo)]
    (let [edn-str (with-out-str
                    (pprint/pprint
                     (blocks conn)))
          data-str (str "data:text/edn;charset=utf-8," (js/encodeURIComponent edn-str))]
      (when-let [anchor (gdom/getElement "download-as-edn-v2")]
        (.setAttribute anchor "href" data-str)
        (.setAttribute anchor "download" (file-name repo :edn))
        (.click anchor)))))

(defn- nested-update-id
  [vec-tree]
  (walk/postwalk
   (fn [x]
     (if (and (map? x) (contains? x :block/id))
       (update x :block/id str)
       x))
   vec-tree))

(defn export-repo-as-json-v2!
  [repo]
  (when-let [conn (db/get-conn repo)]
    (let [json-str
          (-> (blocks conn)
              nested-update-id
              clj->js
              js/JSON.stringify)
          data-str (str "data:text/json;charset=utf-8,"
                        (js/encodeURIComponent json-str))]
      (when-let [anchor (gdom/getElement "download-as-json-v2")]
        (.setAttribute anchor "href" data-str)
        (.setAttribute anchor "download" (file-name repo :json))
        (.click anchor)))))

;;;;;;;;;;;;;;;;;;;;;;;;;
;; Export to roam json ;;
;;;;;;;;;;;;;;;;;;;;;;;;;

;; https://roamresearch.com/#/app/help/page/Nxz8u0vXU
;; export to roam json according to above spec
(defn- roam-json [conn]
  (->> (d/q '[:find (pull ?b [*])
              :in $
              :where
              [?b :block/file]
              [?b :block/original-name]
              [?b :block/name]] conn)

       (map (fn [[{:block/keys [name] :as page}]]
              (assoc page
                     :block/children
                     (outliner-tree/blocks->vec-tree
                      (db/get-page-blocks-no-cache
                       (state/get-current-repo)
                       name
                       {:transform? false}) name))))

       (roam-export/traverse
        [:page/title
         :block/string
         :block/uid
         :block/children])))

(defn export-repo-as-roam-json!
  [repo]
  (when-let [conn (db/get-conn repo)]
    (let [json-str
          (-> (roam-json conn)
              clj->js
              js/JSON.stringify)
          data-str (str "data:text/json;charset=utf-8,"
                        (js/encodeURIComponent json-str))]
      (when-let [anchor (gdom/getElement "download-as-roam-json")]
        (.setAttribute anchor "href" data-str)
        (.setAttribute anchor "download" (file-name (str repo "_roam") :json))
        (.click anchor)))))
