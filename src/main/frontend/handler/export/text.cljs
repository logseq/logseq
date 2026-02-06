(ns frontend.handler.export.text
  "export blocks/pages as text"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.extensions.zip :as zip]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.export.common :as common]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.cli.common.export.common :as cli-export-common]
            [logseq.cli.common.export.text :as cli-export-text]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.property :as outliner-property]
            [promesa.core :as p]
            [rum.core :as rum]))

;;; export fns

(declare replace-alias-uuid-refs replace-remaining-uuid-page-refs)

(def ^:private export-progress-uid :export-markdown-progress)
(def ^:private export-progress-yield-every 8)

(rum/defc export-progress-content
  [phase current total]
  (let [width (if (and total (pos? total))
                (js/Math.round (* 100 (/ current total)))
                0)
        phase-label (case phase
                      :prepare "Preparing export..."
                      :convert "Converting pages..."
                      :zip "Creating zip..."
                      "Exporting...")
        progress-label (if (and total (pos? total))
                         (str current "/" total)
                         "-/-")]
    [:div {:style {:min-width "320px"}}
     [:div.text-sm.font-medium.mb-2 phase-label]
     [:div.flex.justify-between.mb-1.text-xs.opacity-80
      [:span "Progress"]
      [:span progress-label]]
     [:div.w-full.rounded-full.h-2.5.bg-gray-06-alpha
      [:div.bg-gray-09-alpha.h-2.5.rounded-full {:style {:width (str width "%")
                                                          :transition "width 180ms ease"}}]]]))

(defn- show-export-progress!
  [phase current total]
  (notification/show! (export-progress-content phase current total)
                      :info
                      false
                      export-progress-uid))

(defn- clear-export-progress!
  []
  (notification/clear! export-progress-uid))

(defn- <yield-to-next-frame
  []
  (p/create
   (fn [resolve _reject]
     (util/schedule resolve))))

(defn- <maybe-yield-for-progress
  [current total]
  (when (or (<= total export-progress-yield-every)
            (= current total)
            (zero? (mod current export-progress-yield-every)))
    (<yield-to-next-frame)))

