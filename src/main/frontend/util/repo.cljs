(ns frontend.util.repo
  "Repository name formatting helpers for renderer code."
  (:require [frontend.config :as config]
            [frontend.mobile.util :as mobile-util]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [logseq.common.util :as common-util]
            [logseq.graph-parser.text :as text]))

(defn get-repo-name
  [repo-url]
  (cond
    (mobile-util/native-platform?)
    (text-util/get-graph-name-from-path repo-url)

    :else
    (do
      (assert (string? repo-url) (str "repo-url is not a string: " (type repo-url)))
      repo-url)))

(defn get-short-repo-name
  "repo-name: from get-repo-name. Dir/Name => Name"
  [repo-name]
  (let [repo-name' (cond
                     (util/electron?)
                     (text/get-file-basename repo-name)

                     (mobile-util/native-platform?)
                     (common-util/safe-decode-uri-component (text/get-file-basename repo-name))

                     :else
                     repo-name)]
    (if (config/db-based-graph? repo-name')
      (config/db-graph-name repo-name')
      repo-name')))
