(ns frontend.handler.paste
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.format.block :as block]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.block :as gp-block]
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
            [logseq.graph-parser.text :as text]
            [frontend.handler.notification :as notification]
            [frontend.util.text :as text-util]
            [frontend.format.mldoc :as mldoc]))

(defn- paste-text-parseable
  [format text]
  (when-let [editing-block (state/get-edit-block)]
    (let [page-id (:db/id (:block/page editing-block))
          blocks (block/extract-blocks
                  (mldoc/->edn text (gp-mldoc/default-config format)) text true format)
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

(defn- get-all-blocks-by-ids
  [repo ids]
  (loop [ids ids
         result []]
    (if (seq ids)
      (let [blocks (db/get-block-and-children repo (first ids))
            result (vec (concat result blocks))]
        (recur (remove (set (map :block/uuid result)) (rest ids)) result))
      result)))

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

(defn- paste-copied-blocks-or-text
  [text e html]
  (let [copied-blocks (state/get-copied-blocks)
        copied-block-ids (:copy/block-ids copied-blocks)
        copied-graph (:copy/graph copied-blocks)
        input (state/get-input)
        internal-paste? (and
                         (= copied-graph (state/get-current-repo))
                         (or (seq copied-block-ids)
                             (seq (:copy/full-blocks copied-blocks)))
                         ;; not copied from the external clipboard
                         (= text (:copy/content copied-blocks)))]
    (if internal-paste?
      (do
        (util/stop e)
        (let [blocks (or
                      (:copy/full-blocks copied-blocks)
                      (get-all-blocks-by-ids (state/get-current-repo) copied-block-ids))]
          (when (seq blocks)
            (state/set-copied-full-blocks! blocks)
            (editor-handler/paste-blocks blocks {}))))
      (let [{:keys [value]} (editor-handler/get-selection-and-format)]
        (cond
          (and (or (gp-util/url? text)
                   (and value (gp-util/url? (string/trim value))))
               (not (string/blank? (util/get-selected-text))))
          (do
            (util/stop e)
            (editor-handler/html-link-format! text))

          (and (text/block-ref? text)
               (editor-handler/wrapped-by? input "((" "))"))
          (do
            (util/stop e)
            (commands/simple-insert! (state/get-edit-input-id) (text/get-block-ref text) nil))

          :else
          ;; from external
          (let [format (or (db/get-page-format (state/get-current-page)) :markdown)
                text (or (when-not (string/blank? html)
                           (html-parser/convert format html))
                         text)
                input-id (state/get-edit-input-id)
                replace-text-f (fn []
                                 (commands/delete-selection! input-id)
                                 (commands/simple-insert! input-id text nil))]
            (util/stop e)
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
       (let [data (or (when (gp-util/url? clipboard-data)
                        (wrap-macro-url clipboard-data))
                      clipboard-data)]
         (editor-handler/insert data true))))
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
              text (.getData clipboard-data "text")]
          (if-not (string/blank? text)
            (paste-text-or-blocks-aux input e text html)
            (when id
              (let [_handled
                    (let [clipboard-data (gobj/get e "clipboardData")
                          files (.-files clipboard-data)]
                      (when-let [file (first files)]
                        (when-let [block (state/get-edit-block)]
                          (editor-handler/upload-asset id #js[file] (:block/format block)
                                                       editor-handler/*asset-uploading? true))))]
                (util/stop e))))))))))
