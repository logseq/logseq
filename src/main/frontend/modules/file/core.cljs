(ns frontend.modules.file.core
  (:require [frontend.debug :as debug]
            [clojure.string :as str]
            [frontend.state :as state]
            [cljs.core.async :as async]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.db.model :as model]
            [frontend.modules.outliner.tree :as tree]))

(defn clip-content
  [content]
  (->
    (str/replace content #"^\n+" "")
    (str/replace #"^#+" "")
    (str/replace #"\n+$" "")))

(defn transform-content
  [pre-block? content level]
  (if pre-block?
    (clip-content content)
    (let [prefix (->>
                   (repeat level "#")
                   (apply str))
          new-content (clip-content content)]
      (str prefix " " new-content))))

(defn tree->file-content
  [tree init-level]
  (loop [block-contents []
         [f & r] tree
         level init-level]
    (if (nil? f)
      (str/join "\n" block-contents)
      (let [content (transform-content
                      (:block/pre-block? f) (:block/content f) level)
            new-content
            (if-let [children (seq (:block/children f))]
              [content (tree->file-content children (inc level))]
              [content])]
        (recur (into block-contents new-content) r level)))))

(def markdown-init-level 2)

(defn push-to-write-chan
  [files file->content & opts]
  (let [repo (state/get-current-repo)]
    (when-let [chan (state/get-file-write-chan)]
      (let [chan-callback (:chan-callback opts)]
        (async/put! chan [repo files opts file->content])
        (when chan-callback
          (chan-callback))))))

(defn save-tree
  [page-block tree]
  {:pre [(map? page-block)]}
  (let [new-content (tree->file-content tree markdown-init-level)
        file-db-id (-> page-block :block/file :db/id)
        file-path (-> (db-utils/entity file-db-id) :file/path)
        _ (assert (string? file-path) "File path should satisfy string?")
        {old-content :file/content :as file} (model/get-file-by-path file-path)
        files [[file-path new-content]]
        file->content {file-path old-content}]
    (push-to-write-chan files file->content)))