(ns frontend.modules.file.core
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.util.property :as property]
            [frontend.util.fs :as fs-util]
            [frontend.util :as util]
            [frontend.handler.file :as file-handler]
            [frontend.version :as version]))

(defn- indented-block-content
  [content spaces-tabs]
  (let [lines (string/split-lines content)]
    (string/join (str "\n" spaces-tabs) lines)))

(defn- content-with-collapsed-state
  "Only accept nake content (without any indentation)"
  [format content collapsed?]
  (cond
    collapsed?
    (property/insert-property format content :collapsed true)

    ;; Don't check properties. Collapsed is an internal state log as property in file, but not counted into properties
    (false? collapsed?)
    (property/remove-property format :collapsed content)

    :else
    content))

(defn transform-content
  [{:block/keys [collapsed? format pre-block? unordered content left page parent properties]} level {:keys [heading-to-list?]}]
  (let [heading (:heading properties)
        markdown? (= :markdown format)
        content (or content "")
        pre-block? (or pre-block?
                       (and (= page parent left) ; first block
                            markdown?
                            (string/includes? (first (string/split-lines content)) ":: ")))
        content (cond
                  pre-block?
                  (let [content (string/trim content)]
                    (str content "\n"))

                  :else
                  (let [markdown-top-heading? (and markdown?
                                                   (= parent page)
                                                   (not unordered)
                                                   heading)
                        [prefix spaces-tabs]
                        (cond
                          (= format :org)
                          [(->>
                            (repeat level "*")
                            (apply str)) ""]

                          markdown-top-heading?
                          ["" ""]

                          :else
                          (let [level (if (and heading-to-list? heading)
                                        (if (> heading 1)
                                          (dec heading)
                                          heading)
                                        level)
                                spaces-tabs (->>
                                             (repeat (dec level) (state/get-export-bullet-indentation))
                                             (apply str))]
                            [(str spaces-tabs "-") (str spaces-tabs "  ")]))
                        content (if heading-to-list?
                                  (-> (string/replace content #"^\s?#+\s+" "")
                                      (string/replace #"^\s?#+\s?$" ""))
                                  content)
                        content (content-with-collapsed-state format content collapsed?)
                        new-content (indented-block-content (string/trim content) spaces-tabs)
                        sep (if (or markdown-top-heading?
                                    (string/blank? new-content))
                              ""
                              " ")]
                    (str prefix sep new-content)))]
    content))

(defn- edn-transform-blocks
  [page-block blocks]
  (let [ref-keys [:block/refs
                  :block/path-refs
                  :block/left
                  :block/parent
                  :block/tags
                  :block/alias
                  :block/namespace]
        ref-ids (->>
                 (mapcat (fn [block]
                           (->>
                            (select-keys block ref-keys)
                            vals
                            (mapcat (fn [ref] (if (map? ref)
                                                [(:db/id ref)]
                                                (map :db/id ref))))))
                         (cons page-block blocks))
                 (remove nil?)
                 (set))
        refs (db/pull-many (state/get-current-repo)
                           '[:db/id :block/uuid :block/name]
                           ref-ids)
        id->uuid (zipmap (map :db/id refs) (map :block/uuid refs))
        refs-blocks (->> (map #(dissoc % :db/id) refs)
                         (filter :block/name)
                         (remove #(= (:block/uuid %) (:block/uuid page-block)))
                         (vec))
        blocks (mapv (fn [block]
                       (let [b (dissoc block
                                       :db/id :block/format :block/level :block/unordered
                                       :block/journal? :block/journal-day :block/page)]
                         (->>
                          (reduce (fn [b k]
                                    (update b k
                                            (fn [refs]
                                              (if (map? refs)
                                                (when (or (not= (:db/id refs) (:db/id page-block))
                                                          (= k :block/left))
                                                  [:block/uuid (get id->uuid (:db/id refs))])
                                                (->>
                                                 (remove (fn [ref] (= (:db/id page-block) (:db/id ref))) refs)
                                                 (map (fn [item]
                                                        [:block/uuid (get id->uuid (:db/id item))]))
                                                 (set)))))) b ref-keys)
                          (filter (fn [[_ v]]
                                    (or (and (coll? v) (seq v))
                                        (and (not (coll? v)) v))))
                          (into {}))))
                     blocks)]
    {:blocks blocks
     :refs refs-blocks}))

(defn- tree->file-content-aux
  [tree {:keys [init-level] :as opts}]
  (let [block-contents (transient [])]
    (loop [[f & r] tree level init-level]
      (if (nil? f)
        (->> block-contents persistent! flatten (remove nil?))
        (let [page? (nil? (:block/page f))
              content (if page? nil (transform-content f level opts))
              new-content
              (if-let [children (seq (:block/children f))]
                (cons content (tree->file-content-aux children {:init-level (inc level)}))
                [content])]
          (conj! block-contents new-content)
          (recur r level))))))

(defn tree->file-content
  [tree opts]
  (->> (tree->file-content-aux tree opts) (string/join "\n")))


(def init-level 1)

(defn- transact-file-tx-if-not-exists!
  [page ok-handler]
  (when-let [repo (state/get-current-repo)]
    (when (:block/name page)
      (let [format (name (state/get-preferred-file-format repo))
            title (string/capitalize (:block/name page))
            whiteboard-page? (= "whiteboard" (:block/type page))
            format (if whiteboard-page? "edn" format)
            journal-page? (date/valid-journal-title? title)
            filename (if journal-page?
                       (date/date->file-name journal-page?)
                       (-> (or (:block/original-name page) (:block/name page))
                           (fs-util/file-name-sanity)))
            sub-dir (cond
                      journal-page?    (config/get-journals-directory)
                      whiteboard-page? (config/get-whiteboards-directory)
                      :else            (config/get-pages-directory))
            ext (if (= format "markdown") "md" format)
            file-path (config/get-page-file-path repo sub-dir filename ext)
            file {:file/path file-path}
            tx [{:file/path file-path}
                {:block/name (:block/name page)
                 :block/file file}]]
        (db/transact! tx)
        (when ok-handler (ok-handler))))))

(defn- remove-transit-ids
  [block]
  (let [block (dissoc block :db/id :block/file)
        ref-keys [:block/namespace :block/tags :block/alias]
        ref-ids (->>
                 (select-keys block ref-keys)
                 vals
                 (mapcat (fn [ref] (if (map? ref)
                                     [(:db/id ref)]
                                     (map :db/id ref))))
                 (remove nil?)
                 (set))
        refs (db/pull-many (state/get-current-repo)
                           '[:db/id :block/uuid]
                           ref-ids)
        id->uuid (zipmap (map :db/id refs) (map :block/uuid refs))]
    (->>
     (reduce (fn [b k]
               (update b k
                       (fn [refs]
                         (if (map? refs)
                           [:block/uuid (get id->uuid (:db/id refs))]
                           (->> refs
                                (map (fn [item]
                                       [:block/uuid (get id->uuid (:db/id item))]))
                                (set))))))
             block
             ref-keys)
     (filter (fn [[_ v]]
               (or (and (coll? v) (seq v))
                   (and (not (coll? v)) v))))
     (into {}))))

(defn save-tree-aux!
  [page-block tree]
  (let [page-block (db/pull (:db/id page-block))
        file-db-id (-> page-block :block/file :db/id)
        file-path (-> (db-utils/entity file-db-id) :file/path)]
    (if (and (string? file-path) (not-empty file-path))
      (let [ext (util/get-file-ext file-path)
            new-content (cond
                          ;; TODO: treat as "edn" below too
                          (= "whiteboard" (:block/type page-block))
                          (pr-str {:blocks tree
                                   :pages (list (remove-transit-ids page-block))})

                          (= "edn" ext)
                          (let [{:keys [blocks refs]} (edn-transform-blocks page-block tree)]
                            (with-out-str
                              (util/pprint
                               {:version version/edn-file-format-version
                                :page (remove-transit-ids page-block)
                                :blocks blocks
                                :refs refs})))

                          :else
                          (tree->file-content tree {:init-level init-level}))
            files [[file-path new-content]]
            repo (state/get-current-repo)]
        (file-handler/alter-files-handler! repo files {} {}))
      ;; In e2e tests, "card" page in db has no :file/path
      (js/console.error "File path from page-block is not valid" page-block tree))))

(defn save-tree!
  [page-block tree]
  {:pre [(map? page-block)]}
  (let [ok-handler #(save-tree-aux! page-block tree)
        file (or (:block/file page-block)
                 (when-let [page (:db/id (:block/page page-block))]
                   (:block/file (db-utils/entity page))))]
    (if file
      (ok-handler)
      (transact-file-tx-if-not-exists! page-block ok-handler))))
