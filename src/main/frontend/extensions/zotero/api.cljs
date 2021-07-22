(ns frontend.extensions.zotero.api
  (:require [camel-snake-kebab.core :as csk]
            [camel-snake-kebab.extras :as cske]
            [cljs-http.client :as http]
            [cljs.core.async
             :refer [<! >! alt! chan close! go go-loop timeout]]
            [frontend.extensions.zotero.setting :as setting]))

(def ^:dynamic *debug* true)

(defn config []
  {:api-version 3
   :base        "https://api.zotero.org"
   :timeout     150000
   :api-key     (setting/api-key)
   :type        (setting/setting :type)
   :type-id     (setting/setting :type-id)})

;; taken from https://github.com/metosin/metosin-common/blob/master/src/cljc/metosin/core/async/debounce.cljc
(defn debounce
  "Creates a channel which will change put a new value to the output channel
   after timeout has passed. Each value change resets the timeout. If value
   changes more frequently only the latest value is put out.
   When input channel closes, the output channel is closed."
  [in ms]
  (let [out (chan)]
    (go-loop [last-val nil]
      (let [val   (if (nil? last-val) (<! in) last-val)
            timer (timeout ms)]
        (alt!
          in ([v] (if v
                    (recur v)
                    (close! out)))
          timer ([_] (do (>! out val) (recur nil))))))
    out))

;; "/users/475425/collections?v=3"
(defn get*
  ([config api]
   (get* config api nil))
  ([config api query-params]
   (go (let [{:keys [api-version base type type-id api-key timeout]} config
             {:keys [success body] :as response}
             (<! (http/get (str base
                                (if (= type :user)
                                  "/users/"
                                  "/groups/")
                                type-id
                                api)
                           {:timeout           timeout
                            :with-credentials? false
                            :headers           {"Zotero-API-Key"     api-key
                                                "Zotero-API-Version" api-version}
                            :query-params      (cske/transform-keys csk/->camelCaseString
                                                                    query-params)}))]
         (if success
           (let [result (cske/transform-keys csk/->kebab-case-keyword body)]
             (when *debug*
               (def rr result)
               (println result))
             result)
           response)))))

(defn item [key]
  (get* (config) (str "/items/" key)))

(defn query-items [type term]
  (get* (config) (str "/items")
        {:qmode     "everything"
         :q         term
         :item-type type}))

(defn notes [key]
  (get* (config) (str "/items/" key "/children") {:item-type "note"}))

(defn attachments [key]
  (get* (config) (str "/items/" key "/children") {:item-type "attachment"}))

(comment
  (get* (config) "/collections")
  (get* (config) "/items")
  (get* (config) "/items" {:item-type "journalArticle"})
  (item "JZCIN4K5")
  (item "RFYNAQTN")
  (item "3V6N8ECQ")
  (notes "3V6N8ECQ")
  (attachments "3V6N8ECQ"))
