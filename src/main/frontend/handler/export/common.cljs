(ns frontend.handler.export.common
  "Common functions for exporting."
  (:require [clojure.string :as string]
            [frontend.db.conn :as conn]
            [frontend.state :as state]
            [frontend.handler.export.common-impl :as common-impl]
            [promesa.core :as p]))

(defn get-content-config []
  {:export-bullet-indentation (state/get-export-bullet-indentation)
   :date-formatter (state/get-date-formatter)})

(defn root-block-uuids->content
  "Converts given block uuids to content for given repo"
  ([repo root-block-uuids]
   (root-block-uuids->content repo root-block-uuids nil))
  ([repo root-block-uuids {:keys [open-blocks-only? include-properties?]}]
   (binding [common-impl/*current-db* (conn/get-db repo)
             common-impl/*content-config* (get-content-config)]
     (let [contents (mapv (fn [id]
                            (common-impl/get-blocks-contents id
                                                                   :open-blocks-only? open-blocks-only?
                                                                   :include-properties? include-properties?))
                          root-block-uuids)]
       (string/join "\n" (mapv string/trim-newline contents))))))

(defn get-page-content
  "Gets page content for current repo, db and state"
  ([page-uuid]
   (get-page-content page-uuid nil))
  ([page-uuid {:keys [open-blocks-only? include-properties?]}]
   (binding [common-impl/*current-db* (conn/get-db (state/get-current-repo))
             common-impl/*content-config* (get-content-config)]
     (common-impl/get-page-content page-uuid
                                         :open-blocks-only? open-blocks-only?
                                         :include-properties? include-properties?))))

(defn <get-debug-datoms
  [repo]
  (state/<invoke-db-worker :thread-api/export-get-debug-datoms repo))

(defn <get-all-page->content
  [repo options]
  (state/<invoke-db-worker :thread-api/export-get-all-page->content repo options))

(defn <get-file-contents
  [repo suffix]
  (p/let [page->content (<get-all-page->content repo
                                                {:export-bullet-indentation (state/get-export-bullet-indentation)})]
    (clojure.core/map (fn [[page-title content]]
                        {:path (str page-title "." suffix)
                         :content content
                         :title page-title
                         :format :markdown})
                      page->content)))

;; Aliased fns requiring common-impl dynamic bindings e.g. common-impl/*current-db*
(def replace-block&page-reference&embed common-impl/replace-block&page-reference&embed)
(def replace-Heading-with-Paragraph common-impl/replace-Heading-with-Paragraph)

;; Aliased fns
(def priority->string common-impl/priority->string)
(def timestamp-to-string common-impl/timestamp-to-string)
(def hashtag-value->string common-impl/hashtag-value->string)
(def remove-block-ast-pos common-impl/remove-block-ast-pos)
(def Properties-block-ast? common-impl/Properties-block-ast?)
(def keep-only-level<=n common-impl/keep-only-level<=n)
(def remove-emphasis common-impl/remove-emphasis)
(def remove-page-ref-brackets common-impl/remove-page-ref-brackets)
(def remove-tags common-impl/remove-tags)
(def remove-prefix-spaces-in-Plain common-impl/remove-prefix-spaces-in-Plain)
(def walk-block-ast common-impl/walk-block-ast)
