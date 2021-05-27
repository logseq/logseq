(ns frontend.handler.export
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.format.protocol :as fp]
            [frontend.format :as f]
            [frontend.config :as config]
            [datascript.core :as d]
            [frontend.util :as util]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [goog.dom :as gdom]
            [frontend.publishing.html :as html]
            [frontend.text :as text]
            [frontend.handler.common :as common-handler]
            [frontend.extensions.zip :as zip]
            [frontend.modules.file.core :as outliner-file]
            [frontend.modules.outliner.tree :as outliner-tree]
            [promesa.core :as p]))


(defn- get-page-content
  [page]
  (outliner-file/tree->file-content
   (outliner-tree/blocks->vec-tree
    (db/get-page-blocks-no-cache page) page) {:init-level 1}))

(defn- get-page-content-debug
  [page]
  (outliner-file/tree->file-content
   (outliner-tree/blocks->vec-tree
    (db/get-page-blocks-no-cache page) page) {:init-level 1
                                              :heading-to-list? true}))

(defn- get-file-content
  [file-path]
  (let [page-name
        (ffirst (d/q '[:find ?pn
                       :where
                       [?e :file/path file-path]
                       [?p :block/file ?e]
                       [?p :block/name ?pn]] (db/get-conn)))]
    (get-page-content page-name)))

(defn- get-blocks-contents
  [repo root-block-uuid]
  (->
   (db/get-block-and-children repo root-block-uuid)
   (outliner-tree/blocks->vec-tree (str root-block-uuid))
   (outliner-file/tree->file-content {:init-level 1})))

(defn copy-block!
  [block-id]
  (when-let [block (db/pull [:block/uuid block-id])]
    (let [content (:block/content block)]
      (common-handler/copy-to-clipboard-without-id-property! (:block/format block) content))))

(defn copy-block-as-json!
  [block-id]
  (when-let [repo (state/get-current-repo)]
    (let [block-children (db/get-block-and-children repo block-id)]
      (util/copy-to-clipboard! (js/JSON.stringify (bean/->js block-children))))))

(defn copy-page-as-json!
  [page-name]
  (when-let [repo (state/get-current-repo)]
    (let [properties (db/get-page-properties page-name)
          blocks (db/get-page-blocks repo page-name)]
      (util/copy-to-clipboard!
       (js/JSON.stringify
        (bean/->js
         {:properties properties
          :blocks blocks}))))))

