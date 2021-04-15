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

(defn transform-content
  [{:block/keys [format pre-block? content unordered]} level]
  (let [content (or content "")]
    (if pre-block?
      (string/trim content)
      (let [prefix (cond
                     (= format :org)
                     (->>
                      (repeat level "*")
                      (apply str))

                     (and (= format :markdown) (not unordered)) ; heading
                     ""

                     :else
                     (str (->>
                           (repeat (dec level) "  ")
                           (apply str))
                          "-"))         ; TODO:
            new-content (string/trim content)]
        (str prefix " " new-content)))))

(defn tree->file-content
  [tree init-level]
  (loop [block-contents []
         [f & r] tree
         level init-level]
    (if (nil? f)
      (string/join "\n" block-contents)
      (let [content (transform-content f level)
            new-content
            (if-let [children (seq (:block/children f))]
              [content (tree->file-content children (inc level))]
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
    (let [format (name (get page :block/format :markdown))
          title (string/capitalize (:block/name page))
          journal-page? (date/valid-journal-title? title)
          path (str
                (if journal-page?
                  config/default-journals-directory
                  (config/get-pages-directory))
                "/"
                (if journal-page?
                  (date/journal-title->default title)
                  (-> (:block/name page)
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
          (let [file-path (config/get-file-path repo path)]
            (db/transact! [{:file/path file-path}
                           {:block/name (:block/name page)
                            :block/file [:file/path file-path]}])
            (ok-handler)))))))

(defn save-tree-aux!
  [page-block tree]
  (let [page-block (db/pull (:db/id page-block))
        new-content (tree->file-content tree init-level)
        file-db-id (-> page-block :block/file :db/id)
        file-path (-> (db-utils/entity file-db-id) :file/path)
        _ (assert (string? file-path) "File path should satisfy string?")
        ;; FIXME: name conflicts between multiple graphs
        files [[file-path new-content]]]
    (push-to-write-chan files)))

(defn save-tree
  [page-block tree]
  {:pre [(map? page-block)]}
  (let [ok-handler #(save-tree-aux! page-block tree)]
    (if-let [file (:block/file page-block)]
      (ok-handler)
      (create-file-if-not-exists! page-block ok-handler))))
