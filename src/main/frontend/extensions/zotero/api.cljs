(ns frontend.extensions.zotero.api
  (:require [cljs-http.client :as http]
            [cljs.core.async :refer [go <!]]
            [camel-snake-kebab.core :as csk]
            [camel-snake-kebab.extras :as cske]
            [frontend.util :as util]))

(def ^:dynamic *debug* true)

(def config {:api-version 3
             :base        "https://api.zotero.org"
             :api-key     "api_key"
             :type        :user
             :type-id     8234867})

;; "/users/475425/collections?v=3"
(defn get*
  ([config api]
   (get* config api nil))
  ([config api query-params]
   (go (let [{:keys [api-version base type type-id api-key]} config
             {:keys [status body] :as response}
             (<! (http/get (str base
                                (if (= type :user)
                                  "/users/"
                                  "/groups/")
                                type-id
                                api)
                           {:with-credentials? false
                            :headers {"Zotero-API-Key" api-key
                                      "Zotero-API-Version" api-version}
                            :query-params (cske/transform-keys csk/->camelCaseString
                                                               query-params)}))]
         (if (http/unexceptional-status? status)
           (let [result (cske/transform-keys csk/->kebab-case-keyword body)]
             (when *debug*
               (def rr result)
               (println result))
             result)
           (throw (ex-info "Http error"
                           {:response response})))))))

(defn item [key]
  (get* config (str "/items/" key)))

(defn notes [key]
  (get* config (str "/items/" key "/children") {:item-type "note"}))

(comment
  (get* config "/collections")
  (get* config "/items" {:limit 3})
  (get* config "/items" {:item-type "journalArticle"})
  (item "JZCIN4K5")
  (item "RFYNAQTN")
  (item "3V6N8ECQ")
  (notes "3V6N8ECQ")
  )
