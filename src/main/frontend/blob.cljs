(ns frontend.blob)

(defn- decode
  "Decodes the data portion of a data url from base64"
  [[media-type data]]
  [media-type (js/atob data)])

(defn- uint8
  "Converts a base64 decoded data string to a Uint8Array"
  [[media-type data]]
  (->> (map #(.charCodeAt %1) data)
       js/Uint8Array.
       (vector media-type)))

(defn- make-blob
  "Creates a JS Blob object from a media type and a Uint8Array"
  [[media-type uint8]]
  (js/Blob. (array uint8) (js-obj "type" media-type)))

(defn blob
  "Converts a data-url into a JS Blob. This is useful for uploading
   image data from JavaScript."
  [data-url]
  {:pre [(string? data-url)]}
  (-> (re-find #"^data:([^;]+);base64,(.*)$" data-url)
      rest
      decode
      uint8
      make-blob))
