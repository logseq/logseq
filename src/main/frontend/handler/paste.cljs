(ns ^:no-doc frontend.handler.paste
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.format.block :as block]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.handler.editor :as editor-handler]
            [frontend.extensions.html-parser :as html-parser]
            [goog.object :as gobj]
            [frontend.mobile.util :as mobile-util]
            [frontend.util.thingatpt :as thingatpt]
            ["/frontend/utils" :as utils]
            [frontend.commands :as commands]
            [cljs.core.match :refer [match]]
            [frontend.handler.notification :as notification]
            [frontend.util.text :as text-util]
            [frontend.format.mldoc :as mldoc]
            [lambdaisland.glogi :as log]))

(defn- paste-text-parseable
  [format text]
  (when-let [editing-block (state/get-edit-block)]
    (let [page-id (:db/id (:block/page editing-block))
          blocks (block/extract-blocks
                  (mldoc/->edn text (gp-mldoc/default-config format)) text format {})
          blocks' (gp-block/with-parent-and-left page-id blocks)]
      (editor-handler/paste-blocks blocks' {}))))

(defn- paste-segmented-text
  [format text]
  (let [paragraphs (string/split text #"(?:\r?\n){2,}")
        updated-paragraphs
        (string/join "\n"
                     (mapv (fn [p] (->> (string/trim p)
                                        ((fn [p]
                                           (if (util/safe-re-find (if (= format :org)
                                                                    #"\s*\*+\s+"
                                                                    #"\s*-\s+") p)
                                             p
                                             (str (if (= format :org) "* " "- ") p))))))
                           paragraphs))]
    (paste-text-parseable format updated-paragraphs)))

(defn- wrap-macro-url
  [url]
  (cond
    (boolean (text-util/get-matched-video url))
    (util/format "{{video %s}}" url)

    (string/includes? url "twitter.com")
    (util/format "{{twitter %s}}" url)

    :else
    (do
      (notification/show! (util/format "No macro is available for %s" url) :warning)
      nil)))

(defn- try-parse-as-json
  "Result is not only to be an Object.
   Maybe JSON types like string, number, boolean, null, array"
  [text]
  (try (js/JSON.parse text)
       (catch :default _ #js{})))

(defn- get-whiteboard-tldr-from-text
  [text]
  (when-let [matched-text (util/safe-re-find #"<whiteboard-tldr>(.*)</whiteboard-tldr>"
                                             (gp-util/safe-decode-uri-component text))]
    (try-parse-as-json (second matched-text))))

(defn- get-whiteboard-shape-refs-text
  [text]
  (let [tldr (get-whiteboard-tldr-from-text text)]
    (when (and tldr (object? tldr))
      (->> (gobj/get tldr "shapes")
           (mapv (fn [shape]
                   (let [shape-id (gobj/get shape "id")]
                     (block-ref/->block-ref shape-id))))
           (string/join "\n")))))

(defn- paste-copied-blocks-or-text
  ;; todo: logseq/whiteboard-shapes is now text/html
  [text e html]
  (util/stop e)
  (let [copied-blocks (state/get-copied-blocks)
        input (state/get-input)
        input-id (state/get-edit-input-id)
        text (string/replace text "\r\n" "\n") ;; Fix for Windows platform
        shape-refs-text (when-not (string/blank? html) (get-whiteboard-shape-refs-text html))
        internal-paste? (and
                         (seq (:copy/blocks copied-blocks))
                         ;; not copied from the external clipboard
                         (= (string/trimr text)
                            (string/trimr (:copy/content copied-blocks))))]
    (if internal-paste?
      (let [blocks (:copy/blocks copied-blocks)]
        (when (seq blocks)
          (editor-handler/paste-blocks blocks {})))
      (let [{:keys [value]} (editor-handler/get-selection-and-format)]
        (cond
          (not (string/blank? shape-refs-text))
          (commands/simple-insert! input-id shape-refs-text nil)

          (and (or (gp-util/url? text)
                   (and value (gp-util/url? (string/trim value))))
               (not (string/blank? (util/get-selected-text))))
          (editor-handler/html-link-format! text)

          (and (block-ref/block-ref? text)
               (editor-handler/wrapped-by? input block-ref/left-parens block-ref/right-parens))
          (commands/simple-insert! input-id (block-ref/get-block-ref-id text) nil)

          :else
          ;; from external
          (let [format (or (db/get-page-format (state/get-current-page)) :markdown)
                html-text (let [result (when-not (string/blank? html)
                                         (try
                                           (html-parser/convert format html)
                                           (catch :default e
                                             (log/error :exception e)
                                             nil)))]
                            (if (string/blank? result) nil result))
                text (or html-text text)
                replace-text-f (fn []
                                 (commands/delete-selection! input-id)
                                 (commands/simple-insert! input-id text nil))]
            (match [format
                    (nil? (util/safe-re-find #"(?m)^\s*(?:[-+*]|#+)\s+" text))
                    (nil? (util/safe-re-find #"(?m)^\s*\*+\s+" text))
                    (nil? (util/safe-re-find #"(?:\r?\n){2,}" text))]
              [:markdown false _ _]
              (paste-text-parseable format text)

              [:org _ false _]
              (paste-text-parseable format text)

              [:markdown true _ false]
              (paste-segmented-text format text)

              [:markdown true _ true]
              (replace-text-f)

              [:org _ true false]
              (paste-segmented-text format text)

              [:org _ true true]
              (replace-text-f))))))))

(defn paste-text-in-one-block-at-point
  []
  (utils/getClipText
   (fn [clipboard-data]
     (when-let [_ (state/get-input)]
       (if (gp-util/url? clipboard-data)
         (if (string/blank? (util/get-selected-text))
           (editor-handler/insert (or (wrap-macro-url clipboard-data) clipboard-data) true)
           (editor-handler/html-link-format! clipboard-data))
         (editor-handler/insert clipboard-data true))))
   (fn [error]
     (js/console.error error))))

(defn- paste-text-or-blocks-aux
  [input e text html]
  (if (or (thingatpt/markdown-src-at-point input)
          (thingatpt/org-admonition&src-at-point input))
    (when-not (mobile-util/native-ios?)
      (util/stop e)
      (paste-text-in-one-block-at-point))
    (paste-copied-blocks-or-text text e html)))

(defn editor-on-paste!
  ([id]
   (editor-on-paste! id false))
  ([id raw-paste?]
   (fn [e]
     (state/set-state! :editor/on-paste? true)
     (let [input (state/get-input)]
       (if raw-paste?
         (utils/getClipText
          (fn [clipboard-data]
            (when-let [_ (state/get-input)]
              (let [text (or (when (gp-util/url? clipboard-data)
                               (wrap-macro-url clipboard-data))
                             clipboard-data)]
                (paste-text-or-blocks-aux input e text nil))))
          (fn [error]
            (js/console.error error)))
         (let [clipboard-data (gobj/get e "clipboardData")
               html (when-not raw-paste? (.getData clipboard-data "text/html"))
               text (.getData clipboard-data "text")
               files (.-files clipboard-data)
               paste-file-if-exist (fn []
                                      (when id
                                        (let [_handled
                                              (let [clipboard-data (gobj/get e "clipboardData")
                                                    files (.-files clipboard-data)]
                                                (when-let [file (first files)]
                                                  (when-let [block (state/get-edit-block)]
                                                    (editor-handler/upload-asset id #js[file] (:block/format block)
                                                                                 editor-handler/*asset-uploading? true))))]
                                          (util/stop e))))]
           (cond
             (and (string/blank? text) (string/blank? html)) (paste-file-if-exist)
             (and (seq files) (state/preferred-pasting-file?)) (paste-file-if-exist)
             :else (paste-text-or-blocks-aux input e text html))))))))
