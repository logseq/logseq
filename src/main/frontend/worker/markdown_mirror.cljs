(ns frontend.worker.markdown-mirror
  "Markdown mirror derived-file support for DB graphs."
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.graph-dir :as graph-dir]
            [frontend.worker.platform :as platform]
            [lambdaisland.glogi :as log]
            [logseq.cli.common.file :as common-file]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
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
(def ^:private markdown-block-line-re #"^(\s*)-\s?(.*)$")
(def ^:private markdown-property-line-re #"^(\s*)\*\s+[^:\s][^:]*::\s?.*$")
(def ^:private property-line-re #"^(\s*)[^:\s][^:]*::\s?.*$")
(def ^:private ref-or-tag-re #"(#?)\[\[([^\[\]]+)\]\]")
(def ^:private simple-hashtag-re #"(?i)(^|\s)#([^\s#\[\]\(\),.;:'\"`]+)")

(defonce ^:private *repo->enabled? (atom {}))
(defonce ^:private *repo->queued-page-jobs (atom {}))
(defonce ^:private *repo->flush-timeout (atom {}))

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

(defn- non-journal-page?
  [page]
  (and (ldb/page? page)
       (not (ldb/journal? page))))

(defn- pages-with-file-stem
  [db stem]
  (->> (d/datoms db :avet :block/name)
       (map #(d/entity db (:e %)))
       (filter #(and (non-journal-page? %)
                     (= stem (normalize-file-stem (:block/title %)))))
       (sort-by (comp str :block/uuid))))

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
         (let [duplicate-pages (pages-with-file-stem db stem)
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

(defn- not-found-error?
  [error]
  (let [data (ex-data error)
        code (or (:code data) (some-> error .-code))
        name (some-> error .-name)
        message (some-> error .-message)]
    (or (contains? #{:not-found :enoent "ENOENT" "NotFoundError"} code)
        (= "NotFoundError" name)
        (boolean (some-> message (string/starts-with? "ENOENT:"))))))

(defn- <read-text
  [platform* path]
  (if-let [f (or (:mirror-read-text! (storage platform*))
                 (:read-text! (storage platform*)))]
    (-> (f path)
        (p/catch (fn [error]
                   (if (not-found-error? error)
                     nil
                     (p/rejected error)))))
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

(defn- leading-space-count
  [line]
  (count (or (second (re-matches #"^(\s*).*$" line)) "")))

(defn- property-line-indent
  [line]
  (or (some-> (re-matches markdown-property-line-re line) second count)
      (some-> (re-matches property-line-re line) second count)))

(defn- property-value-line?
  [line property-indent]
  (and (some? property-indent)
       (not (string/blank? line))
       (< property-indent (leading-space-count line))))

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

(defn- status-marker
  [status]
  (when-let [content (some-> (cond
                               (keyword? status) (name status)
                               :else (or (db-property/closed-value-content status)
                                         (:block/title status)
                                         (:logseq.property/value status)))
                             str
                             string/trim)]
    (when-not (string/blank? content)
      (-> content
          string/upper-case
          (string/replace #"\s+" "-")))))

(defn- simple-tag-token?
  [title]
  (boolean
   (re-matches #"[^\s#\[\]\(\),.;:'\"`]+" (or title ""))))

(defn- tag-token
  [tag]
  (let [title (or (:block/title tag) (:block/name tag))]
    (when-not (string/blank? title)
      (if (simple-tag-token? title)
        (str "#" title)
        (str "#[[" title "]]")))))

(defn- built-in-tag?
  [tag]
  (or (ldb/built-in? tag)
      (some-> tag :db/ident namespace (= "logseq.class"))))

(defn- mirror-tag-tokens
  [block]
  (->> (:block/tags block)
       (remove built-in-tag?)
       (keep tag-token)
       sort
       vec))

(defn- id-property-line
  [block-uuid]
  (str "id:: " block-uuid))

(defn- content-has-status-marker?
  [content marker]
  (or (= content marker)
      (string/starts-with? content (str marker " "))))

(defn- content-tag-titles
  [content]
  (->> (content-ref-targets content)
       (keep (fn [{:keys [title tag?]}]
               (when tag? (string/lower-case title))))
       set))

(defn- token-title
  [token]
  (if (string/starts-with? token "#[[")
    (subs token 3 (- (count token) 2))
    (subs token 1)))

(defn- decorate-block-content
  [{:keys [tag-tokens] :as block-info} content]
  (let [content (or content "")
        status-marker' (:status-marker block-info)
        content (if (and status-marker'
                         (not (content-has-status-marker? content status-marker')))
                  (if (string/blank? content)
                    status-marker'
                    (str status-marker' " " content))
                  content)
        existing-tag-titles (content-tag-titles content)
        tag-tokens' (remove (fn [token]
                              (contains? existing-tag-titles
                                         (string/lower-case (token-title token))))
                            tag-tokens)]
    (if (seq tag-tokens')
      (str content " " (string/join " " tag-tokens'))
      content)))

(declare decorate-rendered-content)

(defn- order-list-number?
  [block]
  (let [v (:logseq.property/order-list-type block)
        content (cond
                  (string? v) v
                  (keyword? v) (name v)
                  :else (db-property/property-value-content v))]
    (= "number" (some-> content string/lower-case))))

(defn- embed-target
  [block]
  (let [target (:block/link block)]
    (when (and (:block/uuid target)
               (not (ldb/page? target)))
      target)))

(defn- block-id-comment
  [db-id]
  (str "<!-- id: " db-id " -->"))

(defn- append-block-id-comment
  [content db-id]
  (let [comment-text (block-id-comment db-id)]
    (if (string/blank? content)
      comment-text
      (str content " " comment-text))))

(defn- code-block?
  [block]
  (or (= :code (:logseq.property.node/display-type block))
      (some #(= :logseq.class/Code-block (:db/ident %))
            (:block/tags block))))

(defn- block-line-info
  [db block marker]
  {:db/id (:db/id block)
   :code-block? (code-block? block)
   :status-marker (when (seq (d/datoms db :eavt (:db/id block) :logseq.property/status))
                    (some-> (:logseq.property/status block) status-marker))
   :tag-tokens (mirror-tag-tokens block)
   :marker marker
   :embed-target (embed-target block)})

(defn- property-derived-block?
  [block]
  (or (:logseq.property/created-from-property block)
      (:block/closed-value-property block)))

(defn- outline-children
  [block]
  (->> (:block/_parent block)
       (remove property-derived-block?)
       (sort-by :block/order)))

(defn- page-root-blocks
  [page]
  (outline-children page))

(defn- block-line-infos
  [db blocks]
  (loop [[block & more] blocks
         number 1
         result []]
    (if-not block
      result
      (let [ordered? (order-list-number? block)
            marker (if ordered? (str number ".") "-")
            result' (-> result
                        (conj (block-line-info db block marker))
                        (into (block-line-infos db (outline-children block))))]
        (recur more
               (cond-> number ordered? inc)
               result')))))

(defn- rendered-block-line-infos
  [db page]
  (block-line-infos db (page-root-blocks page)))

(defn- block->content-context
  [options]
  {:export-bullet-indentation (or (:export-bullet-indentation options) "  ")
   :excluded-properties #{:logseq.property/status}
   :export-properties-as-list-items? true
   :export-node-property-values-as-page-refs? true
   :export-default-property-values-as-blocks? true
   :preserve-block-refs? true
   :date-formatter (:date-formatter options)})

(defn- block-content
  [db block-uuid tree-opts options]
  (common-file/block->content db block-uuid tree-opts (block->content-context options)))

(defn- line-level
  [spaces options]
  (let [indent-width (max 1 (count (or (:export-bullet-indentation options) "  ")))]
    (inc (quot (count spaces) indent-width))))

(defn- decorate-block-line
  [db block-info line options]
  (if-let [[_ spaces title] (re-matches markdown-block-line-re line)]
    (if-let [target (:embed-target block-info)]
      (string/split-lines
       (decorate-rendered-content
        db
        (block-content db (:block/uuid target) {:init-level (line-level spaces options)} options)
        (block-line-infos db [target])
        options
        {:initial-lines []}))
      (let [content (decorate-block-content block-info title)
            content (cond-> content
                      (not (:code-block? block-info))
                      (append-block-id-comment (:db/id block-info)))
            marker (or (:marker block-info) "-")]
        [(str spaces marker
              (when-not (string/blank? content) " ")
              content)]))
    [line]))

(defn- decorate-rendered-content
  [db content line-infos options {:keys [initial-lines insert-blank-before-first-block?]}]
  (let [initial-lines (or initial-lines [])]
    (loop [[line & more] (string/split-lines (or content ""))
           [block-line-info' & more-block-line-infos] line-infos
           lines initial-lines
           seen-block? false
           property-indent nil]
      (if (nil? line)
        (string/join "\n" lines)
        (if (property-value-line? line property-indent)
          (recur more
                 (cons block-line-info' more-block-line-infos)
                 (conj lines line)
                 seen-block?
                 property-indent)
          (if (re-matches markdown-block-line-re line)
            (let [lines' (cond-> lines
                           (and insert-blank-before-first-block?
                                (not seen-block?)) (conj "")
                           true (into (decorate-block-line db block-line-info' line options)))]
              (recur more
                     more-block-line-infos
                     lines'
                     true
                     nil))
            (let [property-indent' (property-line-indent line)]
              (recur more
                     (cons block-line-info' more-block-line-infos)
                     (conj lines line)
                     seen-block?
                     property-indent'))))))))

(defn- add-page-id-to-rendered-content
  [db page content options]
  (decorate-rendered-content
   db
   content
   (rendered-block-line-infos db page)
   options
   {:initial-lines [(id-property-line (:block/uuid page))]
    :insert-blank-before-first-block? true}))

(defn- render-page-content
  [db page options]
  (add-page-id-to-rendered-content
   db
   page
   (block-content db (:block/uuid page) {:include-page-properties? true} options)
   options))

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
  [platform* path content]
  (p/let [current (<read-text platform* path)]
    (if (= current content)
      {:status :skipped
       :reason :unchanged
       :path path}
      (p/let [_ (<write-text-atomic! platform* path content)]
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
              (<write-if-changed! platform* path content))
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
