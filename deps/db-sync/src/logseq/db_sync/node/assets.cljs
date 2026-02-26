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

(defn- normalize-bytes [data]
  (cond
    (instance? js/Uint8Array data) data
    (instance? js/ArrayBuffer data) (js/Uint8Array. data)
    :else (js/Uint8Array. data)))

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
                    data (normalize-bytes body)
                    metadata (or (aget opts "httpMetadata") #js {})
                    custom (or (aget opts "customMetadata") #js {})]
                (ensure-dir! dir)
                (p/let [_ (.writeFile (.-promises fs) file-path data)
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
