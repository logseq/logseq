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
            [frontend.util.text :as text-util]
            [frontend.format.mldoc :as mldoc]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- paste-text-parseable
  [format text]
  (when-let [editing-block (state/get-edit-block)]
    (let [page-id (:db/id (:block/page editing-block))
          blocks (block/extract-blocks
                  (mldoc/->edn text (gp-mldoc/default-config format))
                  text format
                  {:page-name (:block/name (db/entity page-id))})
          blocks' (gp-block/with-parent-and-left page-id blocks)]
      (editor-handler/paste-blocks blocks' {:keep-uuid? true}))))

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
    (util/format "{{twitter %s}}" url)))

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

(defn- selection-within-link?
  [selection-and-format]
  (let [{:keys [format selection-start selection-end selection value]} selection-and-format]
    (and (not= selection-start selection-end)
         (->> (case format
                :markdown (util/re-pos #"\[.*?\]\(.*?\)" value)
                :org (util/re-pos #"\[\[.*?\]\[.*?\]\]" value))
              (some (fn [[start-index matched-text]]
                      (and (<= start-index selection-start)
                           (>= (+ start-index (count matched-text)) selection-end)
                           (clojure.string/includes? matched-text selection))))
              some?))))

;; See https://developer.chrome.com/blog/web-custom-formats-for-the-async-clipboard-api/
;; for a similar example
(defn get-copied-blocks []
  ;; NOTE: Avoid using navigator clipboard API on Android, it will report a permission error
  (p/let [clipboard-items (when (and (not (mobile-util/native-android?))
                                     js/window (gobj/get js/window "navigator") js/navigator.clipboard)
                            (js/navigator.clipboard.read))
          blocks-blob ^js (when clipboard-items
                            (let [types (.-types ^js (first clipboard-items))]
                              (when (contains? (set types) "web application/logseq")
                                (.getType ^js (first clipboard-items)
                                          "web application/logseq"))))
          blocks-str (when blocks-blob (.text blocks-blob))]
         (when blocks-str
           (gp-util/safe-read-string blocks-str))))

(defn- markdown-blocks?
  [text]
  (boolean (util/safe-re-find #"(?m)^\s*(?:[-+*]|#+)\s+" text)))

(defn- org-blocks?
  [text]
  (boolean (util/safe-re-find #"(?m)^\s*\*+\s+" text)))

(defn- get-revert-cut-tx
  "Get reverted previous cut tx when paste"
  [blocks]
  (let [{:keys [retracted-block-ids revert-tx]} (get-in @state/state [:editor/last-replace-ref-content-tx (state/get-current-repo)])
        recent-cut-block-ids (->> retracted-block-ids (map second) (set))]
    (state/set-state! [:editor/last-replace-ref-content-tx (state/get-current-repo)] nil)
    (when (= (set (map :block/uuid blocks)) recent-cut-block-ids)
      (seq revert-tx))))

(defn- paste-copied-text
  [input *text html]
  (let [replace-text-f (fn [text]
                         (let [input-id (state/get-edit-input-id)]
                           (commands/delete-selection! input-id)
                           (commands/simple-insert! input-id text nil)))
        text (string/replace *text "\r\n" "\n") ;; Fix for Windows platform
        input-id (state/get-edit-input-id)
        shape-refs-text (when (and (not (string/blank? html))
                                   (get-whiteboard-tldr-from-text html))
                          ;; text should always be prepared block-ref generated in tldr
                          text)
        {:keys [value selection] :as selection-and-format} (editor-handler/get-selection-and-format)
        text-url? (gp-util/url? text)
        selection-url? (gp-util/url? selection)]
    (cond
      (not (string/blank? shape-refs-text))
      (commands/simple-insert! input-id shape-refs-text nil)

      ;; When a url is selected in a formatted link, replaces it with pasted text
      (or (and (or text-url? selection-url?)
               (selection-within-link? selection-and-format))
          (and text-url? selection-url?))
      (replace-text-f text)

      ;; Pastes a formatted link over selected text
      (and (or text-url?
               (and value (gp-util/url? (string/trim value))))
           (not (string/blank? (util/get-selected-text))))
      (editor-handler/html-link-format! text)

      ;; Pastes only block id when inside of '(())'
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
            text-blocks? (if (= format :markdown) markdown-blocks? org-blocks?)
            blocks? (text-blocks? text)
            text' (or html-text
                      (when (gp-util/url? text)
                        (wrap-macro-url text))
                      text)]
        (cond
          blocks?
          (paste-text-parseable format text)

          (util/safe-re-find #"(?:\r?\n){2,}" text')
          (paste-segmented-text format text')

          :else
          (replace-text-f text'))))))

(defn- paste-copied-blocks-or-text
  ;; todo: logseq/whiteboard-shapes is now text/html
  [input text e html]
  (util/stop e)
  (->
   (p/let [copied-blocks (get-copied-blocks)]
     (if (seq copied-blocks)
       ;; Handle internal paste
       (let [revert-cut-tx (get-revert-cut-tx copied-blocks)
             cut-paste? (boolean (seq revert-cut-tx))
             keep-uuid? cut-paste?]
         (editor-handler/paste-blocks copied-blocks {:revert-cut-tx revert-cut-tx
                                                     :cut-paste? cut-paste?
                                                     :keep-uuid? keep-uuid?}))
       (paste-copied-text input text html)))
   (p/catch (fn [error]
              (log/error :msg "Paste failed" :exception error)
              (state/pub-event! [:capture-error {:error error
                                                 :payload {:type ::paste-copied-blocks-or-text}}])))))

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
    (paste-copied-blocks-or-text input text e html)))

(defn- paste-file-if-exists [id e]
  (when id
    (let [clipboard-data (gobj/get e "clipboardData")
          files (.-files clipboard-data)]
      (when-let [file (first files)]
        (when-let [block (state/get-edit-block)]
          (editor-handler/upload-asset id #js[file] (:block/format block)
                                       editor-handler/*asset-uploading? true)))
      (util/stop e))))

(defn editor-on-paste!
  "Pastes with formatting and includes the following features:
- handles internal pastes to correctly paste at the block level
- formatted paste includes HTML if detected
- special handling for newline and new blocks
- pastes file if it exists
- wraps certain urls with macros
- wraps selected urls with link formatting
- whiteboard friendly pasting
- paste replaces selected text"
  [id]
  (fn [e]
    (state/set-state! :editor/on-paste? true)
    (let [clipboard-data (gobj/get e "clipboardData")
          html (.getData clipboard-data "text/html")
          text (.getData clipboard-data "text")
          has-files? (seq (.-files clipboard-data))]
      (cond
        (and (string/blank? text) (string/blank? html))
        ;; When both text and html are blank, paste file if exists.
        ;; NOTE: util/stop is not called here if no file is provided,
        ;; so the default paste behavior of the native platform will be used.
        (when has-files?
          (paste-file-if-exists id e))

        ;; both file attachment and text/html exist
        (and has-files? (state/preferred-pasting-file?))
        (paste-file-if-exists id e)

        :else
        (paste-text-or-blocks-aux (state/get-input) e text html)))))

(defn editor-on-paste-raw!
  "Raw pastes without _any_ formatting. Can also replace selected text with a paste"
  []
  (state/set-state! :editor/on-paste? true)
  (utils/getClipText
   (fn [clipboard-data]
     (when (state/get-input)
       (commands/delete-selection! (state/get-edit-input-id))
       (editor-handler/insert clipboard-data true)))
   (fn [error]
     (js/console.error error))))
