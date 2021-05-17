(ns frontend.db.model
  "Core db functions."
  (:require [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.db.react :as react]
            [datascript.core :as d]
            [frontend.date :as date]
            [medley.core :as medley]
            [frontend.format :as format]
            [frontend.state :as state]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.utf8 :as utf8]
            [frontend.config :as config]
            [cljs.reader :as reader]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.util :as util :refer [react] :refer-macros [profile]]
            [frontend.db-schema :as db-schema]
            [clojure.walk :as walk]))

;; TODO: extract to specific models and move data transform logic to the
;; correponding handlers.

(def rules
  '[[(parent ?p ?c)
     [?c :block/parent ?p]]
    [(parent ?p ?c)
     [?c :block/parent ?t]
     (parent ?p ?t)]

    ;; from https://stackoverflow.com/questions/43784258/find-entities-whose-ref-to-many-attribute-contains-all-elements-of-input
    ;; Quote:
    ;; You're tackling the general problem of 'dynamic conjunction' in Datomic's Datalog.
    ;; Write a dynamic Datalog query which uses 2 negations and 1 disjunction or a recursive rule
    ;; Datalog has no direct way of expressing dynamic conjunction (logical AND / 'for all ...' / set intersection).
    ;; However, you can achieve it in pure Datalog by combining one disjunction
    ;; (logical OR / 'exists ...' / set union) and two negations, i.e
    ;; (For all ?g in ?Gs p(?e,?g)) <=> NOT(Exists ?g in ?Gs, such that NOT(p(?e, ?g)))

    ;; [(matches-all ?e ?a ?vs)
    ;;  [(first ?vs) ?v0]
    ;;  [?e ?a ?v0]
    ;;  (not-join [?e ?vs]
    ;;            [(identity ?vs) [?v ...]]
    ;;            (not-join [?e ?v]
    ;;                      [?e ?a ?v]))]
    ])

;; Use it as an input argument for datalog queries
(defonce block-attrs
  '[:db/id
    :block/uuid
    :block/type
    :block/left
    :block/format
    :block/title
    :block/refs
    :block/path-refs
    :block/tags
    :block/content
    :block/marker
    :block/priority
    :block/properties
    :block/body
    :block/pre-block?
    :block/scheduled
    :block/deadline
    :block/repeated?
    :block/created-at
    :block/updated-at
    :block/file
    {:block/page [:db/id :block/name :block/original-name :block/journal-day]}
    {:block/_parent ...}])

(defn transact-files-db!
  ([tx-data]
   (db-utils/transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (when-not config/publishing?
     (let [tx-data (->> (util/remove-nils tx-data)
                        (remove nil?)
                        (map #(dissoc % :file/handle :file/type)))]
       (when (seq tx-data)
         (when-let [conn (conn/get-conn repo-url false)]
           (d/transact! conn (vec tx-data))))))))

(defn pull-block
  [id]
  (let [repo (state/get-current-repo)]
    (when (conn/get-conn repo)
      (->
       (react/q repo [:blocks id] {}
                '[:find (pull ?block [*])
                  :in $ ?id
                  :where
                  [?block :block/uuid ?id]]
                id)
       react
       ffirst))))

(defn get-tag-pages
  [repo tag-name]
  (when tag-name
    (d/q '[:find ?original-name ?name
           :in $ ?tag
           :where
           [?e :block/name ?tag]
           [?page :block/tags ?e]
           [?page :block/original-name ?original-name]
           [?page :block/name ?name]]
         (conn/get-conn repo)
         (string/lower-case tag-name))))

(defn get-all-tagged-pages
  [repo]
  (d/q '[:find ?page-name ?tag
         :where
         [?page :block/tags ?e]
         [?e :block/name ?tag]
         [?page :block/name ?page-name]]
       (conn/get-conn repo)))

(defn get-pages
  [repo]
  (->> (d/q
        '[:find ?page-original-name
          :where
          [?page :block/name ?page-name]
          [(get-else $ ?page :block/original-name ?page-name) ?page-original-name]]
        (conn/get-conn repo))
       (map first)))

(defn get-modified-pages
  [repo]
  (-> (d/q
       '[:find ?page-name
         :where
         [?page :block/original-name ?page-name]]
       (conn/get-conn repo))
      (db-utils/seq-flatten)))

(defn get-page-alias
  [repo page-name]
  (when-let [conn (and repo (conn/get-conn repo))]
    (some->> (d/q '[:find ?alias
                    :in $ ?page-name
                    :where
                    [?page :block/name ?page-name]
                    [?page :block/alias ?alias]]
                  conn
                  page-name)
             db-utils/seq-flatten
             distinct)))

