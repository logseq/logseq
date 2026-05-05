(ns frontend.worker.markdown-mirror
  "Markdown mirror derived-file support for DB graphs."
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.graph-dir :as graph-dir]
            [frontend.worker.platform :as platform]
            [lambdaisland.glogi :as log]
            [logseq.cli.common.file :as common-file]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [promesa.core :as p]))

(defn repo-mirror-dir
  [repo]
  (str (graph-dir/repo->encoded-graph-dir-name repo) "/mirror/markdown"))

(def ^:private invalid-file-name-chars-re
  #"[<>:\"|?*\\/]")

(def ^:private ascii-control-re
  #"[\x00-\x1F]")

(def ^:private trailing-space-or-dot-re
  #"[ \.]+$")

(def ^:private reserved-windows-device-names
  (into #{"CON" "PRN" "AUX" "NUL"}
        (concat (map #(str "COM" %) (range 1 10))
                (map #(str "LPT" %) (range 1 10)))))

(def ^:private max-file-stem-length 160)
(def ^:private page-marker-re #"^\s*<!--\s*logseq:page\s+([0-9a-fA-F-]{36})\s*-->\s*$")
(def ^:private block-marker-re #"^\s*<!--\s*logseq:block\s+([0-9a-fA-F-]{36})\s*-->\s*$")
(def ^:private markdown-block-re #"^(\s*)-\s?(.*)$")
(def ^:private property-line-re #"^\s*[^:\s][^:]*::\s?.*$")
(def ^:private ref-or-tag-re #"(#?)\[\[([^\[\]]+)\]\]")
(def ^:private simple-hashtag-re #"(?i)(^|\s)#([^\s#\[\]\(\),.;:'\"`]+)")
(def ^:private journal-relative-path-re #"^journals/(\d{4})_(\d{2})_(\d{2})\.md$")
(def ^:private page-relative-path-re #"^pages/(.+)\.md$")

(defonce ^:private *repo->enabled? (atom {}))
(defonce ^:private *repo->queued-page-jobs (atom {}))
(defonce ^:private *repo->flush-timeout (atom {}))
(defonce ^:private *repo->file-watchers (atom {}))
(defonce ^:private *repo->recent-writes (atom {}))

(declare <read-text <write-if-changed! supported-runtime?)

(defn- normalize-unicode
  [s]
  (let [s (str s)]
    (if (fn? (.-normalize s))
      (.normalize s "NFC")
      s)))

(defn- reserved-windows-device-name?
  [s]
  (contains? reserved-windows-device-names
             (string/upper-case s)))

(defn normalize-file-stem
  [s]
  (when (some? s)
    (let [s' (-> (normalize-unicode s)
                 (string/replace invalid-file-name-chars-re "_")
                 (string/replace ascii-control-re "_")
                 (string/replace trailing-space-or-dot-re ""))
          s' (if (> (count s') max-file-stem-length)
               (subs s' 0 max-file-stem-length)
               s')]
      (when (and (not (string/blank? s'))
                 (not (reserved-windows-device-name? s')))
        s'))))

(defn- journal-file-stem
  [journal-day]
  (when journal-day
    (let [s (str journal-day)]
      (when (= 8 (count s))
        (str (subs s 0 4) "_" (subs s 4 6) "_" (subs s 6 8))))))

(defn page-relative-path
  ([db page]
   (page-relative-path db page {}))
  ([db page {:keys [journal-file-stem-fn]
             :or {journal-file-stem-fn journal-file-stem}}]
   (when page
     (if (ldb/journal? page)
       (when-let [stem (normalize-file-stem (journal-file-stem-fn (:block/journal-day page)))]
         (str "journals/" stem ".md"))
       (when-let [stem (normalize-file-stem (:block/title page))]
         (let [duplicate-pages (->> (d/datoms db :avet :block/title (:block/title page))
                                    (map #(d/entity db (:e %)))
                                    (filter #(and (ldb/page? %)
                                                  (not (ldb/journal? %))))
                                    (sort-by (comp str :block/uuid)))
               index (inc (or (first (keep-indexed
                                      (fn [idx p]
                                        (when (= (:block/uuid page) (:block/uuid p))
                                          idx))
                                      duplicate-pages))
                              0))
               stem' (if (= 1 index)
                       stem
                       (str stem " (" index ")"))]
           (str "pages/" stem' ".md")))))))

(defn- mirror-path
  [repo relative-path]
  (str (repo-mirror-dir repo) "/" relative-path))

(defn- normalize-watch-path
  [path]
  (some-> path str (string/replace "\\" "/")))

(defn- markdown-relative-path?
  [relative-path]
  (boolean
   (or (re-matches page-relative-path-re relative-path)
       (re-matches journal-relative-path-re relative-path))))

(defn- watch-root-path
  [platform* repo]
  (let [relative-root (repo-mirror-dir repo)]
    (if-let [f (get-in platform* [:storage :resolve-text-path])]
      (f relative-root)
      relative-root)))

(defn- watcher-event-relative-path
  [repo watch-root path]
  (let [path' (normalize-watch-path path)
        watch-root' (normalize-watch-path watch-root)
        mirror-dir' (normalize-watch-path (repo-mirror-dir repo))
        prefix (str watch-root' "/")
        mirror-prefix (str mirror-dir' "/")
        relative-path (cond
                        (and watch-root'
                             (string/starts-with? path' prefix))
                        (subs path' (count prefix))

                        (string/starts-with? path' mirror-prefix)
                        (subs path' (count mirror-prefix))

                        :else
                        path')]
    (when (and relative-path (markdown-relative-path? relative-path))
      relative-path)))

(defn- mark-recent-write!
  [repo path content]
  (swap! *repo->recent-writes assoc-in [repo path] {:time (common-util/time-ms)
                                                    :content content}))

(defn- recent-written-content
  [repo path ttl-ms]
  (when-let [{:keys [time content]} (get-in @*repo->recent-writes [repo path])]
    (if (< (- (common-util/time-ms) time) ttl-ms)
      content
      (do
        (swap! *repo->recent-writes update repo dissoc path)
        nil))))

(defn- parse-uuid-safe
  [s]
  (try
    (uuid s)
    (catch :default _e
      nil)))

(defn- line-level
  [spaces]
  (inc (quot (count spaces) 2)))

(defn- strip-prefix-spaces
  [line n]
  (if (and (<= n (count line))
           (every? #(= \space %) (subs line 0 n)))
    (subs line n)
    line))

(defn- fenced-code-boundary?
  [line]
  (let [line (string/triml line)]
    (or (string/starts-with? line "```")
        (string/starts-with? line "~~~"))))

(defn- append-block-line
  [blocks idx line]
  (update-in blocks [idx :title] #(str % "\n" line)))

(defn- continuation-line
  [line continuation-indent]
  (let [prefix (apply str (repeat continuation-indent " "))]
    (when (string/starts-with? line prefix)
      (strip-prefix-spaces line continuation-indent))))

(defn- parse-mirror-content
  [content]
  (let [lines (string/split-lines (or content ""))]
    (loop [[line & more] lines
           pending-marker nil
           page-uuid nil
           stack []
           blocks []
           current-block-idx nil
           continuation-indent nil
           fenced-code? false]
      (if (nil? line)
        {:page-uuid page-uuid
         :blocks blocks}
        (if fenced-code?
          (if (some? current-block-idx)
            (let [line' (strip-prefix-spaces line continuation-indent)
                  fenced-code?' (if (fenced-code-boundary? line')
                                  false
                                  fenced-code?)]
              (recur more pending-marker page-uuid stack
                     (append-block-line blocks current-block-idx line')
                     current-block-idx continuation-indent fenced-code?'))
            {:error :unsupported-top-level-markdown})
          (if-let [[_ page-uuid-str] (re-matches page-marker-re line)]
            (recur more nil (parse-uuid-safe page-uuid-str) stack blocks
                   current-block-idx continuation-indent fenced-code?)
            (if-let [[_ block-uuid-str] (re-matches block-marker-re line)]
              (recur more (parse-uuid-safe block-uuid-str) page-uuid stack blocks
                     current-block-idx continuation-indent fenced-code?)
              (if-let [[_ spaces title] (re-matches markdown-block-re line)]
                (let [current-level (line-level spaces)
                      idx (count blocks)
                      stack' (->> stack
                                  (remove (fn [{:keys [level]}] (>= level current-level)))
                                  vec)
                      parent-ref (:ref (peek stack'))
                      block {:uuid pending-marker
                             :idx idx
                             :title title
                             :level current-level
                             :parent-ref parent-ref}
                      stack'' (conj stack' {:level current-level
                                            :ref (or (:uuid block) idx)})
                      continuation-indent' (+ (count spaces) 2)]
                  (recur more nil page-uuid stack'' (conj blocks block)
                         idx continuation-indent' (fenced-code-boundary? title)))
                (cond
                  (or (string/blank? line)
                      (re-matches property-line-re line))
                  (recur more pending-marker page-uuid stack blocks
                         current-block-idx continuation-indent fenced-code?)

                  (and (some? current-block-idx)
                       (some? continuation-indent)
                       (continuation-line line continuation-indent))
                  (let [line' (continuation-line line continuation-indent)]
                    (recur more pending-marker page-uuid stack
                           (append-block-line blocks current-block-idx line')
                           current-block-idx continuation-indent (fenced-code-boundary? line')))

                  :else
                  {:error :unsupported-top-level-markdown})))))))))

(defn- relative-path->new-page
  [relative-path]
  (if-let [[_ y m d] (re-matches journal-relative-path-re relative-path)]
    (let [journal-day (parse-long (str y m d))]
      {:type :journal
       :journal-day journal-day
       :title (date-time-util/int->journal-title
               journal-day
               date-time-util/default-journal-title-formatter)
       :uuid (common-uuid/gen-uuid :journal-page-uuid journal-day)})
    (when-let [[_ stem] (re-matches page-relative-path-re relative-path)]
      (when-let [title (normalize-file-stem stem)]
        {:type :page
         :title title
         :uuid (random-uuid)}))))

(defn- existing-page-for-path
  [db relative-path parsed-page-uuid]
  (or (when-let [[_ y m d] (re-matches journal-relative-path-re relative-path)]
        (let [journal-day (parse-long (str y m d))]
          (first (map #(d/entity db (:e %))
                      (d/datoms db :avet :block/journal-day journal-day)))))
      (when-let [[_ stem] (re-matches page-relative-path-re relative-path)]
        (ldb/get-page db stem))
      (when-let [page (and parsed-page-uuid
                           (d/entity db [:block/uuid parsed-page-uuid]))]
        (when (= relative-path (page-relative-path db page))
          page))))

(defn- content-ref-targets
  [title]
  (let [title (or title "")
        page-ref-targets (keep (fn [[_ prefix page-title]]
                                 (when-not (common-util/uuid-string? page-title)
                                   {:title page-title
                                    :tag? (= "#" prefix)}))
                               (re-seq ref-or-tag-re title))
        simple-tag-targets (keep (fn [[_ _ tag-title]]
                                   (when-not (common-util/uuid-string? tag-title)
                                     {:title tag-title
                                      :tag? true}))
                                 (re-seq simple-hashtag-re title))]
    (distinct (concat page-ref-targets simple-tag-targets))))

(defn- ensure-tag-txs
  [db block-ref title page]
  (cond-> [[:db/add block-ref :block/tags :logseq.class/Tag]
           [:db/add block-ref :logseq.property.class/extends :logseq.class/Root]
           [:db/retract block-ref :block/tags :logseq.class/Page]]
    (nil? (:db/ident page))
    (conj [:db/add block-ref :db/ident (db-class/create-user-class-ident-from-name db title)])))

(defn- page-ref-plan
  [db title planned-pages now]
  (loop [[{target-title :title tag? :tag? :as target} & more] (content-ref-targets title)
         planned-pages planned-pages
         refs []
         tag-refs []
         page-txs []]
    (if (nil? target)
      {:planned-pages planned-pages
       :refs refs
       :page-txs page-txs
       :tag-refs tag-refs
       :db-title (db-content/title-ref->id-ref title refs {:replace-tag? true})}
      (let [page-title target-title
            page-name (common-util/page-name-sanity-lc page-title)
            planned-page (get planned-pages page-name)]
        (if planned-page
          (let [planned-pages' (if (and tag? (not (:tag? planned-page)))
                                 (assoc planned-pages page-name (assoc planned-page :tag? true))
                                 planned-pages)
                page-txs' (cond-> page-txs
                            (and tag? (not (:tag? planned-page)))
                            (into (ensure-tag-txs db
                                                  [:block/uuid (:block/uuid planned-page)]
                                                  page-title
                                                  nil)))]
            (recur more
                   planned-pages'
                   (conj refs planned-page)
                   (cond-> tag-refs tag? (conj planned-page))
                   page-txs'))
          (if-let [page (ldb/get-page db page-title)]
            (let [ref {:block/title (:block/title page)
                       :block/uuid (:block/uuid page)
                       :tag? (or tag?
                                 (some #(= :logseq.class/Tag (:db/ident %)) (:block/tags page)))}
                  page-txs' (cond-> page-txs
                              tag?
                              (into (ensure-tag-txs db (:db/id page) page-title page)))]
              (recur more
                     (assoc planned-pages page-name ref)
                     (conj refs ref)
                     (cond-> tag-refs tag? (conj ref))
                     page-txs'))
            (let [page-uuid (random-uuid)
                  ref {:block/title page-title
                       :block/uuid page-uuid
                       :tag? tag?}
                  page-tx {:block/title page-title
                           :block/name page-name
                           :block/uuid page-uuid
                           :block/tags (if tag?
                                         :logseq.class/Tag
                                         :logseq.class/Page)
                           :block/created-at now
                           :block/updated-at now}
                  page-tx (cond-> page-tx
                            tag?
                            (assoc :db/ident (db-class/create-user-class-ident-from-name db page-title)
                                   :logseq.property.class/extends :logseq.class/Root))]
              (recur more
                     (assoc planned-pages page-name ref)
                     (conj refs ref)
                     (cond-> tag-refs tag? (conj ref))
                     (conj page-txs page-tx)))))))))

(defn- with-content-ref-plans
  [db blocks now]
  (loop [[block & more] blocks
         planned-pages {}
         blocks' []
         page-txs []]
    (if (nil? block)
      {:blocks blocks'
       :page-txs page-txs}
      (let [{planned-pages' :planned-pages
             refs :refs
             tag-refs :tag-refs
             new-page-txs :page-txs
             db-title :db-title} (page-ref-plan db (:title block) planned-pages now)]
        (recur more
               planned-pages'
               (conj blocks' (assoc block
                                     :db-title db-title
                                     :content-ref-uuids (set (map :block/uuid refs))
                                     :tag-ref-uuids (set (map :block/uuid tag-refs))))
               (into page-txs new-page-txs))))))

(defn- page-root-blocks
  [page]
  (sort-by :block/order (:block/_parent page)))

(defn- page-blocks-by-uuid
  [db page]
  (->> (mapcat #(ldb/get-block-and-children db (:block/uuid %))
               (page-root-blocks page))
       (filter :block/uuid)
       (map (juxt :block/uuid identity))
       (into {})))

(defn- duplicate-marker?
  [blocks]
  (let [markers (keep :uuid blocks)]
    (not= (count markers) (count (set markers)))))

(defn- parsed-existing-markers-valid?
  [blocks page-block-by-uuid]
  (every? #(contains? page-block-by-uuid %) (keep :uuid blocks)))

(defn- parsed-parent-valid?
  [{:keys [parent-ref]} page-block-by-uuid new-uuid-by-index]
  (or (nil? parent-ref)
      (contains? page-block-by-uuid parent-ref)
      (contains? new-uuid-by-index parent-ref)))

(defn- new-block-tx
  [page-id block page-block-by-uuid new-uuid-by-index now]
  (let [block-uuid (or (:uuid block)
                       (get new-uuid-by-index (:idx block)))
        parent-id (if-let [parent-ref (:parent-ref block)]
                    (if-let [parent (:db/id (get page-block-by-uuid parent-ref))]
                      parent
                      [:block/uuid (get new-uuid-by-index parent-ref)])
                    page-id)]
    {:block/uuid block-uuid
     :block/title (or (:db-title block) (:title block))
     :block/page page-id
     :block/parent parent-id
     :block/order (db-order/gen-key)
     :block/created-at now
     :block/updated-at now}))

(defn- top-level-delete-uuids
  [db delete-uuids]
  (let [delete-set (set delete-uuids)]
    (->> delete-uuids
         (remove (fn [block-uuid]
                   (some (fn [ancestor]
                           (and (not= block-uuid (:block/uuid ancestor))
                                (contains? delete-set (:block/uuid ancestor))))
                         (ldb/get-block-parents db block-uuid {:depth 100}))))
         vec)))

(defn- update-existing-block-tx
  [block parsed-block now]
  (let [title (or (:db-title parsed-block) (:title parsed-block))]
    (when (not= (:block/title block) title)
      {:db/id (:db/id block)
       :block/title title
       :block/updated-at now})))

(defn- title-content-ref-uuids
  [title]
  (if (string? title)
    (set (db-content/get-matched-ids title))
    #{}))

(defn- title-ref-uuids
  [db title]
  (->> (content-ref-targets title)
       (keep (fn [{:keys [title]}]
               (:block/uuid (ldb/get-page db title))))
       set))

(defn- title-tag-ref-uuids
  [db title]
  (->> (content-ref-targets title)
       (keep (fn [{:keys [title tag?]}]
               (when tag?
                 (:block/uuid (ldb/get-page db title)))))
       set))

(defn- content-ref-add-txs
  [block-ref block]
  (map (fn [ref-uuid]
         [:db/add block-ref :block/refs [:block/uuid ref-uuid]])
       (:content-ref-uuids block)))

(defn- tag-ref-add-txs
  [block-ref block]
  (map (fn [tag-uuid]
         [:db/add block-ref :block/tags [:block/uuid tag-uuid]])
       (:tag-ref-uuids block)))

(defn- existing-block-content-ref-txs
  [db block parsed-block]
  (let [old-ref-uuids (set (concat (title-content-ref-uuids (:block/title block))
                                   (title-ref-uuids db (:block/title block))))
        new-ref-uuids (:content-ref-uuids parsed-block)
        block-id (:db/id block)]
    (concat
     (map (fn [ref-uuid]
            [:db/retract block-id :block/refs [:block/uuid ref-uuid]])
          (remove new-ref-uuids old-ref-uuids))
     (map (fn [ref-uuid]
            [:db/add block-id :block/refs [:block/uuid ref-uuid]])
          (remove old-ref-uuids new-ref-uuids)))))

(defn- existing-block-tag-ref-txs
  [db block parsed-block]
  (let [old-content-ref-uuids (set (concat (title-content-ref-uuids (:block/title block))
                                           (title-tag-ref-uuids db (:block/title block))))
        old-tag-uuids (->> (:block/tags block)
                           (keep (fn [tag]
                                   (let [tag-uuid (:block/uuid tag)]
                                     (when (contains? old-content-ref-uuids tag-uuid)
                                       tag-uuid))))
                           set)
        new-tag-uuids (:tag-ref-uuids parsed-block)
        block-id (:db/id block)]
    (concat
     (map (fn [tag-uuid]
            [:db/retract block-id :block/tags [:block/uuid tag-uuid]])
          (remove new-tag-uuids old-tag-uuids))
     (map (fn [tag-uuid]
            [:db/add block-id :block/tags [:block/uuid tag-uuid]])
          (remove old-tag-uuids new-tag-uuids)))))

(defn- import-tx-meta
  [relative-path outliner-ops]
  {:outliner-op :markdown-mirror/import-page
   :markdown-mirror/source :file
   :markdown-mirror/path relative-path
   :outliner-ops (vec outliner-ops)})

(defn- transact-import!
  [conn tx-data relative-path outliner-ops]
  (when (seq tx-data)
    (ldb/transact! conn tx-data (import-tx-meta relative-path outliner-ops))))

(defn- materialize-markers-content
  [db page]
  (let [block-lines
        (letfn [(render-block [block level]
                  (let [indent (apply str (repeat (dec level) "  "))
                        children (sort-by :block/order (:block/_parent block))]
                    (concat [(str "<!-- logseq:block " (:block/uuid block) " -->")
                             (str indent "- " (:block/title block))]
                            (mapcat #(render-block % (inc level)) children))))]
          (mapcat #(render-block % 1) (page-root-blocks page)))]
    (string/join "\n"
                 (cons (str "<!-- logseq:page " (:block/uuid page) " -->")
                       block-lines))))

(defn- block-marker-lines
  [db page]
  (->> (mapcat #(ldb/get-block-and-children db (:block/uuid %))
               (page-root-blocks page))
       (map (fn [block] {:uuid (:block/uuid block)}))))

(defn- add-markers-to-rendered-content
  [db page content]
  (let [markers (block-marker-lines db page)]
    (loop [[line & more] (string/split-lines (or content ""))
           [marker & more-markers] markers
           lines [(str "<!-- logseq:page " (:block/uuid page) " -->")]]
      (if (nil? line)
        (string/join "\n" lines)
        (if (re-matches markdown-block-re line)
          (recur more
                 more-markers
                 (cond-> lines
                   marker
                   (conj (str "<!-- logseq:block " (:uuid marker) " -->"))
                   true
                   (conj line)))
          (recur more
                 (cons marker more-markers)
                 (conj lines line)))))))

(defn- <materialize-markers!
  [repo db page {:keys [platform] :as _opts}]
  (when platform
    (when-let [relative-path (page-relative-path db page)]
      (<write-if-changed! platform
                          repo
                          (mirror-path repo relative-path)
                          (materialize-markers-content db page)))))

(defn- import-new-file!
  [repo conn relative-path _content parsed opts]
  (let [db @conn
        page-plan (relative-path->new-page relative-path)]
    (cond
      (nil? page-plan)
      (p/resolved {:status :error
                   :reason :unsupported-path})

      (:page-uuid parsed)
      (p/resolved {:status :error
                   :reason :new-file-has-page-marker})

      (seq (keep :uuid (:blocks parsed)))
      (p/resolved {:status :error
                   :reason :new-file-has-block-marker})

      (existing-page-for-path db relative-path nil)
      (p/resolved {:status :error
                   :reason :page-already-exists})

      :else
      (let [now (common-util/time-ms)
            {parsed-blocks :blocks
             ref-page-txs :page-txs} (with-content-ref-plans db (:blocks parsed) now)
            page-uuid (:uuid page-plan)
            page-tx (cond-> {:block/title (:title page-plan)
                             :block/name (common-util/page-name-sanity-lc (:title page-plan))
                             :block/uuid page-uuid
                             :block/tags :logseq.class/Page
                             :block/created-at now
                             :block/updated-at now}
                      (= :journal (:type page-plan))
                      (assoc :block/journal-day (:journal-day page-plan)
                             :block/tags :logseq.class/Journal))
            new-uuid-by-index (->> parsed-blocks
                                   (map-indexed (fn [idx _] [idx (random-uuid)]))
                                   (into {}))
            block-txs (map-indexed
                       (fn [_idx block]
                         (new-block-tx [:block/uuid page-uuid] block {} new-uuid-by-index now))
                       parsed-blocks)
            block-ref-txs (mapcat (fn [block]
                                    (content-ref-add-txs
                                     [:block/uuid (get new-uuid-by-index (:idx block))]
                                     block))
                                  parsed-blocks)
            block-tag-txs (mapcat (fn [block]
                                     (tag-ref-add-txs
                                      [:block/uuid (get new-uuid-by-index (:idx block))]
                                      block))
                                   parsed-blocks)
            tx-data (vec (concat [page-tx] ref-page-txs block-txs block-ref-txs block-tag-txs))
            page-options (cond-> {:redirect? false
                                  :uuid page-uuid}
                           (= :journal (:type page-plan))
                           (assoc :journal? true
                                  :journal-day (:journal-day page-plan)))
            outliner-ops [[:create-page [(:title page-plan) page-options]]
                          [:insert-blocks [(vec block-txs) page-uuid {:sibling? false}]]]]
        (transact-import! conn tx-data relative-path outliner-ops)
        (p/let [_ (<materialize-markers! repo @conn (d/entity @conn [:block/uuid page-uuid]) opts)]
          {:status :imported
           :reason :new-file
           :page-uuid page-uuid})))))

(defn- import-existing-file!
  [repo conn relative-path parsed page opts]
  (let [db @conn
        page-block-by-uuid (page-blocks-by-uuid db page)]
    (cond
      (not= (:block/uuid page) (:page-uuid parsed))
      (p/resolved {:status :error
                   :reason :page-marker-mismatch})

      (duplicate-marker? (:blocks parsed))
      (p/resolved {:status :error
                   :reason :duplicate-block-marker})

      (not (parsed-existing-markers-valid? (:blocks parsed) page-block-by-uuid))
      (p/resolved {:status :error
                   :reason :block-marker-outside-page})

      :else
      (let [new-uuids (->> (:blocks parsed)
                           (keep-indexed (fn [idx block]
                                           (when (nil? (:uuid block))
                                             [idx (random-uuid)])))
                           (into {}))
            now (common-util/time-ms)
            {parsed-blocks :blocks
             ref-page-txs :page-txs} (with-content-ref-plans db (:blocks parsed) now)]
        (if-not (every? #(parsed-parent-valid? % page-block-by-uuid new-uuids)
                        parsed-blocks)
          (p/resolved {:status :error
                       :reason :unresolved-parent})
          (let [seen-markers (set (keep :uuid parsed-blocks))
                existing-uuids (set (keys page-block-by-uuid))
                delete-uuids (top-level-delete-uuids db (remove seen-markers existing-uuids))
                save-txs (keep (fn [block]
                                 (when-let [uuid (:uuid block)]
                                   (update-existing-block-tx (get page-block-by-uuid uuid) block now)))
                               parsed-blocks)
                save-ref-txs (mapcat (fn [block]
                                        (when-let [uuid (:uuid block)]
                                          (existing-block-content-ref-txs
                                           db
                                           (get page-block-by-uuid uuid)
                                           block)))
                                      parsed-blocks)
                save-tag-txs (mapcat (fn [block]
                                        (when-let [uuid (:uuid block)]
                                          (existing-block-tag-ref-txs
                                           db
                                           (get page-block-by-uuid uuid)
                                           block)))
                                      parsed-blocks)
                new-blocks (keep-indexed (fn [idx block]
                                           (when (nil? (:uuid block))
                                             (new-block-tx (:db/id page)
                                                           block
                                                           page-block-by-uuid
                                                           new-uuids
                                                           now)))
                                         parsed-blocks)
                new-block-ref-txs (mapcat (fn [block]
                                             (when (nil? (:uuid block))
                                               (content-ref-add-txs
                                                [:block/uuid (get new-uuids (:idx block))]
                                                block)))
                                           parsed-blocks)
                new-block-tag-txs (mapcat (fn [block]
                                             (when (nil? (:uuid block))
                                               (tag-ref-add-txs
                                                [:block/uuid (get new-uuids (:idx block))]
                                                block)))
                                           parsed-blocks)
                delete-txs (mapcat (fn [block-uuid]
                                     [[:db/retractEntity (:db/id (get page-block-by-uuid block-uuid))]])
                                   delete-uuids)
                tx-data (vec (concat ref-page-txs
                                     save-txs
                                     save-ref-txs
                                     save-tag-txs
                                     new-blocks
                                     new-block-ref-txs
                                     new-block-tag-txs
                                     delete-txs))
                outliner-ops (cond-> []
                               (seq save-txs)
                               (conj [:save-block [(first save-txs) {}]])
                               (seq new-blocks)
                               (conj [:insert-blocks [(vec new-blocks) (:block/uuid page) {:sibling? false}]])
                               (seq delete-uuids)
                               (conj [:delete-blocks [(vec delete-uuids) {}]]))]
            (if (seq tx-data)
              (do
                (transact-import! conn tx-data relative-path outliner-ops)
                (p/let [_ (when (or (seq new-blocks) (seq delete-uuids))
                            (<materialize-markers! repo @conn (d/entity @conn (:db/id page)) opts))]
                  {:status :imported
                   :count (count tx-data)}))
              (p/resolved {:status :skipped
                           :reason :no-db-changes}))))))))

(defn <import-file-content!
  [repo conn relative-path content {:keys [platform] :as opts}]
  (let [parsed (parse-mirror-content content)
        page (existing-page-for-path @conn relative-path (:page-uuid parsed))]
    (if (:error parsed)
      (p/resolved {:status :error
                   :reason (:error parsed)})
      (if (and platform (not (supported-runtime? platform)))
        (p/resolved {:status :skipped
                     :reason :unsupported-runtime})
        (if page
          (import-existing-file! repo conn relative-path parsed page opts)
          (import-new-file! repo conn relative-path content parsed opts))))))

(defn <handle-file-event!
  [repo conn {:keys [type relative-path content]} {:keys [platform] :as opts}]
  (case type
    :deleted
    (p/resolved {:status :skipped
                 :reason :ignored-delete-event})

    :moved
    (p/resolved {:status :skipped
                 :reason :ignored-move-event})

    :changed
    (p/let [content* (if (some? content)
                       content
                       (when platform
                         (<read-text platform (mirror-path repo relative-path))))]
      (if (some? content*)
        (<import-file-content! repo conn relative-path content* opts)
        {:status :skipped
         :reason :missing-file-content}))

    (p/resolved {:status :skipped
                 :reason :ignored-file-event})))

(defn stop-file-watcher!
  [repo]
  (when-let [watcher (get @*repo->file-watchers repo)]
    (when (.-close watcher)
      (.close watcher)))
  (swap! *repo->file-watchers dissoc repo)
  (swap! *repo->recent-writes dissoc repo)
  nil)

(defn- chokidar-watch!
  [watch-path opts]
  (let [chokidar (js/require "chokidar")]
    (.watch chokidar watch-path (clj->js opts))))

(defn- register-watch-handler!
  [watcher event handler]
  (.on ^js watcher event handler)
  watcher)

(defn <start-file-watcher!
  [repo conn {:keys [platform ignored-recent-write-ms] :as opts}]
  (let [platform* (or platform (platform/current))]
    (cond
      (not (supported-runtime? platform*))
      (p/resolved {:status :skipped
                   :reason :unsupported-runtime})

      (nil? conn)
      (p/resolved {:status :skipped
                   :reason :missing-conn})

      :else
      (let [watch-root (watch-root-path platform* repo)
            watch! (or (:chokidar-watch! opts) chokidar-watch!)
            watcher (watch! watch-root {:ignore-initial true
                                        :await-write-finish {:stability-threshold 200
                                                             :poll-interval 50}})]
        (stop-file-watcher! repo)
        (swap! *repo->file-watchers assoc repo watcher)
        (letfn [(handle-result [relative-path event promise]
                  (-> promise
                      (p/catch (fn [error]
                                 (log/error :markdown-mirror/import-file-event-failed
                                            {:repo repo
                                             :relative-path relative-path
                                             :event event
                                             :error error})))))
                (handle-path! [event path]
                  (when-let [relative-path (watcher-event-relative-path repo watch-root path)]
                    (let [storage-path (mirror-path repo relative-path)
                          ttl-ms (or ignored-recent-write-ms 1000)]
                      (if (= :changed event)
                        (handle-result
                         relative-path
                         event
                         (p/let [content (<read-text platform* storage-path)]
                           (if (= content (recent-written-content repo storage-path ttl-ms))
                             {:status :skipped
                              :reason :ignored-self-write}
                             (<handle-file-event! repo conn {:type event
                                                             :relative-path relative-path
                                                             :content content}
                                                  {:platform platform*}))))
                        (handle-result
                         relative-path
                         event
                         (<handle-file-event! repo conn {:type event
                                                         :relative-path relative-path}
                                              {:platform platform*}))))))]
          (register-watch-handler! watcher "add" #(handle-path! :changed %))
          (register-watch-handler! watcher "change" #(handle-path! :changed %))
          (register-watch-handler! watcher "unlink" #(handle-path! :deleted %))
          (register-watch-handler! watcher "unlinkDir" #(handle-path! :deleted %))
          (register-watch-handler! watcher "error"
                                   #(log/error :markdown-mirror/watch-error
                                               {:repo repo
                                                :error %})))
        (p/resolved {:status :watching
                     :path watch-root})))))

(defn- page-id-for-entity
  [db eid]
  (when-let [entity (d/entity db eid)]
    (cond
      (ldb/page? entity) (:db/id entity)
      (:block/page entity) (:db/id (:block/page entity))
      (and (:block/parent entity) (ldb/page? (:block/parent entity))) (:db/id (:block/parent entity))
      (some-> entity :block/parent :block/page) (:db/id (:block/page (:block/parent entity))))))

(defn affected-page-ids
  [{:keys [db-before db-after tx-data]}]
  (->> tx-data
       (mapcat (fn [{:keys [e a v]}]
                 (cond-> [(page-id-for-entity db-before e)
                          (page-id-for-entity db-after e)]
                   (= a :block/page)
                   (conj v))))
       (remove nil?)
       set))

(defn set-enabled!
  [repo enabled?]
  (if enabled?
    (swap! *repo->enabled? assoc repo true)
    (do
      (when-let [timeout-id (get @*repo->flush-timeout repo)]
        (js/clearTimeout timeout-id))
      (swap! *repo->enabled? dissoc repo)
      (swap! *repo->queued-page-jobs dissoc repo)
      (swap! *repo->flush-timeout dissoc repo)))
  nil)

(defn enabled?
  [repo]
  (true? (get @*repo->enabled? repo)))

(defn- storage
  [platform*]
  (:storage platform*))

(defn- <read-text
  [platform* path]
  (if-let [f (or (:mirror-read-text! (storage platform*))
                 (:read-text! (storage platform*)))]
    (-> (f path)
        (p/catch (constantly nil)))
    (p/rejected (ex-info "platform storage/read-text! missing" {:path path}))))

(defn- <write-text-atomic!
  [platform* path content]
  (if-let [f (:write-text-atomic! (storage platform*))]
    (f path content)
    (p/rejected (ex-info "platform storage/write-text-atomic! missing" {:path path}))))

(defn- <delete-file!
  [platform* path]
  (if-let [f (:delete-file! (storage platform*))]
    (f path)
    (p/rejected (ex-info "platform storage/delete-file! missing" {:path path}))))

(defn- supported-runtime?
  [platform*]
  (or (= :node (get-in platform* [:env :runtime]))
      (= :electron (get-in platform* [:env :owner-source]))))

(defn- duplicate-journal-day?
  [db journal-day]
  (when journal-day
    (< 1 (count (d/datoms db :avet :block/journal-day journal-day)))))

(defn- render-page-content
  [db page options]
  (add-markers-to-rendered-content
   db
   page
   (common-file/block->content
    db
    (:block/uuid page)
    {:include-page-properties? true}
    {:export-bullet-indentation (or (:export-bullet-indentation options) "  ")
     :date-formatter (:date-formatter options)})))

(defn- mirrorable-page?
  [page]
  (and (ldb/page? page)
       (not (ldb/built-in? page))
       (not (ldb/property? page))
       (not (ldb/hidden? page))
       (not (:logseq.property.user/email page))))

(defn- mirrorable-pages
  [db]
  (->> (d/datoms db :avet :block/name)
       (map #(d/entity db (:e %)))
       (filter mirrorable-page?)
       (sort-by (fn [page]
                  [(if (ldb/journal? page) 0 1)
                   (str (:block/journal-day page))
                   (string/lower-case (or (:block/title page) ""))
                   (str (:block/uuid page))]))))

(defn- <write-if-changed!
  [platform* repo path content]
  (p/let [current (<read-text platform* path)]
    (if (= current content)
      {:status :skipped
       :reason :unchanged
       :path path}
      (p/let [_ (<write-text-atomic! platform* path content)
              _ (mark-recent-write! repo path content)]
        {:status :written
         :path path}))))

(defn- invalid-file-name-result
  [repo page]
  (let [result {:status :error
                :reason :invalid-file-name
                :repo repo
                :page-uuid (:block/uuid page)}]
    (log/error :markdown-mirror/invalid-file-name result)
    result))

(defn <mirror-page!
  [repo db page-id {:keys [platform] :as opts}]
  (let [platform* (or platform (platform/current))]
    (if-not (supported-runtime? platform*)
      (p/resolved {:status :skipped
                   :reason :unsupported-runtime})
      (if-let [page (d/entity db page-id)]
        (cond
          (not (mirrorable-page? page))
          (p/resolved {:status :skipped
                       :reason :excluded-page
                       :repo repo
                       :page-id page-id})

          (and (ldb/journal? page)
               (duplicate-journal-day? db (:block/journal-day page)))
          (let [result {:status :error
                        :reason :duplicate-journal-day
                        :repo repo
                        :journal-day (:block/journal-day page)
                        :page-uuid (:block/uuid page)}]
            (log/error :markdown-mirror/duplicate-journal-day result)
            (p/resolved result))

          :else
          (if-let [relative-path (page-relative-path db page opts)]
            (let [path (mirror-path repo relative-path)
                  content (render-page-content db page opts)]
              (<write-if-changed! platform* repo path content))
            (p/resolved (invalid-file-name-result repo page))))
        (p/resolved {:status :skipped
                     :reason :missing-page
                     :repo repo
                     :page-id page-id})))))

(defn- deleted-page?
  [page]
  (or (nil? page)
      (not (mirrorable-page? page))))

(defn- page-job
  [repo {:keys [db-before db-after]} page-id opts]
  (let [before-page (d/entity db-before page-id)
        after-page (d/entity db-after page-id)
        old-relative-path (when before-page (page-relative-path db-before before-page opts))
        new-relative-path (when after-page (page-relative-path db-after after-page opts))]
    {:repo repo
     :page-id page-id
     :db db-after
     :old-path (when old-relative-path (mirror-path repo old-relative-path))
     :new-path (when new-relative-path (mirror-path repo new-relative-path))
     :delete? (deleted-page? after-page)}))

(defn- merge-job
  [old-job new-job]
  (assoc new-job :old-path (or (:old-path old-job)
                               (:old-path new-job))))

(defn- queue-job!
  [repo job]
  (swap! *repo->queued-page-jobs update-in [repo (:page-id job)] merge-job job))

(defn- drain-repo-jobs!
  [repo]
  (let [jobs (vals (get @*repo->queued-page-jobs repo))]
    (swap! *repo->queued-page-jobs dissoc repo)
    jobs))

(declare <flush-repo!)

(defn- schedule-flush!
  [repo opts]
  (when-not (get @*repo->flush-timeout repo)
    (let [timeout-id (js/setTimeout
                      (fn []
                        (swap! *repo->flush-timeout dissoc repo)
                        (-> (<flush-repo! repo opts)
                            (p/catch (fn [error]
                                       (log/error :markdown-mirror/flush-failed
                                                  {:repo repo
                                                   :error error})))))
                      (or (:debounce-ms opts) 1000))]
      (swap! *repo->flush-timeout assoc repo timeout-id))))

(defn- <run-job!
  [platform* {:keys [repo db page-id old-path new-path delete?] :as _job} opts]
  (cond
    delete?
    (if old-path
      (p/let [_ (<delete-file! platform* old-path)]
        {:status :deleted
         :path old-path})
      (p/resolved {:status :skipped
                   :reason :missing-old-path}))

    :else
    (p/let [result (<mirror-page! repo db page-id (assoc opts :platform platform*))
            _ (when (and old-path
                         new-path
                         (not= old-path new-path)
                         (or (= :written (:status result))
                             (and (= :skipped (:status result))
                                  (= :unchanged (:reason result)))))
                (<delete-file! platform* old-path))]
      result)))

(defn <handle-tx-report!
  [repo _conn tx-report {:keys [platform defer?] :as opts}]
  (let [platform* (or platform (platform/current))]
    (if (and (enabled? repo)
             (supported-runtime? platform*)
             (not (get-in tx-report [:tx-meta :from-disk?])))
      (let [jobs (map #(page-job repo tx-report % opts)
                      (affected-page-ids tx-report))]
        (if defer?
          (do
            (doseq [job jobs] (queue-job! repo job))
            (schedule-flush! repo (assoc opts :platform platform*))
            (p/resolved {:status :queued
                         :count (count jobs)}))
          (p/all (map #(<run-job! platform* % opts) jobs))))
      (p/resolved {:status :skipped
                   :reason :disabled-or-unsupported}))))

(defn <flush-repo!
  [repo {:keys [platform] :as opts}]
  (let [platform* (or platform (platform/current))
        jobs (drain-repo-jobs! repo)]
    (p/all (map #(<run-job! platform* % opts) jobs))))

(defn <mirror-repo!
  [repo db {:keys [platform] :as opts}]
  (let [platform* (or platform (platform/current))]
    (if-not (supported-runtime? platform*)
      (p/resolved {:status :skipped
                   :reason :unsupported-runtime})
      (p/let [results (p/all
                       (map #(<mirror-page! repo db (:db/id %) (assoc opts :platform platform*))
                            (mirrorable-pages db)))]
        {:status :completed
         :count (count results)
         :results results}))))
