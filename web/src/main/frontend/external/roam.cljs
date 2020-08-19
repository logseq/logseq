(ns frontend.external.roam
  (:require [frontend.external.protocol :as protocol]
            [cljs-bean.core :as bean]
            [medley.core :as medley]
            [clojure.walk :as walk]))

(defonce uid->uuid (atom {}))

(declare children->text)
(defn child->text
  [{:keys [uid string children] :as child}]
  (when-not (get @uid->uuid uid)
    (swap! uid->uuid assoc uid (medley/random-uuid)))
  (let [children-text (->> (map children->text children)
                           (interpose "\n")
                           (apply str))]
    (if string
      (str string "\n" children-text)
      children-text)))

(defn children->text
  [children]
  (map child->text children))

(defn ->file
  [page-data]
  (let [{:keys [create-time title children edit-time]} page-data]
    {:title title
     :created-at create-time
     :last-modified-at edit-time
     :text (children->text children)}))

(defn ->files
  [edn-data]
  (let [pages-with-data (filter :children edn-data)]
    (map ->file pages-with-data)))

(defrecord Roam []
  protocol/External
  (toMarkdownFiles [this content _config]
    (let [data (bean/->clj (js/JSON.parse content))]
      (->files data))))

;; (:create-email :create-time :title :children :edit-time :edit-email)
(defonce test-roam-json (frontend.db/get-file "same.json"))

(defonce edn-data (bean/->clj (js/JSON.parse test-roam-json)))