(defn get-alias-source-page
  [repo alias]
  (when-let [conn (and repo (conn/get-conn repo))]
    (let [pages (->>
                 (d/q '[:find (pull ?p [*])
                        :in $ ?alias
                        :where
                        [?a :block/name ?alias]
                        [?p :block/alias ?a]]
                      conn
                      alias)
                 (db-utils/seq-flatten))]
      (when (seq pages)
        (some (fn [page]
                (let [aliases (->> (get-in page [:block/properties :alias])
                                   (map string/lower-case)
                                   set)]
                  (when (contains? aliases alias)
                    page)))
              pages)))))

(defn get-files
  [repo]
  (when-let [conn (conn/get-conn repo)]
    (->> (d/q
          '[:find ?path
             ;; ?modified-at
            :where
            [?file :file/path ?path]
            ;; [?file :file/last-modified-at ?modified-at]
            ]
          conn)
         (seq)
         ;; (sort-by last)
         (reverse))))

(defn get-files-blocks
  [repo-url paths]
  (let [paths (set paths)
        pred (fn [_db e]
               (contains? paths e))]
    (-> (d/q '[:find ?block
               :in $ ?pred
               :where
               [?file :file/path ?path]
               [(?pred $ ?path)]
               [?block :block/file ?file]]
             (conn/get-conn repo-url) pred)
        db-utils/seq-flatten)))

(defn get-file-blocks
  [repo-url path]
  (-> (d/q '[:find ?block
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?block :block/file ?file]]
           (conn/get-conn repo-url) path)
      db-utils/seq-flatten))

(defn get-file-pages
  [repo-url path]
  (-> (d/q '[:find ?page
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :block/file ?file]]
           (conn/get-conn repo-url) path)
      db-utils/seq-flatten))

(defn set-file-last-modified-at!
  [repo path last-modified-at]
  (when (and repo path last-modified-at)
    (when-let [conn (conn/get-conn repo false)]
      (d/transact! conn
                   [{:file/path path
                     :file/last-modified-at last-modified-at}]))))

(defn get-file-last-modified-at
  [repo path]
  (when (and repo path)
    (when-let [conn (conn/get-conn repo false)]
      (-> (d/entity (d/db conn) [:file/path path])
          :file/last-modified-at))))

(defn file-exists?
  [repo path]
  (when (and repo path)
    (when-let [conn (conn/get-conn repo false)]
      (d/entity (d/db conn) [:file/path path]))))

(defn get-file
  ([path]
   (get-file (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (->
      (react/q repo [:file/content path]
               {:use-cache? true}
               '[:find ?content
                 :in $ ?path
                 :where
                 [?file :file/path ?path]
                 [?file :file/content ?content]]
               path)
      react
      ffirst))))

(defn get-file-contents
  [repo]
  (when-let [conn (conn/get-conn repo)]
    (->>
     (d/q
      '[:find ?path ?content
        :where
        [?file :file/path ?path]
        [?file :file/content ?content]]
      conn)
     (into {}))))


(defn get-files-full
  [repo]
  (when-let [conn (conn/get-conn repo)]
    (->>
     (d/q
      '[:find (pull ?file [*])
        :where
        [?file :file/path]]
      conn)
     (flatten))))

