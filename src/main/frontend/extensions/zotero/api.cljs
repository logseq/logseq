(ns frontend.extensions.zotero.api
  (:require [camel-snake-kebab.core :as csk]
            [camel-snake-kebab.extras :as cske]
            [cljs-http.client :as http]
            [cljs.core.async
             :refer [<! >! alt! chan close! go go-loop timeout]]
            [clojure.string :as str]
            [frontend.util :as util]
            [frontend.extensions.zotero.setting :as setting]))

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

(defn parse-start [headers next-or-prev]
  (let [include-text (case next-or-prev
                       :next "rel=\"next\""
                       :prev "rel=\"prev\"")
        links
        (str/split
         (:link (cske/transform-keys csk/->kebab-case-keyword headers)) ",")
        next-link   (->> links
                         (filter (fn [l] (str/includes? l include-text)))
                         first)]
    (when next-link
      (let [start    (str/index-of next-link "<")
            end      (str/last-index-of next-link ">;")
            next-url (subs next-link (inc start) end)]
        (or
         (->
          next-url
          http/parse-url
          :query-params
          :start)
         "0")))))

(defn results-count [headers]
  (-> (cske/transform-keys csk/->kebab-case-keyword headers)
      :total-results
      util/safe-parse-int))

;; "/users/475425/collections?v=3"
(defn get*
  ([config api]
   (get* config api nil))
  ([config api query-params]
   (go (let [{:keys [api-version base type type-id api-key timeout]} config
             {:keys [success body headers] :as response}
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
           (let [result     (cske/transform-keys csk/->kebab-case-keyword body)
                 next-start (parse-start headers :next)
                 prev-start (parse-start headers :prev)
                 results-count (results-count headers)]
             (cond-> {:result result}
               next-start
               (assoc :next next-start)
               prev-start
               (assoc :prev prev-start)
               results-count
               (assoc :count results-count)))
           response)))))

(defn item [key]
  (:result (get* (config) (str "/items/" key))))

(defn all-top-items-count []
  (go
    (:count
     (<! (get* (config) (str "/items/top")
               {:limit     1
                :item-type "-attachment"})))))

(defn all-top-items []
  (go-loop [start "0"
            result-acc []]
    (let [{:keys [success next result]}
          (<! (get* (config) (str "/items/top")
                    {:item-type "-attachment"
                     :start     start}))]
      (cond
        (false? success)
        result-acc

        next
        (recur next (into [] (concat result-acc result)))

        :else
        (into [] (concat result-acc result))))))

(defn query-top-items
  "Query all top level items except attachments"
  ([term]
   (query-top-items term "0"))
  ([term start]
   (get* (config) (str "/items/top")
         {:qmode     "everything"
          :q         term
          :limit     10
          :item-type "-attachment"
          :start     start})))

(defn all-children-items [key type]
  (go-loop [start "0"
            notes-acc []]
    (let [{:keys [success next result]}
          (<! (get* (config) (str "/items/" key "/children")
                    {:item-type type :start start}))]
      (cond
        (false? success)
        notes-acc

        next
        (recur next (into [] (concat notes-acc result)))

        :else
        (into [] (concat notes-acc result))))))

(defn notes [key]
  (all-children-items key "note"))

(defn attachments [key]
  (all-children-items key "attachment"))
