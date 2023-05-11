(ns ^:no-doc frontend.util.thingatpt
  (:require [clojure.string :as string]
            [frontend.state :as state]
            [frontend.util.cursor :as cursor]
            [frontend.config :as config]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [cljs.reader :as reader]
            [goog.object :as gobj]))

(defn thing-at-point
  [bounds & [input ignore]]
  (let [input (or input (state/get-input))
        content (gobj/get input "value")
        pos (cursor/pos input)
        [left right] (if (coll? bounds) bounds [bounds bounds])]
    (when-not (string/blank? content)
     (let [start (string/last-index-of
                  content left (if (= left right) (- pos (count left)) (dec pos)))
           end (string/index-of
                content right (if (= left right) pos (inc (- pos (count right)))))
           end* (+ (count right) end)]
       (when (and start end (not= start pos))
         (let [thing (subs content (+ start (count left)) end)]
           (when (every?
                  false?
                  (mapv #(string/includes? thing %)
                        [left right ignore]))
             {:full-content (subs content start end*)
              :raw-content (subs content (+ start (count left)) end)
              :bounds bounds
              :start start
              :end end*})))))))

(defn line-at-point [& [input]]
  (let [input (or input (state/get-input))
        line-beginning-pos (cursor/line-beginning-pos input)
        line-end-pos (cursor/line-end-pos input)]
    (when (not= line-beginning-pos line-end-pos)
      (let [content (gobj/get input "value")
            line (subs content line-beginning-pos line-end-pos)]
        {:type "line"
         :full-content line
         :raw-content line
         :start line-beginning-pos
         :end line-end-pos}))))

(defn block-ref-at-point [& [input]]
  (when-let [block-ref (thing-at-point [block-ref/left-parens block-ref/right-parens] input " ")]
    (when-let [uuid (uuid (:raw-content block-ref))]
      (assoc block-ref
             :type "block-ref"
             :link uuid))))

(defn page-ref-at-point [& [input]]
  (when-let [page-ref (thing-at-point [page-ref/left-brackets page-ref/right-brackets] input)]
    (assoc page-ref
           :type "page-ref"
           :link (text/get-page-name
                  (:full-content page-ref)))))

(defn embed-macro-at-point [& [input]]
  (when-let [macro (thing-at-point ["{{embed" "}}"] input)]
    (assoc macro :type "macro")))

;; TODO support markdown YAML front matter
;; TODO support using org style properties in markdown
(defn properties-at-point [& [input]]
  (when-let [properties
             (case (state/get-preferred-format) ;; TODO fix me to block's format
               :org (thing-at-point
                     [gp-property/properties-start
                      gp-property/properties-end]
                     input)
               (when-let [line (line-at-point input)]
                 (when (re-matches #"^[^\s.]+:: .*$" (:raw-content line))
                   line)))]
    (assoc properties :type "properties-drawer")))

;; TODO support markdown YAML front matter
;; TODO support using org style properties in markdown
(defn property-key-at-point [& [input]]
  (when (properties-at-point input)
    (let [property
          (case (state/get-preferred-format) ;; TODO fix me to block's format
            :org (thing-at-point ":" input "\n")
            (when-let [line (:raw-content (line-at-point input))]
              (let [key (first (string/split line gp-property/colons))
                    line-beginning-pos (cursor/line-beginning-pos input)
                    pos-in-line (- (cursor/pos input) line-beginning-pos)]
                (when (<= 0 pos-in-line (+ (count key) (count gp-property/colons)))
                  {:full-content (str key gp-property/colons)
                   :raw-content key
                   :start line-beginning-pos
                   :end (+ line-beginning-pos (count (str key gp-property/colons)))}))))]
      (assoc property :type "property-key"))))

(defn get-list-item-indent&bullet [line]
  (when-not (string/blank? line)
    (or (re-matches #"^([ \t\r]*)(\+|\*|-){1} (\[[X ]\])?.*$" line)
        (re-matches #"^([\s]*)(\d+){1}\. (\[[X ]\])?.*$" line))))

(defn list-item-at-point [& [input]]
  (when-let [line (line-at-point input)]
    (when-let [[_ indent bullet checkbox]
               (get-list-item-indent&bullet (:raw-content line))]
      (let [bullet (reader/read-string bullet)]
        (assoc line
               :type "list-item"
               :indent indent
               :bullet bullet
               :checkbox checkbox
               :ordered (int? bullet))))))

(defn- get-markup-at-point [& [input]]
  (let [format (state/get-preferred-format)] ;; TODO fix me to block's format
   (or (thing-at-point (config/get-hr format) input)
       (thing-at-point (config/get-bold format) input)
       (thing-at-point (config/get-italic format) input)
       (thing-at-point (config/get-underline format) input)
       (thing-at-point (config/get-strike-through format) input)
       (thing-at-point (config/get-highlight format) input)
       (thing-at-point (config/get-code format) input))))

(defn markup-at-point [& [input]]
  (when-let [markup (get-markup-at-point input)]
    (assoc markup :type "markup")))

(defn org-admonition&src-at-point [& [input]]
  (when-let [admonition&src (thing-at-point ["#+BEGIN_" "#+END_"] input)]
    (let [params (string/split
                  (first (string/split-lines (:full-content admonition&src)))
                  #"\s")]
      (cond (coll? params)
            (assoc admonition&src
                   :type "source-block"
                   :language (ffirst params)
                   :headers (when (> (count params) 2)
                              (last (params)))
                   :end (+ (:end admonition&src) (count "src")))
            :else
            (when-let [name (-> params
                                (string/replace "#+BEGIN_" "")
                                string/trim)]
              (assoc admonition&src
                     :type "admonition-block"
                     :name name
                     :end (+ (:end admonition&src) (count name))))))))

(defn markdown-src-at-point [& [input]]
  (when-let [markdown-src (thing-at-point ["```" "```"] input)]
    (let [language (-> (:full-content markdown-src)
                       string/split-lines
                       first
                       (string/replace "```" "")
                       string/trim)
          raw-content (:raw-content markdown-src)
          blank-raw-content? (string/blank? raw-content)
          action (if (or blank-raw-content? (= (string/trim raw-content) language))
                   :into-code-editor
                   :none)]
      (assoc markdown-src
             :type "source-block"
             :language language
             :action action
             :headers nil))))

(defn admonition&src-at-point [& [input]]
  (or (org-admonition&src-at-point input)
      (markdown-src-at-point input)))

(def default-settings
  {:admonition&src?  true
   :markup?          false
   :block-ref?       true
   :page-ref?        true
   :properties?      true
   :list?            false})

(defn get-setting [setting]
  (let [value (get-in (state/get-config) [:dwim/settings setting])]
    (if (some? value)
      value
      (get default-settings setting))))
