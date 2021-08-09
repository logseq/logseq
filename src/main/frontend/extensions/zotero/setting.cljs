(ns frontend.extensions.zotero.setting
  (:require [clojure.string :as str]
            [frontend.handler.config :as config-handler]
            [frontend.state :as state]
            [frontend.storage :as storage]))

(def default-settings
  {:type                   :user
   :prefer-citekey?        true
   :include-attachments?   true
   :attachments-block-text "[[Attachments]]"
   :include-notes?         true
   :notes-block-text       "[[Notes]]"
   :zotero-data-directory  ""
   :extra-tags             ""
   :page-insert-prefix     "@"})

(defn api-key []
  (storage/get :zotero/api-key))

(defn set-api-key [key]
  (storage/set :zotero/api-key key))

(defn sub-zotero-config
  []
  (:zotero/settings (get (state/sub-config) (state/get-current-repo))))

(defn set-setting! [k v]
  (let [new-settings (assoc (sub-zotero-config) k v)]
    (config-handler/set-config! :zotero/settings new-settings)))

(defn setting [k]
  (get (sub-zotero-config)
       k
       (get default-settings k)))

(defn valid? []
  (and
   (not (str/blank? (api-key)))
   (not (str/blank? (setting :type-id)))))
