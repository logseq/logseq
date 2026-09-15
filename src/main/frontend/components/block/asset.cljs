(ns frontend.components.block.asset
  "Helpers for rendering asset links in block content.

  Asset links can point to local files, graph-relative files, remote URLs, or
  protocol URLs. These helpers normalize the display-facing parts of an asset
  without assuming that the URL itself contains a file extension."
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.asset :as db-asset]))

(defn- asset-type->keyword
  "Coerces `asset-type` from an asset entity into a lowercase keyword.

  Returns `nil` when `asset-type` is absent or has an unsupported type."
  [asset-type]
  (cond
    (keyword? asset-type) asset-type
    (string? asset-type) (keyword (string/lower-case asset-type))))

(defn link-ext
  "Resolves the extension keyword for an asset link.

  `src` is the resolved render URL, `href` is the original asset link, and
  `asset-block` is the asset entity. The URL-derived extension has priority;
  `:logseq.property.asset/type` is used when neither URL exposes an extension."
  [src href asset-block]
  (or (some-> (util/get-file-ext src) keyword)
      (some-> (util/get-file-ext href) keyword)
      (asset-type->keyword (:logseq.property.asset/type asset-block))))

(def ^:private display-title-max-len 48)

(defn url-like?
  [s]
  (and (string? s)
       (or (string/starts-with? s "http://")
           (string/starts-with? s "https://")
           (string/starts-with? s "www."))))

(defn- truncate-display-title
  [s]
  (if (and (string? s) (> (count s) display-title-max-len))
    (str (subs s 0 (- display-title-max-len 3)) "...")
    (str s)))

(defn- url-stem-or-url
  [url]
  (let [stem (when (string? url) (db-asset/asset-name->title url))]
    (if (or (string/blank? stem) (= stem url))
      url
      stem)))

(defn display-url-title
  "Readable label for a remote URL. Uses the file stem so Amazon poster
  hashes stay on one line instead of wrapping into fragments."
  [url]
  (truncate-display-title (url-stem-or-url url)))

(defn- asset-title
  "Full human title or URL stem. Used for download/open names; UI display
  may truncate separately."
  [asset-block]
  (let [title (:block/title asset-block)
        external-url (:logseq.property.asset/external-url asset-block)]
    (cond
      (and (string? title)
           (not (string/blank? title))
           (not (url-like? title)))
      title

      (and (string? external-url)
           (not (string/blank? external-url)))
      (url-stem-or-url external-url)

      (url-like? title)
      (url-stem-or-url title)

      :else
      (or title ""))))

(defn display-asset-title
  "Visible asset title. Never returns a raw URL — those wrap with
  `word-break: break-all` and look like garbled filename fragments."
  [asset-block]
  (truncate-display-title (asset-title asset-block)))

(defn link-file-name
  "Builds the download/open file name for `asset-block` using resolved extension `ext`."
  [asset-block ext]
  (let [title (asset-title asset-block)
        ext-name (when ext (name ext))]
    (cond-> title
      (and ext-name
           (not (string/ends-with? (string/lower-case (or title ""))
                                   (str "." ext-name))))
      (str "." ext-name))))

(defn asset-file-name
  [asset-block]
  (str (:block/uuid asset-block) "." (:logseq.property.asset/type asset-block)))

(defn asset-relative-path
  [asset-block]
  (str common-config/local-assets-dir "/" (asset-file-name asset-block)))

(defn show-missing-file-warning?
  "Returns true when an asset points to a local graph file that should already
  exist but is absent."
  [asset-block file-exists?]
  (let [external-url (:logseq.property.asset/external-url asset-block)
        remote-metadata (:logseq.property.asset/remote-metadata asset-block)]
    (and (false? file-exists?)
         (string/blank? external-url)
         (nil? remote-metadata))))

(defn show-image-placeholder?
  [asset-block file-ready? gallery-image?]
  (let [asset-type (some-> (:logseq.property.asset/type asset-block) keyword)]
    (and (not file-ready?)
         (not gallery-image?)
         (contains? (common-config/img-formats) asset-type))))

(def read-mode-title-attrs
  {:class "asset-title-slot text-xs opacity-60 mt-1 cursor-text"
   :style {:min-height 24}})