(defn get-file-by-path
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (conn/get-conn repo)]
      (d/pull conn '[*] [:file/path file-path]))))

(defn get-custom-css
  []
  (when-let [repo (state/get-current-repo)]
    (get-file (config/get-file-path repo "logseq/custom.css"))))

(defn get-file-no-sub
  ([path]
   (get-file-no-sub (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (when-let [conn (conn/get-conn repo)]
       (:file/content (d/entity conn [:file/path path]))))))

(defn get-block-by-uuid
  [id]
  (db-utils/entity [:block/uuid (if (uuid? id) id (uuid id))]))

(defn query-block-by-uuid
  [id]
  (db-utils/pull [:block/uuid (if (uuid? id) id (uuid id))]))

(defn get-page-format
  [page-name]
  (when-let [file (:block/file (db-utils/entity [:block/name page-name]))]
    (when-let [path (:file/path (db-utils/entity (:db/id file)))]
      (format/get-format path))))

(defn page-alias-set
  [repo-url page]
  (when-let [page-id (:db/id (db-utils/entity repo-url [:block/name page]))]
    (->>
     (d/q '[:find ?e
            :in $ ?page-name %
            :where
            [?page :block/name ?page-name]
            (alias ?page ?e)]
          (conn/get-conn repo-url)
          page
          '[[(alias ?e2 ?e1)
             [?e2 :block/alias ?e1]]
            [(alias ?e2 ?e1)
             [?e1 :block/alias ?e2]]
            [(alias ?e3 ?e1)
             [?e1 :block/alias ?e2]
             [?e2 :block/alias ?e3]]])
     db-utils/seq-flatten
     (set)
     (set/union #{page-id}))))

(defn get-page-names-by-ids
  ([ids]
   (get-page-names-by-ids (state/get-current-repo) ids))
  ([repo ids]
   (when repo
     (->> (db-utils/pull-many repo '[:block/name] ids)
          (map :block/name)))))

(defn get-page-ids-by-names
  ([names]
   (get-page-ids-by-names (state/get-current-repo) names))
  ([repo names]
   (when repo
     (let [lookup-refs (map (fn [name]
                              [:block/name (string/lower-case name)]) names)]
       (->> (db-utils/pull-many repo '[:db/id] lookup-refs)
            (mapv :db/id))))))

(defn get-page-alias-names
  [repo page-name]
  (let [alias-ids (page-alias-set repo page-name)]
    (when (seq alias-ids)
      (->> (get-page-names-by-ids repo alias-ids)
           distinct
           (remove #(= (string/lower-case %) (string/lower-case page-name)))))))

(defn get-block-refs-count
  [repo]
  (->> (d/q
        '[:find ?id2 ?id1
          :where
          [?id1 :block/refs ?id2]]
        (conn/get-conn repo))
       (map first)
       (frequencies)))

(defn with-block-refs-count
  [repo blocks]
  (let [db-ids (map :db/id blocks)
        refs (get-block-refs-count repo)]
    (map (fn [block]
           (assoc block :block/block-refs-count
                  (get refs (:db/id block))))
         blocks)))

(defn page-blocks-transform
  [repo-url result]
  (let [result (db-utils/seq-flatten result)]
    (->> (db-utils/with-repo repo-url result)
         (with-block-refs-count repo-url))))

(defn with-pages
  [blocks]
  (let [pages-ids (->> (map (comp :db/id :block/page) blocks)
                       (remove nil?))
        pages (when (seq pages-ids)
                (db-utils/pull-many '[:db/id :block/name :block/original-name :block/journal-day] pages-ids))
        pages-map (reduce (fn [acc p] (assoc acc (:db/id p) p)) {} pages)
        blocks (map
                (fn [block]
                  (assoc block :block/page
                         (get pages-map (:db/id (:block/page block)))))
                blocks)]
    blocks))

(defn get-page-properties
  [page]
  (when-let [page (db-utils/entity [:block/name page])]
    (:block/properties page)))

(defn get-page-blocks
  ([page]
   (get-page-blocks (state/get-current-repo) page nil))
  ([repo-url page]
   (get-page-blocks repo-url page nil))
  ([repo-url page {:keys [use-cache? pull-keys]
                   :or {use-cache? true
                        pull-keys '[*]}}]
   (let [page (string/lower-case page)
         page-id (or (:db/id (db-utils/entity repo-url [:block/name page]))
                     (:db/id (db-utils/entity repo-url [:block/original-name page])))
         db (conn/get-conn repo-url)]
     (when page-id
       (some->
        (react/q repo-url [:page/blocks page-id]
                 {:use-cache? use-cache?
                  :transform-fn #(page-blocks-transform repo-url %)
                  :query-fn (fn [db]
                              (let [datoms (d/datoms db :avet :block/page page-id)
                                    block-eids (mapv :e datoms)]
                                (db-utils/pull-many repo-url pull-keys block-eids)))}
                 nil)
        react)))))

(defn get-page-blocks-no-cache
  ([page]
   (get-page-blocks-no-cache (state/get-current-repo) page nil))
  ([repo-url page]
   (get-page-blocks-no-cache repo-url page nil))
  ([repo-url page {:keys [pull-keys]
                   :or {pull-keys '[*]}}]
   (let [page (string/lower-case page)
         page-id (or (:db/id (db-utils/entity repo-url [:block/name page]))
                     (:db/id (db-utils/entity repo-url [:block/original-name page])))
         db (conn/get-conn repo-url)]
     (when page-id
       (let [datoms (d/datoms db :avet :block/page page-id)
             block-eids (mapv :e datoms)]
         (some->> (db-utils/pull-many repo-url pull-keys block-eids)
                  (page-blocks-transform repo-url)))))))

(defn get-page-blocks-count
  [repo page-id]
  (when-let [db (conn/get-conn repo)]
    (count (d/datoms db :avet :block/page page-id))))

(defn get-block-parent
  ([block-id]
   (get-block-parent (state/get-current-repo) block-id))
  ([repo block-id]
   (when-let [conn (conn/get-conn repo)]
     (when-let [block (d/entity conn [:block/uuid block-id])]
       (:block/parent block)))))

;; non recursive query
(defn get-block-parents
  [repo block-id depth]
  (when-let [conn (conn/get-conn repo)]
    (loop [block-id block-id
           parents (list)
           d 1]
      (if (> d depth)
        parents
        (if-let [parent (get-block-parent repo block-id)]
          (recur (:block/uuid parent) (conj parents parent) (inc d))
          parents)))))

(comment
  (defn get-immediate-children-v2
    [repo block-id]
    (d/pull (conn/get-conn repo)
            '[:block/_parent]
            [:block/uuid block-id])))

;; Use built-in recursive
(defn get-block-parents-v2
  [repo block-id]
  (d/pull (conn/get-conn repo)
          '[:db/id :block/properties {:block/parent ...}]
          [:block/uuid block-id]))

(defn parents-collapsed?
  [repo block-id]
  (when-let [block (:block/parent (get-block-parents-v2 repo block-id))]
    (->> (tree-seq map? (fn [x] [(:block/parent x)]) block)
         (map (comp :collapsed :block/properties))
         (some true?))))

(defn get-block-page
  [repo block-id]
  (when-let [block (db-utils/entity repo [:block/uuid block-id])]
    (db-utils/entity repo (:db/id (:block/page block)))))

(defn block-and-children-transform
  [result repo-url block-uuid]
  (some->> result
           db-utils/seq-flatten
           (db-utils/with-repo repo-url)
           (with-block-refs-count repo-url)))

(defn get-block-children-ids
  [repo block-uuid]
  (when-let [conn (conn/get-conn repo)]
    (let [eid (:db/id (db-utils/entity repo [:block/uuid block-uuid]))]
      (->> (d/q
            '[:find ?id
              :in $ ?p %
              :where
              (parent ?p ?c)
              [?c :block/uuid ?id]]
            conn
            eid
            rules)
           (apply concat)))))

;; FIXME: alert
(defn- keep-only-one-file
  [blocks parent]
  (if-let [file (:db/id (:block/file parent))]
    (filter (fn [b] (= (:db/id (:block/file b)) file)) blocks)
    blocks))

(defn sort-by-left
  [blocks parent]
  (let [blocks (keep-only-one-file blocks parent)]
    (when (not= (count blocks) (count (set (map :block/left blocks))))
      (let [duplicates (->> (map (comp :db/id :block/left) blocks)
                            frequencies
                            (filter (fn [[_k v]] (> v 1)))
                            (map (fn [[k _v]]
                                   (let [left (db-utils/pull k)]
                                     {:left left
                                      :duplicates (->>
                                                   (filter (fn [block]
                                                             (= k (:db/id (:block/left block))))
                                                           blocks)
                                                   (map #(select-keys % [:db/id :block/level :block/content :block/file])))}))))]
        (util/pprint duplicates)))
    (assert (= (count blocks) (count (set (map :block/left blocks)))) "Each block should have a different left node")
    (let [left->blocks (reduce (fn [acc b] (assoc acc (:db/id (:block/left b)) b)) {} blocks)]
      (loop [block parent
             result []]
        (if-let [next (get left->blocks (:db/id block))]
          (recur next (conj result next))
          (vec result))))))

(defn- sort-by-left-recursive
  [form]
  (walk/postwalk (fn [f]
                   (if (and (map? f)
                            (:block/_parent f))
                     (let [children (:block/_parent f)]
                       (-> f
                           (dissoc :block/_parent)
                           (assoc :block/children (sort-by-left children f))))
                     f))
                 form))

(defn get-block-immediate-children
  "Doesn't include nested children."
  [repo block-uuid]
  (when-let [conn (conn/get-conn repo)]
    (-> (d/q
          '[:find [(pull ?b [*]) ...]
            :in $ ?parent-id
            :where
            [?b :block/parent ?parent]
            [?parent :block/uuid ?parent-id]]
          conn
          block-uuid)
        (sort-by-left (db-utils/entity [:block/uuid block-uuid])))))

(defn get-blocks-by-page
  [id-or-lookup-ref]
  (when-let [conn (conn/get-conn)]
    (->
     (d/q
      '[:find (pull ?block [*])
        :in $ ?page
        :where
        [?block :block/page ?page]]
      conn id-or-lookup-ref)
     flatten)))

(defn get-block-children
  "Including nested children."
  [repo block-uuid]
  (when-let [conn (conn/get-conn repo)]
    (let [ids (get-block-children-ids repo block-uuid)
          ids (map (fn [id] [:block/uuid id]) ids)]
      (when (seq ids)
        (db-utils/pull-many repo '[*] ids)))))

(defn get-block-and-children
  ([repo block-uuid]
   (get-block-and-children repo block-uuid true))
  ([repo block-uuid use-cache?]
   (some-> (react/q repo [:block/block block-uuid]
             {:use-cache? use-cache?
              :transform-fn #(block-and-children-transform % repo block-uuid)}
             '[:find (pull ?c [*])
               :in $ ?id %
               :where
               [?b :block/uuid ?id]
               (or-join [?b ?c ?id]
                        ;; including the parent
                        [?c :block/uuid ?id]
                        (parent ?b ?c))]
             block-uuid
             rules)
           react)))

(defn get-file-page
  ([file-path]
   (get-file-page file-path true))
  ([file-path original-name?]
   (when-let [repo (state/get-current-repo)]
     (when-let [conn (conn/get-conn repo)]
       (some->
        (d/q
         (if original-name?
           '[:find ?page-name
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :block/file ?file]
             [?page :block/original-name ?page-name]]
           '[:find ?page-name
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :block/file ?file]
             [?page :block/name ?page-name]])
         conn file-path)
        db-utils/seq-flatten
        first)))))

(defn get-page-file
  [page-name]
  (some-> (or (db-utils/entity [:block/name page-name])
              (db-utils/entity [:block/original-name page-name]))
          :block/file))

(defn get-file-page-id
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (conn/get-conn repo)]
      (some->
       (d/q
        '[:find ?page
          :in $ ?path
          :where
          [?file :file/path ?path]
          [?page :block/file ?file]]
        conn file-path)
       db-utils/seq-flatten
       first))))

(defn get-page
  [page-name]
  (if (util/uuid-string? page-name)
    (db-utils/entity [:block/uuid (uuid page-name)])
    (db-utils/entity [:block/name page-name])))

(defn- heading-block?
  [block]
  (and
   (vector? block)
   (= "Heading" (first block))))

(defn get-page-original-name
  [page-name]
  (when page-name
    (let [page (db-utils/pull [:block/name (string/lower-case page-name)])]
      (or (:block/original-name page)
          (:block/name page)))))

(defn get-journals-length
  []
  (let [today (db-utils/date->int (js/Date.))]
    (d/q '[:find (count ?page) .
           :in $ ?today
           :where
           [?page :block/journal? true]
           [?page :block/journal-day ?journal-day]
           [(<= ?journal-day ?today)]]
         (conn/get-conn (state/get-current-repo))
         today)))

(defn get-latest-journals
  ([n]
   (get-latest-journals (state/get-current-repo) n))
  ([repo-url n]
   (when (conn/get-conn repo-url)
     (let [date (js/Date.)
           _ (.setDate date (- (.getDate date) (dec n)))
           today (db-utils/date->int (js/Date.))
           pages (->>
                  (react/q repo-url [:journals] {:use-cache? false}
                           '[:find ?page-name ?journal-day
                             :in $ ?today
                             :where
                             [?page :block/name ?page-name]
                             [?page :block/journal? true]
                             [?page :block/journal-day ?journal-day]
                             [(<= ?journal-day ?today)]]
                           today)
                  (react)
                  (sort-by last)
                  (reverse)
                  (map first)
                  (take n))]
       (mapv
        (fn [page]
          [page
           (get-page-format page)])
        pages)))))

;; get pages that this page referenced
(defn get-page-referenced-pages
  [repo page]
  (when (conn/get-conn repo)
    (let [pages (page-alias-set repo page)
          page-id (:db/id (db-utils/entity [:block/name page]))
          ref-pages (->> (react/q repo [:page/ref-pages page-id] {:use-cache? false}
                                  '[:find ?ref-page-name
                                    :in $ ?pages
                                    :where
                                    [?block :block/page ?p]
                                    [(contains? ?pages ?p)]
                                    [?block :block/refs ?ref-page]
                                    [?ref-page :block/name ?ref-page-name]]
                                  pages)
                         react
                         db-utils/seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) ref-pages))))

(defn get-page-linked-refs-refed-pages
  [repo page]
  (when-let [conn (conn/get-conn repo)]
    (->
     (d/q
      '[:find [?ref-page ...]
        :in $ % ?page
        :where
        [?p :block/name ?page]
        [?b :block/path-refs ?p]
        [?b :block/refs ?other-p]
        [(not= ?p ?other-p)]
        [?other-p :block/original-name ?ref-page]]
      conn
      rules
      page)
     (distinct))))

;; Ignore files with empty blocks for now
(defn get-empty-pages
  [repo]
  (when-let [conn (conn/get-conn repo)]
    (->
     (d/q
      '[:find ?page
        :where
        [?p :block/name ?page]
        (not [?p :block/file])]
      conn)
     (db-utils/seq-flatten)
     (distinct))))

(defn page-empty?
  [repo page]
  (nil? (:block/file (db-utils/entity repo [:block/name (string/lower-case page)]))))

(defn get-pages-relation
  [repo with-journal?]
  (when-let [conn (conn/get-conn repo)]
    (let [q (if with-journal?
              '[:find ?page ?ref-page-name
                :where
                [?p :block/name ?page]
                [?block :block/page ?p]
                [?block :block/refs ?ref-page]
                [?ref-page :block/name ?ref-page-name]]
              '[:find ?page ?ref-page-name
                :where
                [?p :block/journal? false]
                [?p :block/name ?page]
                [?block :block/page ?p]
                [?block :block/refs ?ref-page]
                [?ref-page :block/name ?ref-page-name]])]
      (->>
       (d/q q conn)
       (map (fn [[page ref-page-name]]
              [page ref-page-name]))))))

;; get pages who mentioned this page
;; TODO: use :block/_refs
(defn get-pages-that-mentioned-page
  [repo page]
  (when (conn/get-conn repo)
    (let [page-id (:db/id (db-utils/entity [:block/name page]))
          pages (page-alias-set repo page)
          mentioned-pages (->> (react/q repo [:page/mentioned-pages page-id] {:use-cache? false}
                                        '[:find ?mentioned-page-name
                                          :in $ ?pages ?page-name
                                          :where
                                          [?block :block/refs ?p]
                                          [(contains? ?pages ?p)]
                                          [?block :block/page ?mentioned-page]
                                          [?mentioned-page :block/name ?mentioned-page-name]]
                                        pages
                                        page)
                               react
                               db-utils/seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) mentioned-pages))))

(defn- remove-children!
  [blocks]
  (let [parents (->> (mapcat :block/parent blocks)
                     (map :db/id)
                     (set))]
    (if (seq parents)
      (filter (fn [block] (contains? parents (:db/id block))) blocks)
      blocks)))

(defn has-children?
  [repo block-id]
  (let [db (conn/get-conn repo)]
    (when-let [block (db-utils/entity [:block/uuid block-id])]
      ;; perf: early stop
      (let [result (d/datoms db :avet :block/parent (:db/id block))]
        (boolean (seq result))))))

;; TODO: improve perf
(defn with-children-refs
  [repo blocks]
  (when-let [conn (conn/get-conn repo)]
    (when (seq blocks)
      (let [block-ids (set (map :db/id blocks))
            refs (d/q
                  '[:find ?p ?ref
                    :in $ % ?block-ids
                    :where
                    (parent ?p ?b)
                    [(contains? ?block-ids ?p)]
                    [?b :block/refs ?ref]]
                  conn
                  rules
                  block-ids)
            refs (->> (group-by first refs)
                      (medley/map-vals #(set (map (fn [[_ id]] {:db/id id}) %))))]
        (map (fn [block] (assoc block :block/children-refs
                                (get refs (:db/id block)))) blocks)))))

(defn get-page-referenced-blocks-no-cache
  [page-id]
  (when-let [repo (state/get-current-repo)]
    (->>
     (d/q '[:find (pull ?b [*])
            :in $ ?page-id
            :where
            [?b :block/refs ?page-id]]
          (conn/get-conn repo)
          page-id)
     (flatten))))

(defn get-page-referenced-blocks
  ([page]
   (get-page-referenced-blocks (state/get-current-repo) page))
  ([repo page]
   (when repo
     (when (conn/get-conn repo)
       (let [page-id (:db/id (db-utils/entity [:block/name page]))
             pages (page-alias-set repo page)
             aliases (set/difference pages #{page-id})
             query-result (if (seq aliases)
                            (let [rules '[[(find-blocks ?block ?ref-page ?pages ?alias ?aliases)
                                           [?block :block/page ?alias]
                                           [(contains? ?aliases ?alias)]]
                                          [(find-blocks ?block ?ref-page ?pages ?alias ?aliases)
                                           [?block :block/refs ?ref-page]
                                           [(contains? ?pages ?ref-page)]]]]
                              (react/q repo [:block/refed-blocks page-id] {}
                                '[:find [(pull ?block ?block-attrs) ...]
                                  :in $ % ?pages ?aliases ?block-attrs
                                  :where
                                  (find-blocks ?block ?ref-page ?pages ?alias ?aliases)]
                                rules
                                pages
                                aliases
                                block-attrs))
                            (react/q repo [:block/refed-blocks page-id] {:use-cache? false}
                              '[:find [(pull ?ref-block ?block-attrs) ...]
                                :in $ ?page ?block-attrs
                                :where
                                [?ref-block :block/refs ?page]]
                              page-id
                              block-attrs))
             result (->> query-result
                         react
                         (sort-by-left-recursive)
                         (remove (fn [block]
                                   (= page-id (:db/id (:block/page block)))))
                         ;; (with-children-refs repo)
                         db-utils/group-by-page
                         (map (fn [[k blocks]]
                                (let [k (if (contains? aliases (:db/id k))
                                          (assoc k :block/alias? true)
                                          k)]
                                  [k blocks]))))]
         result)))))

(defn get-date-scheduled-or-deadlines
  [journal-title]
  (when-let [date (date/journal-title->int journal-title)]
    (let [future-days (state/get-scheduled-future-days)]
      (when-let [repo (state/get-current-repo)]
        (when-let [conn (conn/get-conn repo)]
          (->> (react/q repo [:custom :scheduled-deadline journal-title] {}
                 '[:find [(pull ?block ?block-attrs) ...]
                   :in $ ?day ?future ?block-attrs
                   :where
                   (or
                    [?block :block/scheduled ?d]
                    [?block :block/deadline ?d])
                   [(get-else $ ?block :block/repeated? false) ?repeated]
                   [(get-else $ ?block :block/marker "NIL") ?marker]
                   [(not= ?marker "DONE")]
                   [(not= ?marker "CANCELED")]
                   [(not= ?marker "CANCELLED")]
                   [(<= ?d ?future)]
                   (or-join [?repeated ?d ?day]
                            [(true? ?repeated)]
                            [(>= ?d ?day)])]
                 date
                 (+ date future-days)
                 block-attrs)
               react
               (sort-by-left-recursive)
               db-utils/group-by-page))))))

(defn get-files-that-referenced-page
  [page-id]
  (when-let [repo (state/get-current-repo)]
    (when-let [db (conn/get-conn repo)]
      (->> (d/q
            '[:find ?path
              :in $ ?page-id
              :where
              [?block :block/refs ?page-id]
              [?block :block/page ?p]
              [?p :block/file ?f]
              [?f :file/path ?path]]
            db
            page-id)
           (db-utils/seq-flatten)))))

(defn get-page-unlinked-references
  [page]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (conn/get-conn repo)]
      (let [page-id (:db/id (db-utils/entity [:block/name page]))
            pattern (re-pattern (str "(?i)(?<!#)(?<!\\[\\[)" page "(?!\\]\\])"))]
        (->> (d/q
               '[:find [(pull ?block ?block-attrs) ...]
                 :in $ ?pattern ?block-attrs ?page-id
                 :where
                 [?block :block/content ?content]
                 [?block :block/page ?page]
                 [(not= ?page ?page-id)]
                 [(re-find ?pattern ?content)]]
               conn
               pattern
               block-attrs
               page-id)
             (sort-by-left-recursive)
             db-utils/group-by-page)))))

;; TODO: Replace recursive queries with datoms index implementation
;; see https://github.com/tonsky/datascript/issues/130#issuecomment-169520434
(defn get-block-referenced-blocks
  [block-uuid]
  (when-let [repo (state/get-current-repo)]
    (when (conn/get-conn repo)
      (let [block (db-utils/entity [:block/uuid block-uuid])]
        (->> (react/q repo [:block/refed-blocks (:db/id block)]
               {}
               '[:find [(pull ?ref-block ?block-attrs) ...]
                 :in $ ?block-uuid ?block-attrs
                :where
                [?block :block/uuid ?block-uuid]
                [?ref-block :block/refs ?block]]
               block-uuid
               block-attrs)
            react
            (sort-by-left-recursive)
            db-utils/group-by-page)))))

(defn get-matched-blocks
  [match-fn limit]
  (when-let [repo (state/get-current-repo)]
    (let [pred (fn [db content]
                 (match-fn content))]
      (->> (d/q
            '[:find ?block
              :in $ ?pred
              :where
              [?block :block/content ?content]
              [(?pred $ ?content)]]
            (conn/get-conn)
            pred)
           (take limit)
           db-utils/seq-flatten
           (db-utils/pull-many '[:block/uuid
                                 :block/content
                                 :block/properties
                                 :block/format
                                 {:block/page [:block/name]}])))))

