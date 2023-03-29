(ns ^:no-doc frontend.handler.assets
  (:require [frontend.state :as state]
            [medley.core :as medley]
            [frontend.util :as util]
            [frontend.config :as config]
            [frontend.mobile.util :as mobile-util]
            [logseq.graph-parser.config :as gp-config]
            [clojure.string :as string]
            [logseq.common.path :as path]))

(defn alias-enabled?
  []
  (and (util/electron?)
       (:assets/alias-enabled? @state/state)))

(defn clean-path-prefix
  [path]
  (when (string? path)
    (string/replace-first path #"^[.\/\\]*(assets)[\/\\]+" "")))

(defn check-alias-path?
  [path]
  (and (string? path)
       (some-> path
               (clean-path-prefix)
               (string/starts-with? "@"))))

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

(defn convert-platform-protocol
  [full-path]

  (cond-> full-path
    (and (string? full-path)
         (mobile-util/native-platform?))
    (string/replace-first
     #"^(file://|assets://)" gp-config/capacitor-protocol-with-prefix)))

(defn resolve-asset-real-path-url
  [repo full-path]
  (when-let [full-path (and (string? full-path)
                            (string/replace full-path #"^[.\/\\]+" ""))]
    (if config/publishing?
      (str "./" full-path)
      (let [ret (let [full-path      (if-not (string/starts-with? full-path gp-config/local-assets-dir)
                                       (util/node-path.join gp-config/local-assets-dir full-path)
                                       full-path)
                      encoded-chars? (boolean (re-find #"(?i)%[0-9a-f]{2}" full-path))
                      full-path      (if encoded-chars? full-path (js/encodeURI full-path))
                      graph-root     (config/get-repo-dir repo)
                      has-schema?    (string/starts-with? graph-root "file:")]

                  (if-let [[full-path' alias]
                           (and (alias-enabled?)
                                (let [full-path' (string/replace full-path (re-pattern (str "^" gp-config/local-assets-dir "[\\/\\\\]+")) "")]
                                  (and
                                   (string/starts-with? full-path' "@")
                                   (some->> (and (seq (get-alias-dirs))
                                                 (second (get-alias-by-name (second (re-find #"^@([^\/]+)" full-path')))))
                                            (vector full-path')))))]

                    (str "assets://" (string/replace full-path' (str "@" (:name alias)) (:dir alias)))

                    (str (if has-schema? "" "file://")
                         (util/node-path.join graph-root full-path))))]
        (convert-platform-protocol ret)))))

(defn normalize-asset-resource-url
  ;; try to convert resource file to url asset link
  [full-path]
  (let [_filename      (util/node-path.basename full-path)
        protocol-link? (->> #{:file :http :https :assets}
                            (some #(string/starts-with? full-path (str (name %) ":/"))))]

    (cond
      protocol-link?
      full-path

      (path/absolute? full-path)
      (str "file://" full-path)

      :else
      (resolve-asset-real-path-url (state/get-current-repo) full-path))))

(defn get-matched-alias-by-ext
  [ext]
  (when-let [ext (and (alias-enabled?)
                      (string? ext)
                      (not (string/blank? ext))
                      (util/safe-lower-case ext))]

    (let [alias (medley/find-first
                 (fn [{:keys [exts]}]
                   (some #(string/ends-with? ext %) exts))
                 (get-alias-dirs))]
      alias)))

(comment
 (normalize-asset-resource-url "https://x.com/a.pdf")
 (normalize-asset-resource-url "./a/b.pdf")
 (normalize-asset-resource-url "assets/a/b.pdf")
 (normalize-asset-resource-url "@图书/a/b.pdf"))
