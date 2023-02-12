(ns ^:no-doc frontend.handler.export
  (:require ["@capacitor/filesystem" :refer [Encoding Filesystem]]
            [cljs.pprint :as pprint]
            [clojure.set :as s]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.extensions.zip :as zip]
            [frontend.external.roam-export :as roam-export]
            [frontend.format :as f]
            [frontend.format.mldoc :as mldoc]
            [frontend.format.protocol :as fp]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.file.core :as outliner-file]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.publishing.html :as html]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [goog.dom :as gdom]
            [lambdaisland.glogi :as log]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [logseq.graph-parser.property :as gp-property]
            [promesa.core :as p]
            [frontend.handler.notification :as notification]
            [malli.core :as m]
            [cljs.core.match :refer [match]])
  (:import
   [goog.string StringBuffer]))

(defn- get-page-content
  [repo page]
  (outliner-file/tree->file-content
   (outliner-tree/blocks->vec-tree
    (db/get-page-blocks-no-cache repo page) page) {:init-level 1}))

(defn- get-file-content
  [repo file-path]
  (if-let [page-name
           (ffirst (d/q '[:find ?pn
                          :in $ ?path
                          :where
                          [?p :block/file ?f]
                          [?p :block/name ?pn]
                          [?f :file/path ?path]]
                        (db/get-db repo) file-path))]
    (get-page-content repo page-name)
    (ffirst
     (d/q '[:find ?content
            :in $ ?path
            :where
            [?f :file/path ?path]
            [?f :file/content ?content]]
          (db/get-db repo) file-path))))

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

(defn download-file!
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [content (get-file-content repo file-path)]
      (let [data (js/Blob. ["\ufeff" (array content)] ; prepend BOM
                           (clj->js {:type "text/plain;charset=utf-8,"}))
            anchor (gdom/getElement "download")
            url (js/window.URL.createObjectURL data)]
        (.setAttribute anchor "href" url)
        (.setAttribute anchor "download" file-path)
        (.click anchor)))))

(defn export-repo-as-html!
  [repo]
  (when-let [db (db/get-db repo)]
    (let [[db asset-filenames]           (if (state/all-pages-public?)
                                           (db/clean-export! db)
                                           (db/filter-only-public-pages-and-blocks db))
          asset-filenames (remove nil? asset-filenames)
          db-str       (db/db->string db)
          state        (select-keys @state/state
                                    [:ui/theme
                                     :ui/sidebar-collapsed-blocks
                                     :ui/show-recent?
                                     :config])
          state        (update state :config (fn [config]
                                               {"local" (get config repo)}))
          raw-html-str (html/publishing-html db-str (pr-str state))
          html-str     (str "data:text/html;charset=UTF-8,"
                            (js/encodeURIComponent raw-html-str))]
      (if (util/electron?)
        (js/window.apis.exportPublishAssets
         raw-html-str
         (config/get-custom-css-path)
         (config/get-export-css-path)
         (config/get-repo-dir repo)
         (clj->js asset-filenames)
         (util/mocked-open-dir-path))

        (when-let [anchor (gdom/getElement "download-as-html")]
          (.setAttribute anchor "href" html-str)
          (.setAttribute anchor "download" "index.html")
          (.click anchor))))))