;; TODO: Does the result preserves the order of the arguments?
(defn get-blocks-contents
  [repo block-uuids]
  (let [db (conn/get-conn repo)]
    (db-utils/pull-many repo '[:block/content]
                        (mapv (fn [id] [:block/uuid id]) block-uuids))))

(defn journal-page?
  [page-name]
  (:block/journal? (db-utils/entity [:block/name page-name])))

(defn mark-repo-as-cloned!
  [repo-url]
  (db-utils/transact!
   [{:repo/url repo-url
     :repo/cloned? true}]))

(defn cloned?
  [repo-url]
  (when-let [conn (conn/get-conn repo-url)]
    (->
     (d/q '[:find ?cloned
            :in $ ?repo-url
            :where
            [?repo :repo/url ?repo-url]
            [?repo :repo/cloned? ?cloned]]
          conn
          repo-url)
     ffirst)))

(defn get-db-type
  [repo]
  (db-utils/get-key-value repo :db/type))

(defn local-native-fs?
  [repo]
  (= :local-native-fs (get-db-type repo)))

(defn get-public-pages
  [db]
  (-> (d/q
       '[:find ?p
         :where
         [?p :block/name]
         [?p :block/properties ?properties]
         [(get ?properties :public) ?pub]
         [(= true ?pub)]]
       db)
      (db-utils/seq-flatten)))

