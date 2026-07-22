(ns ^:node-only logseq.melange.bridge.platform.sqlite-cli
  "Primitive better-sqlite3, path, codec, and DataScript storage operations."
  (:require ["better-sqlite3" :as sqlite3]
            ["path" :as node-path]
            [cljs-bean.core :as bean]
            [logseq.melange.bridge.platform.datascript-storage :as datascript-storage]
            [logseq.melange.bridge.platform.node :as platform-node]))

(def sqlite-constructor
  (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn open-sqlite
  [path]
  (new sqlite-constructor path nil))

(defn create-kvs-table!
  [^js sqlite]
  (.exec sqlite "create table if not exists kvs (addr INTEGER primary key, content TEXT, addresses JSON)"))

(defn query
  [^js sqlite sql]
  (-> (.prepare sqlite sql)
      (.all)))

(defn upsert-rows!
  [^js sqlite rows]
  (let [insert (.prepare sqlite "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses")
        insert-many (.transaction sqlite
                                  (fn [values]
                                    (doseq [value values]
                                      (.run ^object insert value))))]
    (insert-many rows)))

(defn load-row
  [^js sqlite address]
  (-> (.prepare sqlite "select content, addresses from kvs where addr = ?")
      (.get address)))

(defn make-row
  [address content addresses]
  #js {:addr address :content content :addresses addresses})

(defn row-content [^js row] (.-content row))
(defn row-addresses [^js row] (.-addresses row))
(defn stringify-json [value] (js/JSON.stringify (bean/->js value)))
(defn parse-json [value] (js->clj (js/JSON.parse value)))
(defn create-storage [store restore] (datascript-storage/create store restore))
(defn absolute? [path] (node-path/isAbsolute path))
(defn dirname [path] (node-path/dirname path))
(defn basename [path] (node-path/basename path))
(defn join [left right] (node-path/join left right))
(defn original-pwd [] js/process.env.ORIGINAL_PWD)
(defn default-graphs-dir [] (platform-node/get-default-graphs-dir))
(defn expand-home [path] (platform-node/expand-home path))