(defn- get-file-contents
  ([repo]
   (get-file-contents repo {:init-level 1}))
  ([repo file-opts]
   (let [db (db/get-db repo)]
     (->> (d/q '[:find ?n ?fp
                 :where
                 [?e :block/file ?f]
                 [?f :file/path ?fp]
                 [?e :block/name ?n]] db)
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

(defn get-md-file-contents
  [repo]
  #_:clj-kondo/ignore
  (filter (fn [[path _]]
            (let [path (string/lower-case path)]
              (re-find #"\.(?:md|markdown)$" path)))
          (get-file-contents repo {:init-level 1
                                   :heading-to-list? true})))

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
                                     first
                                     page-ref/page-ref?))
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
                                     block-ref/string-block-ref?))
                        (let [arguments (:arguments (second i))
                              block-uuid (block-ref/get-string-block-ref-id (first arguments))]
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
        ast (mldoc/->edn block-content (gp-mldoc/default-config format))
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
  (let [page-name* (util/page-name-sanity-lc page-name)
        page-content (get-page-content repo page-name*)
        format (:block/format (db/entity [:block/name page-name*]))
        ast (mldoc/->edn page-content (gp-mldoc/default-config format))
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
  (def xxxx [repo root-block-uuids indent-style remove-options])
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

(defn- get-file-contents-with-suffix
  [repo]
  (let [db (db/get-db repo)
        md-files (get-md-file-contents repo)]
    (->>
     md-files
     (map (fn [[path content]] {:path path :content content
                                :names (d/q '[:find [?n ?n2]
                                              :in $ ?p
                                              :where [?e :file/path ?p]
                                              [?e2 :block/file ?e]
                                              [?e2 :block/name ?n]
                                              [?e2 :block/original-name ?n2]] db path)
                                :format (gp-util/get-format path)})))))

(defn- export-file-on-mobile [data path]
  (p/catch
   (.writeFile Filesystem (clj->js {:path path
                                    :data data
                                    :encoding (.-UTF8 Encoding)
                                    :recursive true}))
   (notification/show! "Export succeeded! You can find you exported file in the root directory of your graph." :success)
    (fn [error]
      (notification/show! "Export failed!" :error)
      (log/error :export-file-failed error))))

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

(defn export-repo-as-opml!
  #_:clj-kondo/ignore
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

(defn- safe-keywordize
  [block]
  (update block :block/properties
          (fn [properties]
            (when (seq properties)
              (->> (filter (fn [[k _v]]
                             (gp-property/valid-property-name? (str k))) properties)
                   (into {}))))))

(defn- blocks [db]
  {:version 1
   :blocks
   (->> (d/q '[:find (pull ?b [*])
               :in $
               :where
               [?b :block/file]
               [?b :block/original-name]
               [?b :block/name]] db)

        (map (fn [[{:block/keys [name] :as page}]]
               (let [blocks (db/get-page-blocks-no-cache
                             (state/get-current-repo)
                             name
                             {:transform? false})
                     blocks' (map (fn [b]
                                    (let [b' (if (seq (:block/properties b))
                                               (update b :block/content
                                                       (fn [content] (property/remove-properties (:block/format b) content)))
                                               b)]
                                      (safe-keywordize b'))) blocks)
                     children (outliner-tree/blocks->vec-tree blocks' name)
                     page' (safe-keywordize page)]
                 (assoc page' :block/children children))))
        (nested-select-keys
         [:block/id
          :block/page-name
          :block/properties
          :block/format
          :block/children
          :block/content]))})

(defn- file-name [repo extension]
  (-> (string/replace repo config/local-db-prefix "")
      (string/replace #"^/+" "")
      (str "_" (quot (util/time-ms) 1000))
      (str "." (string/lower-case (name extension)))))

(defn- export-repo-as-edn-str [repo]
  (when-let [db (db/get-db repo)]
    (let [sb (StringBuffer.)]
      (pprint/pprint (blocks db) (StringBufferWriter. sb))
      (str sb))))

(defn export-repo-as-edn-v2!
  [repo]
  (when-let [edn-str (export-repo-as-edn-str repo)]
    (let [data-str (some->> edn-str
                            js/encodeURIComponent
                            (str "data:text/edn;charset=utf-8,"))
          filename (file-name repo :edn)]
      (if (mobile-util/native-platform?)
        (export-file-on-mobile edn-str filename)
        (when-let [anchor (gdom/getElement "download-as-edn-v2")]
          (.setAttribute anchor "href" data-str)
          (.setAttribute anchor "download" filename)
          (.click anchor))))))

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
  (when-let [db (db/get-db repo)]
    (let [json-str
          (-> (blocks db)
              nested-update-id
              clj->js
              js/JSON.stringify)
          filename (file-name repo :json)
          data-str (str "data:text/json;charset=utf-8,"
                        (js/encodeURIComponent json-str))]
      (if (mobile-util/native-platform?)
        (export-file-on-mobile json-str filename)
        (when-let [anchor (gdom/getElement "download-as-json-v2")]
          (.setAttribute anchor "href" data-str)
          (.setAttribute anchor "download" filename)
          (.click anchor))))))

;;;;;;;;;;;;;;;;;;;;;;;;;
;; Export to roam json ;;
;;;;;;;;;;;;;;;;;;;;;;;;;

;; https://roamresearch.com/#/app/help/page/Nxz8u0vXU
;; export to roam json according to above spec
(defn- roam-json [db]
  (->> (d/q '[:find (pull ?b [*])
              :in $
              :where
              [?b :block/file]
              [?b :block/original-name]
              [?b :block/name]] db)

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
  (when-let [db (db/get-db repo)]
    (let [json-str
          (-> (roam-json db)
              clj->js
              js/JSON.stringify)
          data-str (str "data:text/json;charset=utf-8,"
                        (js/encodeURIComponent json-str))]
      (when-let [anchor (gdom/getElement "download-as-roam-json")]
        (.setAttribute anchor "href" data-str)
        (.setAttribute anchor "download" (file-name (str repo "_roam") :json))
        (.click anchor)))))
;;; ================================================================
;;; ast transform utils
(defn- priority->string
  [priority]
  (str "[#" priority "]"))

(defn- hashtag-value->string
  [inline-coll]
  (reduce str
          (mapv
           (fn [inline]
             (let [[ast-type ast-content] inline]
               (case ast-type
                 "Nested_link"
                 (:content ast-content)
                 "Link"
                 (:full_text ast-content)
                 "Plain"
                 ast-content)))
           inline-coll)))

(defn- repetition-to-string
  [[[kind] [duration] n]]
  (let [kind (case kind
               "Dotted" "."
               "Plus" "+"
               "DoublePlus" "++")]
    (str kind n (string/lower-case (str (first duration))))))

(defn timestamp-to-string
  [{:keys [date time repetition wday active]}]
  (let [{:keys [year month day]} date
        {:keys [hour min]} time
        [open close] (if active ["<" ">"] ["[" "]"])
        repetition (if repetition
                     (str " " (repetition-to-string repetition))
                     "")
        hour (when hour (util/zero-pad hour))
        min  (when min (util/zero-pad min))
        time (cond
               (and hour min)
               (util/format " %s:%s" hour min)
               hour
               (util/format " %s" hour)
               :else
               "")]
    (util/format "%s%s-%s-%s %s%s%s%s"
                 open
                 (str year)
                 (util/zero-pad month)
                 (util/zero-pad day)
                 wday
                 time
                 repetition
                 close)))

(defn- add-fake-pos
  [block-ast-without-pos]
  (vector block-ast-without-pos {:fake-pos 0}))

(defn- remove-pos
  [[block-ast-without-pos]]
  block-ast-without-pos)

(defn- update-level-in-block-ast-coll
  [block-ast-coll origin-level]
  (mapv
   (fn [[[ast-type ast-content] _pos]]
     (add-fake-pos
      (if (= ast-type "Heading")
        [ast-type (update ast-content :level #(+ (dec %) origin-level))]
        [ast-type ast-content])))
   block-ast-coll))

(defn- plain-indent-inline-ast
  [level & {:keys [spaces] :or {spaces "  "}}]
  ["Plain" (str (reduce str (repeat (dec level) "\t")) spaces)])

;;; ast -> simple text ast
(def simple-ast-malli-schema
  [:or
   [:map {:closed true}
    [:type [:= :raw-text]]
    [:content :string]]
   [:map {:closed true}
    [:type [:= :space]]]
   [:map {:closed true}
    [:type [:= :newline]]
    [:line-count :int]]
   [:map {:closed true}
    [:type [:= :indent]]
    [:level :int]
    [:extra-space-count :int]]])

(defn- raw-text [content]
  {:type :raw-text :content content})
(def ^:private space {:type :space})
(defn- newline* [line-count]
  {:type :newline :line-count line-count})
(defn- indent [level extra-space-count]
  {:type :indent :level level :extra-space-count extra-space-count})

(def ^:private ^:dynamic *state*
  {;; current level of Heading (use when `block-ast->simple-ast`)
   :current-level 1
   ;; emphasis symbol (use when `block-ast->simple-ast`)
   :outside-em-symbol nil
   ;; (use when `block-ast->simple-ast`)
   :indent-after-break-line? false
   ;; this submap is used when replace block-reference, block-embed, page-embed
   :replace-ref-embed
   {:current-level 1}})

;;; block-ast->simple-ast
(declare inline-ast->simple-ast block-ast->simple-ast block-ast-without-pos->simple-ast)
(defn- block-heading
  [{:keys [title _tags marker level _numbering priority _anchor _meta _unordered size]}]
  (let [priority* (and priority (raw-text (priority->string priority)))
        heading* [(indent (dec level) 0) (raw-text "-")]
        size* (and size [space (raw-text (reduce str (repeat size "#")))])
        marker* (and marker (raw-text marker))]
    (set! *state* (assoc *state* :current-level level))
    (remove nil? (concat heading* size*
                         [space marker* space priority* space]
                         (mapcat inline-ast->simple-ast title)
                         [(newline* 1)]))))

(declare block-list)
(defn- block-list-item
  [{:keys [content items number _name checkbox]}]
  (let [content* (mapcat block-ast-without-pos->simple-ast content)
        number* (raw-text
                 (if number
                   (str number ". ")
                   "* "))
        checkbox* (raw-text
                   (if (some? checkbox)
                     (if (boolean checkbox)
                       "[X]" "[ ]")
                     ""))
        current-level (get *state* :current-level 1)
        indent (when (> current-level 1)
                 (indent (dec current-level) 0))
        items* (block-list items)]
    (concat [indent number* checkbox* space]
            content*
            [(newline* 1)]
            items*
            [(newline* 1)])))

(defn- block-list
  [l]
  (binding [*state* (update *state* :current-level inc)]
    (concat (mapcat block-list-item l)
            (when (pos? (count l))
              [(newline* 2)]))))

(defn- block-example
  [l]
  (let [level (dec (get *state* :current-level 1))]
    (mapcat
     (fn [line]
       [(indent level 2)
        (raw-text "    ")
        (raw-text line)
        (newline* 1)])
     l)))

(defn- block-src
  [{:keys [lines language]}]
  (let [level (dec (get *state* :current-level 1))]
    (concat
     [(indent level 2) (raw-text "```")]
     (when language [space (raw-text language)])
     [(newline* 1)]
     (mapv raw-text lines)
     [(indent level 2) (raw-text "```") (newline* 1)])))

(defn- block-quote
  [block-coll]
  (let [level (dec (get *state* :current-level 1))]
    (binding [*state* (assoc *state* :indent-after-break-line? true)]
      (concat (mapcat (fn [block]
                        (let [block-simple-ast (block-ast-without-pos->simple-ast block)]
                          (when (seq block-simple-ast)
                            (concat [(indent level 2) (raw-text ">") space]
                                    block-simple-ast))))
                      block-coll)
              [(newline* 2)]))))

(defn- inline-link
  [{full-text :full_text}]
  [(raw-text full-text)])

(defn- inline-nested-link
  [{content :content}]
  [(raw-text content)])

(defn- inline-subscript
  [inline-coll]
  (concat [(raw-text "_{")]
          (mapcat (fn [inline] (cons space (inline-ast->simple-ast inline))) inline-coll)
          [(raw-text "}")]))

(defn- inline-superscript
  [inline-coll]
  (concat [(raw-text "^{")]
          (mapcat (fn [inline] (cons space (inline-ast->simple-ast inline))) inline-coll)
          [(raw-text "}")]))

(defn- inline-footnote-reference
  [{name :name}]
  [(raw-text (str "[" name "]"))])

(defn- inline-cookie
  [ast-content]
  [(raw-text
    (case (first ast-content)
      "Absolute"
      (let [[_ current total] ast-content]
        (str "[" current "/" total "]"))
      "Percent"
      (str "[" (second ast-content) "%]")))])

(defn- inline-latex-fragment
  [ast-content]
  (let [[type content] ast-content
        wrapper (case type
                  "Inline" "$"
                  "Displayed" "$$")]
    [space (raw-text (str wrapper content wrapper)) space]))

(defn- inline-macro
  [{:keys [name arguments]}]
  (->
   (if (= name "cloze")
     (string/join "," arguments)
     (let [l (cond-> ["{{" name]
               (pos? (count arguments)) (conj "(" (string/join "," arguments) ")")
               true (conj "}}"))]
       (string/join l)))
   raw-text
   vector))

(defn- inline-entity
  [{unicode :unicode}]
  [(raw-text unicode)])

(defn- inline-timestamp
  [ast-content]
  (let [[type timestamp-content] ast-content]
    (-> (case type
          "Scheduled" ["SCHEDULED: " (timestamp-to-string timestamp-content)]
          "Deadline" ["DEADLINE: " (timestamp-to-string timestamp-content)]
          "Date" [(timestamp-to-string timestamp-content)]
          "Closed" ["CLOSED: " (timestamp-to-string timestamp-content)]
          "Clock" ["CLOCK: " (timestamp-to-string (second timestamp-content))]
          "Range" (let [{:keys [start stop]} timestamp-content]
                    [(str (timestamp-to-string start) "--" (timestamp-to-string stop))]))
        string/join
        raw-text
        vector)))

(defn- inline-email
  [{:keys [local_part domain]}]
  [(raw-text (str "<" local_part "@" domain ">"))])

(defn- emphasis-wrap-with
  [inline-coll em-symbol]
  (binding [*state* (assoc *state* :outside-em-symbol (first em-symbol))]
    (concat [(raw-text em-symbol)]
            (mapcat inline-ast->simple-ast inline-coll)
            [(raw-text em-symbol)])))

(defn- inline-emphasis
  [emphasis]
  (let [[type inline-coll] emphasis
        outside-em-symbol (:outside-em-symbol *state*)]
    (case type
      "Bold"
      (emphasis-wrap-with inline-coll (if (= outside-em-symbol "*") "__" "**"))
      "Italic"
      (emphasis-wrap-with inline-coll (if (= outside-em-symbol "*") "_" "*"))
      "Underline"
      (binding [*state* (assoc *state* :outside-em-symbol outside-em-symbol)]
        (mapcat (fn [inline] (cons space (inline-ast->simple-ast inline))) inline-coll))
      "Strike_through"
      (emphasis-wrap-with inline-coll "~~")
      "Highlight"
      (emphasis-wrap-with inline-coll "^^"))))

(defn- inline-break-line
  []
  [(raw-text "  \n")
   (when (:indent-after-break-line? *state*)
     (let [current-level (get *state* :current-level 1)]
       (when (> current-level 1)
         (indent (dec current-level) 4))))])

;; {:malli/schema ...} only works on public vars, so use m/=> here
(m/=> block-ast->simple-ast [:=> [:cat [:sequential :any]] [:sequential simple-ast-malli-schema]])
(defn- block-ast->simple-ast
  [block]
  (remove
   nil?
   (let [[[ast-type ast-content] _pos] block]
     (case ast-type
       "Paragraph"
       (concat (mapcat inline-ast->simple-ast ast-content) [(newline* 1)])
       "Paragraph_line"
       (assert false "Paragraph_line is mldoc internal ast")
       "Paragraph_Sep"
       [(newline* ast-content)]
       "Heading"
       (block-heading ast-content)
       "List"
       (block-list ast-content)
       ("Directive" "Results" "Property_Drawer")
       nil
       "Example"
       (block-example ast-content)
       "Src"
       (block-src ast-content)
       "Quote"
       (block-quote ast-content)

       (assert false (str :block-ast->simple-ast " " ast-type " not implemented yet"))))))

(defn- block-ast-without-pos->simple-ast
  [block]
  (block-ast->simple-ast (add-fake-pos block)))

(defn- inline-ast->simple-ast
  [inline]
  (let [[ast-type ast-content] inline]
    (case ast-type
      "Emphasis"
      (inline-emphasis ast-content)
      ("Break_Line" "Hard_Break_Line")
      (inline-break-line)
      "Verbatim"
      [(raw-text ast-content)]
      "Code"
      (mapv raw-text ["`" ast-content "`"])
      "Tag"
      [(raw-text (str "#" (hashtag-value->string ast-content)))]
      "Spaces"                          ; what's this ast-type for ?
      nil
      "Plain"
      [(raw-text ast-content)]
      "Link"
      (inline-link ast-content)
      "Nested_link"
      (inline-nested-link ast-content)
      "Target"
      [(raw-text (str "<<" ast-content ">>"))]
      "Subscript"
      (inline-subscript ast-content)
      "Superscript"
      (inline-superscript ast-content)
      "Footnote_Reference"
      (inline-footnote-reference ast-content)
      "Cookie"
      (inline-cookie ast-content)
      "Latex_Fragment"
      (inline-latex-fragment ast-content)
      "Macro"
      (inline-macro ast-content)
      "Entity"
      (inline-entity ast-content)
      "Timestamp"
      (inline-timestamp ast-content)
      "Radio_Target"
      [(raw-text (str "<<<" ast-content ">>>"))]
      "Email"
      (inline-email ast-content)
      "Inline_Hiccup"
      [(raw-text ast-content)]
      "Inline_Html"
      [(raw-text ast-content)]
      ("Export_Snippet" "Inline_Source_Block")
      nil
      (assert false (str :inline-ast->simple-ast " " ast-type " not implemented yet")))))

;;; block-uuid/page-name -> ast

(defn- block-uuid->ast
  [block-uuid]
  (let [block (into {} (db/get-block-by-uuid block-uuid))
        content (outliner-file/tree->file-content [block] {:init-level 1})
        format :markdown
        ast (gp-mldoc/->edn content (gp-mldoc/default-config format))]
    ;; TODO: nested block-references
    ast))

(defn- block-uuid->ast-with-children
  [block-uuid]
  (let [content (get-blocks-contents (state/get-current-repo) block-uuid)
        format :markdown
        ast (gp-mldoc/->edn content (gp-mldoc/default-config format))]
    ast))

(defn- page-name->ast
  [page-name]
  (let [content (get-page-content (state/get-current-repo) page-name)
        format :markdown
        ast (gp-mldoc/->edn content (gp-mldoc/default-config format))]
    ast))

;;; replace ((block-uuid))
(defn- replace-block-reference-in-heading
  [{:keys [title] :as ast-content}]
  (let [inline-coll  title
        inline-coll* (mapcat
                      #(match [%]
                              [["Link" {:url ["Block_ref" block-uuid]}]]
                              (let [[[[_ {title-inline-coll :title}]]] (block-uuid->ast (uuid block-uuid))]
                                title-inline-coll)

                              :else [%])
                      inline-coll)]
    (assoc ast-content :title inline-coll*)))

(defn- replace-block-reference-in-paragraph
  [inline-coll]
  (mapcat
   #(match [%]
      [["Link" {:url ["Block_ref" block-uuid]}]]
      (let [[[[_ {title-inline-coll :title}]]] (block-uuid->ast (uuid block-uuid))]
        title-inline-coll)
      :else [%])
   inline-coll))

(declare replace-block-references)
(def ^:private replace-block-references-xf
  (comp (map add-fake-pos)
        (map (comp remove-pos replace-block-references))))

(defn- replace-block-reference-in-list
  [list-items]
  (mapv
   (fn [{block-ast-coll :content :as item}]
     (assoc item :content (sequence replace-block-references-xf block-ast-coll)))
   list-items))

(defn- replace-block-reference-in-quote
  [block-ast-coll]
  (sequence replace-block-references-xf block-ast-coll))

(defn- replace-block-references
  [block-ast]
  (let [[[ast-type ast-content] _pos] block-ast]
    (case ast-type
      "Heading"
      (add-fake-pos [ast-type (replace-block-reference-in-heading ast-content)])

      "Paragraph"
      (add-fake-pos [ast-type (replace-block-reference-in-paragraph ast-content)])

      "List"
      (add-fake-pos [ast-type (replace-block-reference-in-list ast-content)])

      "Quote"
      (add-fake-pos [ast-type (replace-block-reference-in-quote ast-content)])

      ;; else
      block-ast)))

;;; replace {{embed ((block-uuid))}} {{embed [[page]]}}

(defn- replace-block-embeds-helper
  [current-paragraph-inlines block-uuid blocks-tcoll level]
  (let [block-uuid* (subs block-uuid 2 (- (count block-uuid) 2))
        ast-coll (update-level-in-block-ast-coll
                  (block-uuid->ast-with-children (uuid block-uuid*))
                  level)]
    (cond-> blocks-tcoll
      (seq current-paragraph-inlines)
      (conj! (add-fake-pos ["Paragraph" current-paragraph-inlines]))
      true
      (#(reduce conj! % ast-coll)))))

(defn- replace-page-embeds-helper
  [current-paragraph-inlines page-name blocks-tcoll level]
  (let [page-name* (subs page-name 2 (- (count page-name) 2))
        ast-coll (update-level-in-block-ast-coll
                  (page-name->ast page-name*)
                  level)]
    (cond-> blocks-tcoll
      (seq current-paragraph-inlines)
      (conj! (add-fake-pos ["Paragraph" current-paragraph-inlines]))
      true
      (#(reduce conj! % ast-coll)))))

(defn- replace-block&page-embeds-in-heading
  [{inline-coll :title origin-level :level :as ast-content}]
  (set! *state* (assoc-in *state* [:replace-ref-embed :current-level] origin-level))
  (if (empty? inline-coll)
    ;; it's just a empty Heading, return itself
    [(add-fake-pos ["Heading" ast-content])]
    (loop [[inline & other-inlines] inline-coll
           heading-exist? false
           current-paragraph-inlines []
           r (transient [])]
      (if-not inline
        (persistent!
         (if (seq current-paragraph-inlines)
           (->> (if heading-exist?
                  ["Paragraph" current-paragraph-inlines]
                  ["Heading" (assoc ast-content :title current-paragraph-inlines)])
                add-fake-pos
                (conj! r))
           r))
        (match [inline]
          [["Macro" {:name "embed" :arguments [block-uuid-or-page-name]}]]
          (cond
            (and (string/starts-with? block-uuid-or-page-name "((")
                 (string/ends-with? block-uuid-or-page-name "))"))
            (recur other-inlines true []
                   (replace-block-embeds-helper
                    current-paragraph-inlines block-uuid-or-page-name r origin-level))
            (and (string/starts-with? block-uuid-or-page-name "[[")
                 (string/ends-with? block-uuid-or-page-name "]]"))
            (recur other-inlines true []
                   (replace-page-embeds-helper
                    current-paragraph-inlines block-uuid-or-page-name r origin-level))
            :else ;; not ((block-uuid)) or [[page-name]], just keep the original ast
            (recur other-inlines heading-exist? (conj current-paragraph-inlines inline) r))

          :else
          (let [current-paragraph-inlines*
                (if (and (empty? current-paragraph-inlines)
                         heading-exist?)
                  (conj current-paragraph-inlines (plain-indent-inline-ast origin-level))
                  current-paragraph-inlines)]
            (recur other-inlines heading-exist? (conj current-paragraph-inlines* inline) r)))))))

(defn- replace-block&page-embeds-in-paragraph
  [inline-coll]
  (let [current-level (get-in *state* [:replace-ref-embed :current-level])]
    (loop [[inline & other-inlines] inline-coll
           current-paragraph-inlines []
           just-after-embed? false
           blocks (transient [])]
      (if-not inline
        (persistent!
         (if (seq current-paragraph-inlines)
           (->> ["Paragraph" current-paragraph-inlines]
                add-fake-pos
                (conj! blocks))
           blocks))
        (match [inline]
          [["Macro" {:name "embed" :arguments [block-uuid-or-page-name]}]]
          (cond
            (and (string/starts-with? block-uuid-or-page-name "((")
                 (string/ends-with? block-uuid-or-page-name "))"))
            (recur other-inlines [] true
                   (replace-block-embeds-helper
                    current-paragraph-inlines block-uuid-or-page-name blocks current-level))
            (and (string/starts-with? block-uuid-or-page-name "[[")
                 (string/ends-with? block-uuid-or-page-name "]]"))
            (recur other-inlines [] true
                   (replace-page-embeds-helper
                    current-paragraph-inlines block-uuid-or-page-name blocks current-level))
            :else ;; not ((block-uuid)) or [[page-name]], just keep the original ast
            (recur other-inlines (conj current-paragraph-inlines inline) false blocks))

          :else
          (let [current-paragraph-inlines*
                (if just-after-embed?
                  (conj current-paragraph-inlines (plain-indent-inline-ast current-level))
                  current-paragraph-inlines)]
            (recur other-inlines (conj current-paragraph-inlines* inline) false blocks)))))))

(declare replace-block&page-embeds)

(def ^:private replace-block&page-embeds-xf
  (comp (map add-fake-pos)
        (mapcat replace-block&page-embeds)
        (map remove-pos)))

(defn- replace-block&page-embeds-in-list
  [list-items]
  (binding [*state* (update-in *state* [:replace-ref-embed :current-level] inc)]
    (->> (mapv
          (fn [{block-ast-coll :content :as item}]
            (assoc item :content (sequence replace-block&page-embeds-xf block-ast-coll)))
          list-items)
         (vector "List")
         add-fake-pos
         vector)))

(defn- replace-block&page-embeds-in-quote
  [block-ast-coll]
  (->> block-ast-coll
       (sequence replace-block&page-embeds-xf)
       (vector "Quote")
       add-fake-pos
       vector))

(defn- replace-block&page-embeds
  [block-ast]
  (let [[[ast-type ast-content] _pos] block-ast]
    (case ast-type
      "Heading"
      (replace-block&page-embeds-in-heading ast-content)
      "Paragraph"
      (replace-block&page-embeds-in-paragraph ast-content)
      "List"
      (replace-block&page-embeds-in-list ast-content)
      "Quote"
      (replace-block&page-embeds-in-quote ast-content)
      ;; else
      [block-ast])))

(defn- simple-ast->string
  [simple-ast]
  {:pre [(m/validate simple-ast-malli-schema simple-ast)]}
  (case (:type simple-ast)
    :raw-text (:content simple-ast)
    :space " "
    :newline (reduce str (repeat (:line-count simple-ast) "\n"))
    :indent (reduce str (concat (repeat (:level simple-ast) "\t")
                                (repeat (:extra-space-count simple-ast) " ")))))

(defn- merge-adjacent-spaces&newlines
  [simple-ast-coll]
  (loop [r                             (transient [])
         last-ast                      nil
         last-raw-text-space-suffix?   false
         last-raw-text-newline-suffix? false
         [simple-ast & other-ast-coll] simple-ast-coll]
    (if (nil? simple-ast)
      (persistent! (if last-ast (conj! r last-ast) r))
      (let [tp            (:type simple-ast)
            last-ast-type (:type last-ast)]
        (case tp
          :space
          (if (or (contains? #{:space :newline :indent} last-ast-type)
                  last-raw-text-space-suffix?
                  last-raw-text-newline-suffix?)
            ;; drop this :space
            (recur r last-ast last-raw-text-space-suffix? last-raw-text-newline-suffix? other-ast-coll)
            (recur (if last-ast (conj! r last-ast) r) simple-ast false false other-ast-coll))

          :newline
          (case last-ast-type
            (:space :indent) ;; drop last-ast
            (recur r simple-ast false false other-ast-coll)
            :newline
            (let [last-newline-count (:line-count last-ast)
                  current-newline-count (:line-count simple-ast)
                  kept-ast (if (> last-newline-count current-newline-count) last-ast simple-ast)]
              (recur r kept-ast false false other-ast-coll))
            :raw-text
            (if last-raw-text-newline-suffix?
              (recur r last-ast last-raw-text-space-suffix? last-raw-text-newline-suffix? other-ast-coll)
              (recur (if last-ast (conj! r last-ast) r) simple-ast false false other-ast-coll))
            ;; no-last-ast
            (recur r simple-ast false false other-ast-coll))

          :indent
          (case last-ast-type
            (:space :indent)            ; drop last-ast
            (recur r simple-ast false false other-ast-coll)
            :newline
            (recur (if last-ast (conj! r last-ast) r) simple-ast false false other-ast-coll)
            :raw-text
            (if last-raw-text-space-suffix?
              ;; drop this :indent
              (recur r last-ast last-raw-text-space-suffix? last-raw-text-newline-suffix? other-ast-coll)
              (recur (if last-ast (conj! r last-ast) r) simple-ast false false other-ast-coll))
            ;; no-last-ast
            (recur r simple-ast false false other-ast-coll))

          :raw-text
          (let [content         (:content simple-ast)
                empty-content?  (empty? content)
                first-ch        (first content)
                last-ch         (let [num (count content)]
                                  (when (pos? num)
                                    (nth content (dec num))))
                newline-prefix? (some-> first-ch #{"\r" "\n"} boolean)
                newline-suffix? (some-> last-ch #{"\n"} boolean)
                space-prefix?   (some-> first-ch #{" "} boolean)
                space-suffix?   (some-> last-ch #{" "} boolean)]
            (cond
              empty-content?            ;drop this raw-text
              (recur r last-ast last-raw-text-space-suffix? last-raw-text-newline-suffix? other-ast-coll)
              newline-prefix?
              (case last-ast-type
                (:space :indent :newline) ;drop last-ast
                (recur r simple-ast space-suffix? newline-suffix? other-ast-coll)
                :raw-text
                (recur (if last-ast (conj! r last-ast) r) simple-ast space-suffix? newline-suffix? other-ast-coll)
                ;; no-last-ast
                (recur r simple-ast space-suffix? newline-suffix? other-ast-coll))
              space-prefix?
              (case last-ast-type
                (:space :indent)        ;drop last-ast
                (recur r simple-ast space-suffix? newline-suffix? other-ast-coll)
                (:newline :raw-text)
                (recur (if last-ast (conj! r last-ast) r) simple-ast space-suffix? newline-suffix? other-ast-coll)
                ;; no-last-ast
                (recur r simple-ast space-suffix? newline-suffix? other-ast-coll))
              :else
              (recur (if last-ast (conj! r last-ast) r) simple-ast space-suffix? newline-suffix? other-ast-coll))))))))

(defn- simple-asts->string
  [simple-ast-coll]
  (->> simple-ast-coll
       merge-adjacent-spaces&newlines
       merge-adjacent-spaces&newlines
       (mapv simple-ast->string)
       string/join))

(comment
  (def x (apply export-blocks-as-markdown-v2 xxxx))
  (println (simple-asts->string
            (mapcat block-ast->simple-ast
                    (mapcat replace-block&page-embeds (mapv replace-block-references x))))))

;;; ================================================================

(defn- root-block-uuids->content
  [repo root-block-uuids]
  (let [contents (mapv #(get-blocks-contents repo %) root-block-uuids)]
    (string/join "\n" (mapv string/trim-newline contents))))

(defn export-blocks-as-markdown-v2
  [repo root-block-uuids indent-style remove-options]
  {:pre [(seq root-block-uuids)]}
  (let [content (root-block-uuids->content repo root-block-uuids)
        first-block (db/entity [:block/uuid (first root-block-uuids)])
        format (or (:block/format first-block) (state/get-preferred-format))]
    (def xxx (gp-mldoc/->edn content (gp-mldoc/default-config format)))))
