(ns frontend.worker.file.page-rename
  "File based page rename fns"
  (:require [logseq.common.util :as common-util]
            [logseq.graph-parser.property :as gp-property]
            [logseq.common.util.page-ref :as page-ref]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.config :as common-config]))

(defn- replace-page-ref-aux
  "Unsanitized names"
  [config content old-name new-name]
  (let [preferred-format (common-config/get-preferred-format config)
        [original-old-name original-new-name] (map string/trim [old-name new-name])
        [old-ref new-ref] (map page-ref/->page-ref [old-name new-name])
        [old-name new-name] (map #(if (string/includes? % "/")
                                    (string/replace % "/" ".")
                                    %)
                                 [original-old-name original-new-name])
        old-org-ref (and (= :org preferred-format)
                         (:org-mode/insert-file-link? config)
                         (re-find
                          (re-pattern
                           (common-util/format
                            "\\[\\[file:\\.*/.*%s\\.org\\]\\[(.*?)\\]\\]" old-name))
                          content))]
    (-> (if old-org-ref
          (let [[old-full-ref old-label] old-org-ref
                new-label (if (= old-label original-old-name)
                            original-new-name
                            old-label)
                new-full-ref (-> (string/replace old-full-ref old-name new-name)
                                 (string/replace (str "[" old-label "]")
                                                 (str "[" new-label "]")))]
            (string/replace content old-full-ref new-full-ref))
          content)
        (string/replace old-ref new-ref))))

(defn replace-tag-ref!
  [content old-name new-name]
  (let [old-tag (common-util/format "#%s" old-name)
        new-tag (if (re-find #"[\s\t]+" new-name)
                  (common-util/format "#[[%s]]" new-name)
                  (str "#" new-name))]
    ;; hash tag parsing rules https://github.com/logseq/mldoc/blob/701243eaf9b4157348f235670718f6ad19ebe7f8/test/test_markdown.ml#L631
    ;; Safari doesn't support look behind, don't use
    ;; TODO: parse via mldoc
    (string/replace content
                    (re-pattern (str "(?i)(^|\\s)(" (common-util/escape-regex-chars old-tag) ")(?=[,\\.]*($|\\s))"))
                    ;;    case_insense^    ^lhs   ^_grp2                       look_ahead^         ^_grp3
                    (fn [[_match lhs _grp2 _grp3]]
                      (str lhs new-tag)))))

(defn- replace-property-ref!
  [content old-name new-name format]
  (let [new-name (keyword (string/replace (string/lower-case new-name) #"\s+" "-"))
        org-format? (= :org format)
        old-property (if org-format? (gp-property/colons-org old-name) (str old-name gp-property/colons))
        new-property (if org-format? (gp-property/colons-org (name new-name)) (str (name new-name) gp-property/colons))]
    (common-util/replace-ignore-case content old-property new-property)))

(defn- replace-old-page!
  "Unsanitized names"
  [config content old-name new-name format]
  (when (and (string? content) (string? old-name) (string? new-name))
    (-> (replace-page-ref-aux config content old-name new-name)
        (replace-tag-ref! old-name new-name)
        (replace-property-ref! old-name new-name format))))

(defn- walk-replace-old-page!
  "Unsanitized names"
  [config form old-name new-name format]
  (walk/postwalk (fn [f]
                   (cond
                     (and (vector? f)
                          (contains? #{"Search" "Label"} (first f))
                          (string/starts-with? (second f) (str old-name "/")))
                     [(first f) (string/replace-first (second f)
                                                      (str old-name "/")
                                                      (str new-name "/"))]

                     (string? f)
                     (if (= f old-name)
                       new-name
                       (replace-old-page! config f old-name new-name format))

                     (and (keyword f) (= (name f) old-name))
                     (keyword (string/replace (string/lower-case new-name) #"\s+" "-"))

                     :else
                     f))
                 form))

(defn- rename-update-block-refs!
  [refs from-id to-id]
  (if to-id
    (->> refs
        (remove #{{:db/id from-id}})
        (cons {:db/id to-id})
        (distinct)
        (vec))
    ;; New page not exists so that we keep using the old page's block as a ref
    refs))

(defn replace-page-ref
  "Unsanitized only"
  [db config old-original-name new-name]
  ;; update all pages which have references to this page
  (let [page (d/entity db [:block/name (common-util/page-name-sanity-lc old-original-name)])
        to-page (d/entity db [:block/name (common-util/page-name-sanity-lc new-name)])
        blocks (:block/_refs (d/entity db (:db/id page)))
        tx       (->> (map (fn [{:block/keys [uuid content properties format] :as block}]
                             (let [content    (let [content' (replace-old-page! config content old-original-name new-name format)]
                                                (when-not (= content' content)
                                                  content'))
                                   properties (let [properties' (walk-replace-old-page! config properties old-original-name new-name format)]
                                                (when-not (= properties' properties)
                                                  properties'))]
                               (when (or content properties)
                                 (common-util/remove-nils-non-nested
                                  {:block/uuid       uuid
                                   :block/content    content
                                   :block/properties properties
                                   :block/properties-order (when (seq properties)
                                                             (map first properties))
                                   :block/refs (->> (rename-update-block-refs! (:block/refs block) (:db/id page) (:db/id to-page))
                                                    (map :db/id)
                                                    (set))})))) blocks)
                      (remove nil?))]
    tx))