(defn get-all-templates
  []
  (let [pred (fn [db properties]
               (some? (:template properties)))]
    (->> (d/q
          '[:find ?b ?p
            :in $ ?pred
            :where
            [?b :block/properties ?p]
            [(?pred $ ?p)]]
          (conn/get-conn)
          pred)
         (map (fn [[e m]]
                [(get m :template) e]))
         (into {}))))

(defonce blocks-count-cache (atom nil))

(defn blocks-count
  ([]
   (blocks-count true))
  ([cache?]
   (if (and cache? @blocks-count-cache)
     @blocks-count-cache
     (when-let [conn (conn/get-conn)]
       (let [n (count (d/datoms conn :avet :block/uuid))]
         (reset! blocks-count-cache n)
         n)))))

;; block/uuid and block/content
(defn get-all-block-contents
  []
  (when-let [conn (conn/get-conn)]
    (->> (d/datoms conn :avet :block/uuid)
         (map :v)
         (map (fn [id]
                (let [e (db-utils/entity [:block/uuid id])]
                  {:db/id (:db/id e)
                   :block/uuid id
                   :block/page (:db/id (:block/page e))
                   :block/content (:block/content e)
                   :block/format (:block/format e)}))))))

(defn clean-export!
  [db]
  (let [remove? #(contains? #{"me" "recent" "file"} %)
        filtered-db (d/filter db
                              (fn [db datom]
                                (let [ns (namespace (:a datom))]
                                  (not (remove? ns)))))
        datoms (d/datoms filtered-db :eavt)]
    @(d/conn-from-datoms datoms db-schema/schema)))

