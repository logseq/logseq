(ns frontend.components.block.asset
  "Helpers for rendering asset links in block content.

  Asset links can point to local files, graph-relative files, remote URLs, or
  protocol URLs. These helpers normalize the display-facing parts of an asset
  without assuming that the URL itself contains a file extension."
  (:require [clojure.string :as string]
            [frontend.util :as util]))

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

(defn link-file-name
  "Builds the display file name for `asset-block` using resolved extension `ext`."
  [asset-block ext]
  (cond-> (str (:block/title asset-block))
    ext (str "." (name ext))))
