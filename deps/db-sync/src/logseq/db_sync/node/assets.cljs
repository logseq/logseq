(ns logseq.db-sync.node.assets
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [promesa.core :as p]))

(defn- ensure-dir! [dir]
  (.mkdirSync fs dir #js {:recursive true}))

(defn- meta-path [path]
  (str path ".meta.json"))

(defn- read-meta [path]
  (p/let [content (.readFile (.-promises fs) path "utf8")]
    (js/JSON.parse content)))

(defn- write-meta! [path meta]
  (.writeFile (.-promises fs) path (js/JSON.stringify meta) "utf8"))

(defn- <read-chunks
  [^js reader acc]
  (p/let [result (.read reader)]
    (if (.-done result)
      acc
      (<read-chunks reader (conj acc (.-value result))))))

(defn- <read-all-bytes
  "Drains a web ReadableStream into a single Uint8Array."
  [^js stream]
  (p/let [reader (.getReader stream)
          chunks (<read-chunks reader [])]
    (let [total (reduce + 0 (map #(.-length ^js %) chunks))
          out (js/Uint8Array. total)]
      (reduce (fn [offset ^js chunk]
                (.set out chunk offset)
                (+ offset (.-length chunk)))
              0 chunks)
      out)))

(defn- <normalize-bytes
  "Resolves the put body to bytes. R2's `put` consumes streams, so the local
  bucket drains a ReadableStream to keep stream-driven uploads working."
  [data]
  (if (and data (.-getReader data))
    (<read-all-bytes data)
    (p/resolved
     (cond
       (instance? js/Uint8Array data) data
       (instance? js/ArrayBuffer data) (js/Uint8Array. data)
       :else (js/Uint8Array. data)))))

(defn make-bucket [base-dir]
  (ensure-dir! base-dir)
  #js {:get (fn [key]
              (let [file-path (node-path/join base-dir key)
                    meta-file (meta-path file-path)]
                (p/catch
                 (p/let [buf (.readFile (.-promises fs) file-path)
                         meta (p/catch (read-meta meta-file) (fn [_] #js {}))]
                   #js {:body buf
                        :httpMetadata #js {:contentType (aget meta "contentType")
                                           :contentEncoding (aget meta "contentEncoding")
                                           :cacheControl (aget meta "cacheControl")}
                        :customMetadata (aget meta "customMetadata")})
                 (fn [_] nil))))
       :put (fn [key body opts]
              (let [file-path (node-path/join base-dir key)
                    meta-file (meta-path file-path)
                    dir (node-path/dirname file-path)
                    metadata (or (aget opts "httpMetadata") #js {})
                    custom (or (aget opts "customMetadata") #js {})]
                (ensure-dir! dir)
                (p/let [data (<normalize-bytes body)
                        _ (.writeFile (.-promises fs) file-path data)
                        _ (write-meta! meta-file #js {:contentType (aget metadata "contentType")
                                                      :contentEncoding (aget metadata "contentEncoding")
                                                      :cacheControl (aget metadata "cacheControl")
                                                      :customMetadata custom})]
                  #js {:ok true})))
       :delete (fn [key]
                 (let [file-path (node-path/join base-dir key)
                       meta-file (meta-path file-path)]
                   (p/let [_ (p/catch (.unlink (.-promises fs) file-path) (fn [_] nil))
                           _ (p/catch (.unlink (.-promises fs) meta-file) (fn [_] nil))]
                     #js {:ok true})))})