(defn filter-only-public-pages-and-blocks
  [db]
  (let [public-pages (get-public-pages db)]
    (when (seq public-pages)
      (let [public-pages (set public-pages)
            exported-namespace? #(contains? #{"block" "me" "recent"} %)
            filtered-db (d/filter db
                                  (fn [db datom]
                                    (let [ns (namespace (:a datom))]
                                      (or
                                       (not (exported-namespace? ns))
                                       ;; (and (= ns "page")
                                       ;;      (contains? public-pages (:e datom)))
                                       (and (= ns "block")
                                            (or
                                             (contains? public-pages (:e datom))
                                             (contains? public-pages (:db/id (:block/page (d/entity db (:e datom)))))))))))
            datoms (d/datoms filtered-db :eavt)
            public-assets-filesnames
            (keep
             (fn [datom]

               (if (= :block/content (:a datom))
                 (let [matched (re-seq #"\([./]*/assets/([^)]+)\)" (:v datom))

                       path (get (get (into [] matched) 0) 1)]
                   path)))
             datoms)]


        [@(d/conn-from-datoms datoms db-schema/schema) (into [] public-assets-filesnames)]))))

(defn delete-blocks
  [repo-url files]
  (when (seq files)
    (let [blocks (get-files-blocks repo-url files)]
      (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks))))

(defn delete-files
  [files]
  (mapv (fn [path] [:db.fn/retractEntity [:file/path path]]) files))

(defn delete-file-blocks!
  [repo-url path]
  (let [blocks (get-file-blocks repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks)))

(defn delete-file-pages!
  [repo-url path]
  (let [pages (get-file-pages repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) pages)))

(defn delete-file-tx
  [repo-url file-path]
  (->>
   (concat
    (delete-file-blocks! repo-url file-path)
    (delete-file-pages! repo-url file-path)
    [[:db.fn/retractEntity [:file/path file-path]]])
   (remove nil?)))

(defn delete-file!
  [repo-url file-path]
  (db-utils/transact! repo-url (delete-file-tx repo-url file-path)))

(defn delete-pages-by-files
  [files]
  (let [pages (->> (mapv get-file-page files)
                   (remove nil?))]
    (when (seq pages)
      (mapv (fn [page] [:db.fn/retractEntity [:block/name page]]) (map string/lower-case pages)))))

(defn remove-all-aliases!
  [repo]
  (let [page-ids (->>
                  (d/q '[:find ?e
                         :where
                         [?e :block/alias]]
                       (conn/get-conn repo))
                  (apply concat)
                  (distinct))
        tx-data (map (fn [page-id] [:db/retract page-id :block/alias]) page-ids)]
    (when (seq tx-data)
      (db-utils/transact! repo tx-data))))

(defn set-file-content!
  [repo path content]
  (when (and repo path)
    (let [tx-data {:file/path path
                   :file/content content}]
      (react/transact-react!
       repo
       [tx-data]
       {:key [:file/content path]}))))

(defn get-pre-block
  [repo page-id]
  (-> (d/q '[:find (pull ?b [*])
             :in $ ?page
             :where
             [?b :block/page ?page]
             [?b :block/pre-block? true]]
           (conn/get-conn repo)
           page-id)
      ffirst))
