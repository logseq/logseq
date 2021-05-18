(ns frontend.modules.file.core
  (:require [frontend.debug :as debug]
            [clojure.string :as string]
            [frontend.state :as state]
            [cljs.core.async :as async]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.fs :as fs]
            [frontend.handler.notification :as notification]
            [frontend.util :as util]
            [frontend.modules.outliner.tree :as tree]
            [promesa.core :as p]))

(defn- indented-block-content
  [content spaces-tabs]
  (let [lines (string/split-lines content)]
    (string/join (str "\n" spaces-tabs) lines)))

(defn transform-content
  [{:block/keys [format pre-block? title content unordered body heading-level left page]} level heading-to-list?]
  (let [content (or content "")
        heading-with-title? (seq title)
        first-block? (= left page)
        pre-block? (and first-block? pre-block?)
        markdown-heading? (and (= format :markdown) (not unordered) (not heading-to-list?))]
    (cond
      (and first-block? pre-block?)
      (let [content (-> (string/trim content)
                        ;; FIXME: should only works with :filters
                        (string/replace "\"" "\\\""))]
        (str content "\n"))

      :else
      (let [[prefix spaces-tabs]
            (cond
              (= format :org)
              [(->>
                (repeat level "*")
                (apply str)) ""]

              markdown-heading?
              ["" ""]

              :else
              (let [level (if (and heading-to-list? heading-level)
                            (if (> heading-level 1)
                              (dec heading-level)
                              heading-level)
                            level)
                    spaces-tabs (->>
                                 (repeat (dec level) (state/get-export-bullet-indentation))
                                 (apply str))]
                [(str spaces-tabs "-") (str spaces-tabs "  ")]))
            content (if heading-to-list?
                      (-> (string/replace content #"^\s?#+\s+" "")
                          (string/replace #"^\s?#+\s?$" ""))
                      content)
            new-content (indented-block-content (string/trim content) spaces-tabs)
            sep (cond
                  markdown-heading?
                  ""

                  heading-with-title?
                  " "

                  (string/blank? new-content)
                  ""

                  :else
                  (str "\n" spaces-tabs))]
        (str prefix sep new-content)))))

(defn tree->file-content
  [tree {:keys [init-level heading-to-list?]
         :or {heading-to-list? false}}]
  (loop [block-contents []
         [f & r] tree
         level init-level]
    (if (nil? f)
      (string/join "\n" block-contents)
      (let [content (transform-content f level heading-to-list?)
            new-content
            (if-let [children (seq (:block/children f))]
              [content (tree->file-content children {:init-level (inc level)})]
              [content])]
        (recur (into block-contents new-content) r level)))))

(def init-level 1)

(defn push-to-write-chan
  [files & opts]
  (let [repo (state/get-current-repo)]
    (when-let [chan (state/get-file-write-chan)]
      (let [chan-callback (:chan-callback opts)]
        (async/put! chan [repo files opts])
        (when chan-callback
          (chan-callback))))))

(defn- create-file-if-not-exists!
  [page ok-handler]
  (when-let [repo (state/get-current-repo)]
    (let [format (name (get page :block/format
                            (state/get-preferred-format)))
          title (string/capitalize (:block/name page))
          journal-page? (date/valid-journal-title? title)
          path (str
                (if journal-page?
                  (config/default-journals-directory)
                  (config/get-pages-directory))
                "/"
                (if journal-page?
                  (date/journal-title->default title)
                  (-> (or (:block/original-name page) (:block/name page))
                      (util/page-name-sanity))) "."
                (if (= format "markdown") "md" format))
          file-path (str "/" path)
          dir (config/get-repo-dir repo)]
      (p/let [exists? (fs/file-exists? dir file-path)]
        (if exists?
          (notification/show!
           [:p.content
            (util/format "File %s already exists!" file-path)]
           :error)
          (let [file-path (config/get-file-path repo path)
                tx [{:file/path file-path}
                    {:block/name (:block/name page)
                     :block/file [:file/path file-path]}]]
            (db/transact! tx)
            (when ok-handler (ok-handler))))))))

(defn save-tree-aux!
  [page-block tree]
  (let [page-block (db/pull (:db/id page-block))
        new-content (tree->file-content tree {:init-level init-level})
        file-db-id (-> page-block :block/file :db/id)
        file-path (-> (db-utils/entity file-db-id) :file/path)
        _ (assert (string? file-path) "File path should satisfy string?")
        ;; FIXME: name conflicts between multiple graphs
        files [[file-path new-content]]]
    (push-to-write-chan files)))

(defn save-tree
  [page-block tree]
  {:pre [(map? page-block)]}
  (let [ok-handler #(save-tree-aux! page-block tree)
        file (or (:block/file page-block)
                 (when-let [page (:db/id (:block/page page-block))]
                   (:block/file (db-utils/entity page))))]
    (if file
      (ok-handler)
      (create-file-if-not-exists! page-block ok-handler))))
