(ns frontend.handler.export.common
  "Common functions for exporting."
  (:require [frontend.state :as state]
            [frontend.handler.export.common-impl :as common-impl]
            [promesa.core :as p]))

(defn get-content-config []
  {:export-bullet-indentation (state/get-export-bullet-indentation)
   :date-formatter (state/get-date-formatter)})

(defn <export-blocks-as-format
  [repo root-block-uuids-or-page-uuid format-type options]
  (state/<invoke-db-worker :thread-api/export-blocks-as-format
                           repo
                           root-block-uuids-or-page-uuid
                           format-type
                           options
                           (get-content-config)))

(defn <get-blocks-export-data
  [repo root-block-uuids-or-page-uuid opts]
  (state/<invoke-db-worker :thread-api/export-get-blocks-data
                           repo
                           root-block-uuids-or-page-uuid
                           opts
                           (get-content-config)))

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

;; Aliased fns requiring worker-bound resolvers when replacing block/page embeds.
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