(defn export-repo-as-json!
  [repo]
  (when-let [db (db/get-conn repo)]
    (let [db-json (db/db->json db)
          data-str (str "data:text/json;charset=utf-8," (js/encodeURIComponent db-json))]
      (when-let [anchor (gdom/getElement "download-as-json")]
        (.setAttribute anchor "href" data-str)
        (.setAttribute anchor "download" (str (last (string/split repo #"/")) ".json"))
        (.click anchor)))))

(defn export-repo-as-edn!
  [repo]
  (when-let [db (db/get-conn repo)]
    (let [db-edn (db/db->edn-str db)
          data-str (str "data:text/edn;charset=utf-8," (js/encodeURIComponent db-edn))]
      (when-let [anchor (gdom/getElement "download-as-edn")]
        (.setAttribute anchor "href" data-str)
        (.setAttribute anchor "download" (str (last (string/split repo #"/")) ".edn"))
        (.click anchor)))))

(defn download-file!
  [file-path]
  (when-let [content (get-file-content file-path)]
    (let [data (js/Blob. ["\ufeff" (array content)] ; prepend BOM
                         (clj->js {:type "text/plain;charset=utf-8,"}))]
      (let [anchor (gdom/getElement "download")
            url (js/window.URL.createObjectURL data)]
        (.setAttribute anchor "href" url)
        (.setAttribute anchor "download" file-path)
        (.click anchor)))))

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

(defn get-md-file-contents
  [repo]
  (let [conn (db/get-conn repo)]
    (filter (fn [[path _]]
              (let [path (string/lower-case path)]
                (or (string/ends-with? path ".md")
                    (string/ends-with? path ".markdown"))))
            (get-file-contents repo {:init-level 1
                                     :heading-to-list? true}))))

(defn- get-embed-and-refs-blocks-pages-aux []
  (let [mem (atom {})]
    (letfn [(f [repo page-or-block is-block? exclude-blocks exclude-pages]
              (let [v (get @mem [repo page-or-block])]
                (if v v
                    (let [[ref-blocks ref-pages]
                          (->> (if is-block?
                                 [page-or-block]
                                 (db/get-page-blocks-no-cache
                                  repo page-or-block {:pull-keys '[:block/refs]}))
                               (filterv :block/refs)
                               (mapcat :block/refs)
                               (group-by #(boolean (:block/page (db/entity (:db/id %)))))
                               ((fn [g] [(get g true []) (get g false [])]))
                               (mapv #(vec (distinct (flatten (remove nil? %))))))
                          ref-block-ids
                          (->> ref-blocks
                               (#(remove (fn [b] (contains? exclude-blocks (:db/id b))) %))
                               (mapv #(:db/id %)))
                          ref-page-ids
                          (->> ref-pages
                               (#(remove (fn [b] (contains? exclude-pages (:db/id b))) %))
                               (mapv #(:db/id %)))
                          ref-blocks
                          (->> ref-block-ids
                               (db/pull-many repo '[*])
                               (flatten))
                          ref-pages
                          (->> ref-page-ids
                               (db/pull-many repo '[*])
                               (filterv :block/name)
                               (flatten))
                          [next-ref-blocks1 next-ref-pages1]
                          (->> ref-blocks
                               (mapv #(f repo % true (set (concat ref-block-ids exclude-blocks)) exclude-pages))
                               (apply mapv vector))
                          [next-ref-blocks2 next-ref-pages2]
                          (->> ref-pages
                               (mapv #(f repo (:block/name %) false exclude-blocks (set (concat ref-page-ids exclude-pages))))
                               (apply mapv vector))
                          result
                          [(->> (concat ref-block-ids next-ref-blocks1 next-ref-blocks2)
                                (flatten)
                                (distinct))
                           (->> (concat ref-page-ids next-ref-pages1 next-ref-pages2)
                                (flatten)
                                (distinct))]]
                      (when (and (empty? exclude-blocks) (empty? exclude-pages))
                        (swap! mem assoc [repo page-or-block] result))
                      result))))]
      f)))

(defn- get-page&block-refs-by-query
  [repo page get-page&block-refs-by-query-aux]
  (let [[block-ids page-ids]
        (get-page&block-refs-by-query-aux repo page false #{} #{})
        blocks
        (db/pull-many repo '[*] block-ids)
        pages-name-and-content
        (->> page-ids
             (d/q '[:find ?n ?n2 (pull ?p [:file/path])
                    :in $ [?e ...]
                    :where
                    [?e :block/file ?p]
                    [?e :block/name ?n]
                    [?e :block/original-name ?n2]] (db/get-conn repo))
             (mapv (fn [[name origin-name file-path]]
                     (if (= name origin-name)
                       [[name file-path]]
                       [[name file-path] [origin-name file-path]])))
             (apply concat)
             (mapv (fn [[page-name file-path]]
                     [page-name (get-page-content page-name)])))
        embed-blocks
        (mapv (fn [b] [(str (:block/uuid b))
                       [(get-blocks-contents repo (:block/uuid b))
                        (:block/content b)]])
              blocks)]
    {:embed_blocks embed-blocks
     :embed_pages pages-name-and-content}))

(defn- page&block-refs
  [repo]
  (let [block-refs
        (->>
         (d/q '[:find ?pn ?pon ?bt ?bc ?bid ?e ?rb
                :where
                [?e :block/refs ?rb]
                [?e :block/page ?p]
                [?p :block/name ?pn]
                [?p :block/original-name ?pon]
                [?rb :block/title ?bt]
                [?rb :block/content ?bc]
                [?rb :block/uuid ?bid]] (db/get-conn repo)))
        page-block-refs
        (->> block-refs
             (mapv (fn [[pn pon bt bc bid _ rb]]
                     (if (= pn pon)
                       [[pn bt bc bid rb]]
                       [[pn bt bc bid rb] [pon bt bc bid rb]])))
             (apply concat)
             (reduce (fn [r [k & v]] (assoc r k (cons v (get r k)))) {})
             (mapv (fn [[k v]] [k (distinct v)]))
             (into {}))
        block-block-refs
        (->> block-refs
             (mapv (fn [[_ _ bt bc bid e rb]] [e bt bc bid rb]))
             (reduce (fn [r [k & v]] (assoc r k (cons v (get r k)))) {})
             (mapv (fn [[k v]] [k (distinct v)]))
             (into {}))
        page-refs
        (->> (d/q '[:find ?pn ?pon ?rpn ?rpon ?fp ?e
                    :where
                    [?e :block/refs ?rp]
                    [?e :block/page ?p]
                    [?p :block/name ?pn]
                    [?p :block/original-name ?pon]
                    [?rp :block/name ?rpn]
                    [?rp :block/original-name ?rpon]
                    [?rp :block/file ?pf]
                    [?pf :file/path ?fp]] (db/get-conn repo))
             (d/q '[:find ?pn ?pon ?rpn ?rpon ?fc ?be
                    :in $ [[?pn ?pon ?rpn ?rpon ?fp ?be] ...]
                    :where
                    [?e :file/path ?fp]
                    [?e :file/content ?fc]] (db/get-conn repo)))
        page-page-refs
        (->>
         page-refs
         (mapv (fn [[pn pon rpn rpon fc _]]
                 (case [(= pn pon) (= rpn rpon)]
                   [true true] [[pn rpn fc]]
                   [true false] [[pn rpn fc] [pn rpon fc]]
                   [false true] [[pn rpn fc] [pon rpn fc]]
                   [false false] [[pn rpn fc] [pn rpon fc] [pon rpn fc] [pon rpon fc]])))
         (apply concat)
         (reduce (fn [r [k & v]] (assoc r k (cons v (get r k)))) {})
         (mapv (fn [[k v]] [k (distinct v)]))
         (into {}))
        block-page-refs
        (->>
         page-refs
         (mapv (fn [[pn pon rpn rpon fc e]]
                 (if (= rpn rpon) [[e rpn fc]] [[e rpn fc] [e rpon fc]])))
         (apply concat)
         (reduce (fn [r [k & v]] (assoc r k (cons v (get r k)))) {})
         (mapv (fn [[k v]] [k (distinct v)]))
         (into {}))]
    [page-block-refs page-page-refs block-block-refs block-page-refs]))

(defn- get-page&block-refs-aux
  [repo page-or-block-id is-block-id? page&block-refs exclude-blocks exclude-pages]
  (let [[page-block-refs page-page-refs block-block-refs block-page-refs] page&block-refs]
    (if is-block-id?
      (when (not (contains? exclude-blocks page-or-block-id))
        (let [block-refs (get block-block-refs page-or-block-id)
              block-ref-ids (->>
                             (mapv (fn [[_ _ _ rb]] rb)  block-refs)
                             (remove #(contains? exclude-blocks %)))
              page-refs (get block-page-refs page-or-block-id)
              page-ref-names (->>
                              (mapv (fn [[rpn _]] rpn) page-refs)
                              (remove #(contains? exclude-pages %)))
              [other-block-refs1 other-page-refs1]
              (->>
               (mapv
                #(get-page&block-refs-aux repo % true
                                          page&block-refs
                                          (conj exclude-blocks %)
                                          exclude-pages)
                block-ref-ids)
               (apply mapv vector))
              [other-block-refs2 other-page-refs2]
              (->>
               (mapv
                #(get-page&block-refs-aux repo % false
                                          page&block-refs
                                          exclude-blocks
                                          (conj exclude-pages %))
                page-ref-names)
               (apply mapv vector))
              block-refs* (apply concat (concat other-block-refs1 other-block-refs2 [block-refs]))
              page-refs*  (apply concat (concat other-page-refs1 other-page-refs2 [page-refs]))]
          [block-refs* page-refs*]))
      (when (not (contains? exclude-pages page-or-block-id))
        (let [block-refs (get page-block-refs page-or-block-id)
              block-ref-ids (->>
                             (mapv (fn [[_ _ _ rb]] rb)  block-refs)
                             (remove #(contains? exclude-blocks %)))
              page-refs (get page-page-refs page-or-block-id)
              page-ref-names (->>
                              (mapv (fn [[rpn _]] rpn) page-refs)
                              (remove #(contains? exclude-pages %)))
              [other-block-refs1 other-page-refs1]
              (->>
               (mapv
                #(get-page&block-refs-aux repo % true
                                          page&block-refs
                                          (conj exclude-blocks %)
                                          exclude-pages)
                block-ref-ids)
               (apply mapv vector))
              [other-block-refs2 other-page-refs2]
              (->>
               (mapv
                #(get-page&block-refs-aux repo % false
                                          page&block-refs
                                          exclude-blocks
                                          (conj exclude-pages %))
                page-ref-names)
               (apply mapv vector))
              block-refs* (apply concat (concat other-block-refs1 other-block-refs2 [block-refs]))
              page-refs*  (apply concat (concat other-page-refs1 other-page-refs2 [page-refs]))]
          [block-refs* page-refs*])))))

(defn- get-page&block-refs
  [repo page page&block-refs]
  (let [[block-refs page-refs]
        (get-page&block-refs-aux repo page false page&block-refs #{} #{})]
    {:embed_blocks
     (mapv (fn [[_title content uuid id]]
             [(str uuid)
              [(get-blocks-contents repo uuid)
               content]])
           block-refs)
     :embed_pages (vec page-refs)}))

(defn- export-files-as-markdown
  [repo files heading-to-list?]
  (let [get-page&block-refs-by-query-aux (get-embed-and-refs-blocks-pages-aux)
        f (if (< (count files) 30)      ;query db for per page if (< (count files) 30), or pre-compute whole graph's page&block-refs
            #(get-page&block-refs-by-query repo % get-page&block-refs-by-query-aux)
            (let [page&block-refs (page&block-refs repo)]
              #(get-page&block-refs repo % page&block-refs)))]
    (->> files
         (mapv (fn [{:keys [path content names format]}]
                 (when (first names)
                   [path (fp/exportMarkdown f/mldoc-record content
                                            (f/get-default-config format heading-to-list?)
                                            (js/JSON.stringify
                                             (clj->js (f (first names)))))])))
         (remove nil?))))

(defn- convert-md-files-unordered-list-or-heading
  [repo files heading-to-list?]
  (->> files
       (mapv (fn [{:keys [path content names format]}]
               (when (first names)
                 [path (fp/exportMarkdown f/mldoc-record content
                                          (f/get-default-config format heading-to-list? true)
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
  (when-let [repo (state/get-current-repo)]
    (when-let [files (get-file-contents-with-suffix repo)]
      (let [heading-to-list? (state/export-heading-to-list?)
            files
            (export-files-as-markdown repo files heading-to-list?)
            zip-file-name (str repo "_markdown_" (quot (util/time-ms) 1000))]
        (p/let [zipfile (zip/make-zip zip-file-name files repo)]
          (when-let [anchor (gdom/getElement "export-as-markdown")]
            (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
            (.setAttribute anchor "download" (.-name zipfile))
            (.click anchor)))))))

(defn export-page-as-markdown!
  [page-name]
  (when-let [repo (state/get-current-repo)]
    (when-let [file (db/get-page-file page-name)]
      (when-let [path (:file/path file)]
        (when-let [content (get-page-content page-name)]
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

(defn convert-page-markdown-unordered-list-or-heading!
  [page-name]
  (when-let [repo (state/get-current-repo)]
    (when-let [file (db/get-page-file page-name)]
      (when-let [path (:file/path file)]
        (when-let [content (get-page-content page-name)]
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

(defn convert-repo-markdown-v2!
  [repo]
  (when repo
    (when-let [files (get-md-file-contents repo)]
      (let [zip-file-name (-> (string/replace repo config/local-db-prefix "")
                              (string/replace #"^/+" ""))
            zip-file-name (str zip-file-name
                               "_markdown_"
                               (quot (util/time-ms) 1000))]
        (p/let [zipfile (zip/make-zip zip-file-name files repo)]
          (when-let [anchor (gdom/getElement "convert-markdown-to-unordered-list-or-heading")]
            (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
            (.setAttribute anchor "download" (.-name zipfile))
            (.click anchor)))))))