(defn export-blocks-as-markdown
  "options:
  :indent-style \"dashes\" | \"spaces\" | \"no-indent\"
  :remove-options [:emphasis :page-ref :tag :property]
  :other-options {:keep-only-level<=N int :newline-after-block bool :obsidian-mode? bool}"
  [repo root-block-uuids-or-page-uuid options]
  {:pre [(or (coll? root-block-uuids-or-page-uuid)
             (uuid? root-block-uuids-or-page-uuid))]}
  (try
      (let [obsidian-mode? (true? (get-in options [:other-options :obsidian-mode?]))
            content
            (cond
             ;; page
              (and (= 1 (count root-block-uuids-or-page-uuid))
                   (ldb/page? (db/entity [:block/uuid (first root-block-uuids-or-page-uuid)])))
              (common/get-page-content (first root-block-uuids-or-page-uuid)
                                       {:obsidian-mode? obsidian-mode?})
              (and (coll? root-block-uuids-or-page-uuid) (every? #(ldb/page? (db/entity [:block/uuid %])) root-block-uuids-or-page-uuid))
              (->> (mapv (fn [id] (:block/title (db/entity [:block/uuid id]))) root-block-uuids-or-page-uuid)
                   (string/join "\n"))
              :else
              (common/root-block-uuids->content repo root-block-uuids-or-page-uuid
                                                {:obsidian-mode? obsidian-mode?}))
            first-block (and (coll? root-block-uuids-or-page-uuid)
                             (db/entity [:block/uuid (first root-block-uuids-or-page-uuid)]))
            format (get first-block :block/format :markdown)
            db (conn/get-db repo)
            content' (cond-> content
                       obsidian-mode?
                       (->> (replace-alias-uuid-refs db)))]
        (binding [cli-export-common/*current-db* db
                  cli-export-common/*content-config* (common/get-content-config {:obsidian-mode? obsidian-mode?})]
          (cond-> (cli-export-text/export-helper content' format options)
            obsidian-mode?
            (->> (replace-remaining-uuid-page-refs db)))))
      (catch :default e
        (js/console.error e))))

(defn- fix-asset-paths
  "Rewrite Logseq assets paths to Obsidian Attachments folder."
  [content]
  (if (string? content)
    (-> content
        (string/replace #"\]\(\.\./assets/" "](../Attachments/")
        (string/replace #"\]\(\./assets/" "](../Attachments/")
        (string/replace #"\]\(assets/" "](../Attachments/")
        (string/replace #"\]\(/assets/" "](../Attachments/")
        (string/replace #"\[\[\.\./assets/" "[[../Attachments/")
        (string/replace #"\[\[\./assets/" "[[../Attachments/"))
    content))

(defn- normalize-markdown-content
  [v]
  (cond
    (string? v) v
    (nil? v) ""
    (sequential? v) (->> v
                         (map normalize-markdown-content)
                         (remove string/blank?)
                         (string/join "\n"))
    (map? v) (or (some-> (:content v) normalize-markdown-content)
                 (some-> (:block/title v) normalize-markdown-content)
                 "")
    (number? v) (str v)
    (boolean? v) (str v)
    :else ""))

(def ^:private uuid-page-ref-re
  #"\[\[([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]\]")

(def ^:private uuid-block-ref-re
  #"\(\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)\)")

(def ^:private alias-inline-block-ref-re
  #"\[([^\]]+)\]\(\(\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)\)\)")

(def ^:private alias-ref-style-block-ref-re
  #"\[([^\]]+)\]\[\(\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)\)\]")

(defn- asset->attachment-rel-path
  [asset]
  (when (ldb/asset? asset)
    (let [asset-uuid (:block/uuid asset)
          asset-type (some-> (:logseq.property.asset/type asset)
                             str
                             (string/replace #"^\." ""))]
      (when asset-uuid
        (str "../Attachments/" asset-uuid
             (when-not (string/blank? asset-type)
               (str "." asset-type)))))))

(defn- asset->embed-markdown
  [asset]
  (when-let [path (asset->attachment-rel-path asset)]
    (str "![](" path ")")))

(defn- asset->embed-markdown-with-alias
  [asset alias]
  (when-let [path (asset->attachment-rel-path asset)]
    (str "![" alias "](" path ")")))

(defn- uuid->obsidian-link
  [db' uuid-str]
  (when (common-util/uuid-string? uuid-str)
    (when-let [ent (d/entity db' [:block/uuid (uuid uuid-str)])]
      (cond
        (ldb/page? ent)
        (str "[[" (or (:block/title ent) uuid-str) "]]")
        (ldb/asset? ent)
        (asset->embed-markdown ent)
        :else
        (str "![["
             (or (get-in ent [:block/page :block/title]) "Unknown")
             "#^" uuid-str "]]")))))

(defn- uuid->obsidian-link-with-alias
  [db' uuid-str alias]
  (when (common-util/uuid-string? uuid-str)
    (when-let [ent (d/entity db' [:block/uuid (uuid uuid-str)])]
      (cond
        (ldb/page? ent)
        (str "[[" (or (:block/title ent) uuid-str) "|" alias "]]")
        (ldb/asset? ent)
        (asset->embed-markdown-with-alias ent alias)
        :else
        (str "![["
             (or (get-in ent [:block/page :block/title]) "Unknown")
             "#^" uuid-str "|" alias "]]")))))

(defn- replace-alias-uuid-refs
  "Pre-processing: convert aliased UUID refs that mldoc can't parse correctly.
  Must run before mldoc parsing since mldoc doesn't understand [alias](((uuid)))."
  [db' content]
  (if-not (string? content)
    content
    (-> content
        ;; [alias](((uuid))) -> [[Page#^uuid|alias]] / [[Page|alias]]
        (string/replace alias-inline-block-ref-re
                        (fn [[full alias uuid-str]]
                          (or (uuid->obsidian-link-with-alias db' uuid-str alias) full)))
        ;; [alias][((uuid))] -> [[Page#^uuid|alias]] / [[Page|alias]]
        (string/replace alias-ref-style-block-ref-re
                        (fn [[full alias uuid-str]]
                          (or (uuid->obsidian-link-with-alias db' uuid-str alias) full))))))

(defn- replace-remaining-uuid-page-refs
  "Post-processing: convert any remaining bare UUID refs after mldoc rendering."
  [db' content]
  (if-not (string? content)
    content
    (-> content
        ;; [[uuid]]
        (string/replace uuid-page-ref-re
                        (fn [[full uuid-str]]
                          (or (uuid->obsidian-link db' uuid-str) full)))
        ;; ((uuid))
        (string/replace uuid-block-ref-re
                        (fn [[full uuid-str]]
                          (or (uuid->obsidian-link db' uuid-str) full))))))

(defn- obsidian-property-value
  [v]
  (cond
    (de/entity? v)
    (let [title (:block/title v)]
      (cond
      ;; Keep absolute URLs as plain scalar strings in frontmatter.
      (and title (re-matches #"(?i)^[a-z][a-z0-9+.-]*://.+" title)) title
      title (str "[[" title "]]")
      (:db/ident v) (name (:db/ident v))
      (:block/uuid v) (str "[[" (:block/uuid v) "]]")
      :else (str v)))

    (set? v)
    (->> v
         (map obsidian-property-value)
         (remove string/blank?)
         sort
         (string/join ", "))

    (sequential? v)
    (->> v
         (map obsidian-property-value)
         (remove string/blank?)
         (string/join ", "))

    (keyword? v) (name v)
    (nil? v) ""
    :else (str v)))

(defn- yaml-value
  [v]
  (cond
    (number? v) (str v)
    (boolean? v) (str v)
    (nil? v) "null"
    :else
    (let [s (obsidian-property-value v)]
      (cond
        ;; Keep absolute URLs unquoted, e.g. url: https://example.com
        (re-matches #"(?i)^[a-z][a-z0-9+.-]*://.+" s)
        s

        (or (string/blank? s)
            (string/includes? s "[[")
            (string/includes? s ":")
            (string/includes? s "\"")
            (string/includes? s "\n")
            (string/starts-with? s "[")
            (string/starts-with? s "{")
            (string/includes? s ","))
        (str "\"" (string/replace s "\"" "\\\"") "\"")

        :else
        s))))

(defn- tag->obsidian-hashtag
  [tag]
  (when-let [title (:block/title tag)]
    (let [tag-title (-> title
                        string/trim
                        (string/replace #"\s+" "-"))]
      (when-not (string/blank? tag-title)
        (str "#" tag-title)))))

(defn- exportable-page-property?
  [k]
  (and (keyword? k)
       (not (contains? db-property/public-db-attribute-properties k))
       (not (contains? #{:logseq.property/created-from-property
                         :logseq.property/created-by-ref
                         :logseq.property.class/extends
                         :logseq.property/built-in?
                         :logseq.property/hide?
                         :logseq.property/publishing-public?
                         :logseq.property.publish/published-url}
                       k))
       (let [n (namespace k)]
         (not (contains? #{"logseq.property.asset"
                           "logseq.property.embedding"
                           "logseq.property.history"
                           "logseq.property.table"
                           "logseq.property.view"}
                         n)))))

(defn- empty-placeholder-property-value?
  [db v]
  (or (= :logseq.property/empty-placeholder v)
      (and (integer? v)
           (= :logseq.property/empty-placeholder (:db/ident (d/entity db v))))
      (and (de/entity? v)
           (= :logseq.property/empty-placeholder (:db/ident v)))
      (and (map? v)
           (= :logseq.property/empty-placeholder (:db/ident v)))))

(defn- normalize-frontmatter-value
  [db v]
  (cond
    (nil? v) nil
    (set? v) (let [v' (->> v
                           (remove #(empty-placeholder-property-value? db %))
                           vec)]
               (when (seq v') v'))
    (sequential? v) (let [v' (->> v
                                  (remove #(empty-placeholder-property-value? db %))
                                  vec)]
                      (when (seq v') v'))
    (empty-placeholder-property-value? db v) nil
    :else v))

(defn- property-key->literal
  [db k]
  (if-not (keyword? k)
    (str k)
    (if-let [prop-ent (d/entity db [:db/ident k])]
      (or (when (string? (:block/title prop-ent))
            (:block/title prop-ent))
          (name k))
      (name k))))

(defn- yaml-key
  [k]
  (let [s (str k)]
    (if (re-matches #"^[A-Za-z0-9_-]+$" s)
      s
      (str "\"" (string/replace s "\"" "\\\"") "\""))))

(defn- collect-page-properties
  [db page]
  (let [own-properties (db-property/properties page)
        class-property-idents
        (->> (:classes-properties (outliner-property/get-block-classes-properties db (:db/id page)))
             (map :db/ident)
             distinct)
        class-derived-properties
        (->> class-property-idents
             (keep (fn [ident]
                     (let [property (d/entity db ident)
                           explicit? (contains? own-properties ident)
                           value (if explicit?
                                   (get own-properties ident)
                                   (or (:logseq.property/scalar-default-value property)
                                       (:logseq.property/default-value property)))
                           value' (normalize-frontmatter-value db value)]
                       (when (some? value')
                         [ident value']))))
             (into {}))
        own-properties'
        (->> own-properties
             (keep (fn [[k v]]
                     (let [v' (normalize-frontmatter-value db v)]
                       (when (some? v')
                         [k v']))))
             (into {}))]
    ;; explicit properties should override class-derived defaults
    (merge class-derived-properties own-properties')))

(defn- build-page-frontmatter
  [db page-title]
  (when-let [page (ldb/get-page db page-title)]
    (let [lines (->> (collect-page-properties db page)
                     (filter (fn [[k _]] (exportable-page-property? k)))
                     (sort-by (fn [[k _]] (str k)))
                     (map (fn [[k v]]
                            (str (yaml-key (property-key->literal db k))
                                 ": " (yaml-value v))))
                     (remove #(string/ends-with? % ": \"\"")))]
      (when (seq lines)
        (str "---\n" (string/join "\n" lines) "\n---\n\n")))))

(defn- build-page-tag-header
  [db page-title]
  (when-let [page (ldb/get-page db page-title)]
    (let [hashtags (->> (:block/tags page)
                        (remove #(db-class/disallowed-inline-tags (:db/ident %)))
                        (keep tag->obsidian-hashtag)
                        distinct)]
      (when (seq hashtags)
        (str (string/join " " hashtags) "\n\n")))))

(defn- prepend-page-header-if-missing
  [content page-header]
  (let [content' (normalize-markdown-content content)]
    (if (and page-header
             (not (string/starts-with? content' "---\n")))
      (str page-header content')
      content')))

(defn- ensure-non-blank-content
  "Zip export utility drops blank files; keep empty pages as visible markdown files."
  [content]
  (if (string/blank? content)
    "\n"
    content))

(defn- page-output-path
  [db page-title fallback-path]
  (let [base-name (or page-title
                      (when (string? fallback-path)
                        (some-> fallback-path
                                (string/replace #"\.[^.]+$" "")))
                      "Untitled")
        page (when page-title (ldb/get-page db page-title))
        dir (if (and page (ldb/journal? page))
              "Daily"
              "Notes")]
    (str dir "/" base-name ".md")))

(defn- attachment-output-path
  [path]
  (cond
    (not (string? path))
    path

    (string/starts-with? (string/lower-case path) "assets/")
    (str "Attachments/" (subs path (count "assets/")))

    :else
    path))

(defn- export-file-as-markdown
  [db content-config obsidian-mode? {:keys [path title content]} options]
  (let [content-normalized (cond-> (normalize-markdown-content content)
                                ;; Alias forms like [alias](((uuid))) must be converted before
                                ;; mldoc parsing since mldoc can't handle them.
                                obsidian-mode?
                                (->> (replace-alias-uuid-refs db)))
          raw-exported-content (binding [cli-export-common/*current-db* db
                                         cli-export-common/*content-config* content-config]
                                 (cli-export-text/export-helper content-normalized :markdown options))
          exported-content (normalize-markdown-content raw-exported-content)
          frontmatter (when obsidian-mode?
                        (build-page-frontmatter db title))
          page-tags-header (when obsidian-mode?
                             (build-page-tag-header db title))
          page-header (str (or frontmatter "")
                           (or page-tags-header ""))
          output-content (cond-> exported-content
                           obsidian-mode?
                           fix-asset-paths

                           obsidian-mode?
                           (#(replace-remaining-uuid-page-refs db %))

                           obsidian-mode?
                           (prepend-page-header-if-missing page-header))
          output-content (ensure-non-blank-content output-content)
          output-path (if obsidian-mode?
                        (page-output-path db title path)
                        (or path title))]
      [output-path output-content]))


(defn export-files-as-markdown
  "options see also `export-blocks-as-markdown`"
  [files options]
  (let [repo (state/get-current-repo)
        db (conn/get-db repo)
        obsidian-mode? (true? (get-in options [:other-options :obsidian-mode?]))
        content-config (common/get-content-config {:obsidian-mode? obsidian-mode?})]
    (mapv #(export-file-as-markdown db content-config obsidian-mode? % options) files)))

(defn- <export-files-as-markdown-with-progress
  [files options progress-fn]
  (let [repo (state/get-current-repo)
        db (conn/get-db repo)
        obsidian-mode? (true? (get-in options [:other-options :obsidian-mode?]))
        content-config (common/get-content-config {:obsidian-mode? obsidian-mode?})
        files (vec files)
        total (count files)]
    (p/loop [idx 0
             result []]
      (if (>= idx total)
        result
        (let [file (nth files idx)
              current (inc idx)
              result' (conj result (export-file-as-markdown db content-config obsidian-mode? file options))]
          (when progress-fn
            (progress-fn current total))
          (p/let [_ (<maybe-yield-for-progress current total)]
            (p/recur current result')))))))

(defn export-repo-as-markdown!
  "Export repository as Obsidian-compatible markdown"
  [repo]
  (show-export-progress! :prepare 0 0)
  (-> (p/let [files* (common/<get-file-contents repo "md" {:obsidian-mode? true})
              assets (assets-handler/<get-all-assets)]
        (if (seq files*)
          (let [options {:other-options {:obsidian-mode? true}}
                total (count files*)
                _ (show-export-progress! :convert 0 total)
                progress-fn (fn [current total']
                              (show-export-progress! :convert current total'))
                repo' (string/replace repo config/db-version-prefix "")
                zip-file-name (str repo' "_markdown_" (quot (util/time-ms) 1000))]
            (p/let [files (<export-files-as-markdown-with-progress files* options progress-fn)
                    assets' (map (fn [[path data]]
                                   [(attachment-output-path path) data])
                                 (or assets []))
                    all-files (concat files assets')
                    _ (show-export-progress! :zip total total)
                    zipfile (zip/make-zip zip-file-name all-files repo')]
              (clear-export-progress!)
              (notification/show! "Export completed." :success)
              (when-let [anchor (gdom/getElement "export-as-markdown")]
                (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
                (.setAttribute anchor "download" (.-name zipfile))
                (.click anchor))))
          (do
            (clear-export-progress!)
            (notification/show! "No files to export." :warning))))
      (p/catch (fn [e]
                 (js/console.error "export-repo-as-markdown failed:" e)
                 (clear-export-progress!)
                 (notification/show! "Markdown export failed. Please check console logs." :error false)
                 (throw e)))))

;;; export fns (ends)
