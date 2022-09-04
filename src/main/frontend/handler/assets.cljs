(ns frontend.handler.assets
  (:require [frontend.state :as state]
            [medley.core :as medley]
            [frontend.util :as util]
            [frontend.config :as config]
            [logseq.graph-parser.config :as gp-config]
            [clojure.string :as string]))

(defn alias-enabled?
  []
  (and (util/electron?)
       (:assets/alias-enabled? @state/state)))

(defn get-alias-dirs
  []
  (:assets/alias-dirs @state/state))

(defn get-alias-by-dir
  [dir]
  (when-let [alias-dirs (and (alias-enabled?) (seq (get-alias-dirs)))]
    (medley/find-first #(= dir (:dir (second %1)))
                       (medley/indexed alias-dirs))))

(defn get-alias-by-name
  [name]
  (when-let [alias-dirs (and (alias-enabled?) (seq (get-alias-dirs)))]
    (medley/find-first #(= name (:name (second %1)))
                       (medley/indexed alias-dirs))))

(defn resolve-asset-path-url
  [repo full-path]
  (let [full-path  (string/replace full-path #"^[.\/\\]+" "")
        full-path' (string/replace full-path (re-pattern (str "^" gp-config/local-assets-dir "[\\/\\\\]+")) "")
        full-path  (if-not (string/starts-with? full-path gp-config/local-assets-dir)
                     (util/node-path.join gp-config/local-assets-dir full-path)
                     full-path)
        graph-root (config/get-repo-dir repo)]

    (if-let [alias (and (alias-enabled?)
                        (string/starts-with? full-path' "@")
                        (and (seq (get-alias-dirs))
                             (second (get-alias-by-name (second (re-find #"^@([^\/]+)" full-path'))))))]
      (str "assets://" (string/replace full-path' (str "@" (:name alias)) (:dir alias)))
      ;; TODO: bfs
      (str "file://" (util/node-path.join graph-root full-path)))))


(defn normalize-asset-resource-url
  ;; try to convert resource file to url asset link
  [full-path]
  (let [_filename      (util/node-path.basename full-path)
        protocol-link? (->> #{:file :http :https :assets}
                            (some #(string/starts-with? full-path (str (name %) ":/"))))
        url            (cond
                         protocol-link?
                         full-path

                         (util/absolute-path? full-path)
                         (str "file://" full-path)

                         :else
                         (resolve-asset-path-url (state/get-current-repo) full-path))]
    url))


(comment
 (normalize-asset-resource-url "https://x.com/a.pdf")
 (normalize-asset-resource-url "./a/b.pdf")
 (normalize-asset-resource-url "assets/a/b.pdf")
 (normalize-asset-resource-url "@图书/a/b.pdf"))