(ns frontend.handler.export.common
  "common fns for exporting.
  exclude some fns which produce lazy-seq, which can cause strange behaviors
  when use together with dynamic var."
  (:refer-clojure :exclude [map filter mapcat concat remove])
  (:require [clojure.string :as string]
            [frontend.db.conn :as conn]
            [frontend.state :as state]
            [logseq.cli.common.export.common :as cli-export-common]
            [promesa.core :as p]))

(defn get-content-config []
  {:export-bullet-indentation (state/get-export-bullet-indentation)})

(defn root-block-uuids->content
  "Converts given block uuids to content for given repo"
  [repo root-block-uuids]
  (binding [cli-export-common/*current-repo* repo
            cli-export-common/*current-db* (conn/get-db repo)
            cli-export-common/*content-config* (get-content-config)]
    (let [contents (mapv (fn [id]
                           (cli-export-common/get-blocks-contents repo id)) root-block-uuids)]
      (string/join "\n" (mapv string/trim-newline contents)))))

(defn get-page-content
  "Gets page content for current repo, db and state"
  [page-uuid]
  (binding [cli-export-common/*current-repo* (state/get-current-repo)
            cli-export-common/*current-db* (conn/get-db (state/get-current-repo))
            cli-export-common/*content-config* (get-content-config)]
    (cli-export-common/get-page-content page-uuid)))

;; Utils
(defn <get-all-pages
  [repo]
  (state/<invoke-db-worker :thread-api/export-get-all-pages repo))

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

;; Aliased fns requiring cli-export-common dynamic bindings e.g. cli-export-common/*current-repo*
(def replace-block&page-reference&embed cli-export-common/replace-block&page-reference&embed)
(def replace-Heading-with-Paragraph cli-export-common/replace-Heading-with-Paragraph)

;; Aliased fns
(def priority->string cli-export-common/priority->string)
(def timestamp-to-string cli-export-common/timestamp-to-string)
(def hashtag-value->string cli-export-common/hashtag-value->string)
(def remove-block-ast-pos cli-export-common/remove-block-ast-pos)
(def Properties-block-ast? cli-export-common/Properties-block-ast?)
(def keep-only-level<=n cli-export-common/keep-only-level<=n)
(def remove-emphasis cli-export-common/remove-emphasis)
(def remove-page-ref-brackets cli-export-common/remove-page-ref-brackets)
(def remove-tags cli-export-common/remove-tags)
(def remove-prefix-spaces-in-Plain cli-export-common/remove-prefix-spaces-in-Plain)
(def walk-block-ast cli-export-common/walk-block-ast)