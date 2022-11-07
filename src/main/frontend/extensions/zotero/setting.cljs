(ns frontend.extensions.zotero.setting
  (:require [clojure.string :as str]
            [promesa.core :as p]
            [frontend.handler.config :as config-handler]
            [frontend.state :as state]
            [frontend.storage :as storage]))

(def default-settings
  {:type                                    :user
   :prefer-citekey?                         true
   :include-attachments?                    true
   :attachments-block-text                  "[[Attachments]]"
   :include-notes?                          true
   :overwrite-mode?                         false
   :notes-block-text                        "[[Notes]]"
   :zotero-data-directory                   ""
   :zotero-linked-attachment-base-directory ""
   :extra-tags                              ""
   :page-insert-prefix                      "@"})

(defn sub-zotero-config
  []
  (:zotero/settings-v2 (state/sub-config)))

(defn all-profiles []
  (let [profiles (-> (sub-zotero-config) keys set)
        default #{"default"}]
    (if (empty? profiles) default profiles)))

(defn profile []
  (let [profile (storage/get :zotero/setting-profile)]
    (if (and profile (contains? (all-profiles) profile))
      profile
      (first (all-profiles)))))

(defn api-key []
  (get (storage/get :zotero/api-key-v2) (profile)))

(defn set-api-key [key]
  (let [profile (profile)
        api-key-map (storage/get :zotero/api-key-v2)]
    (storage/set :zotero/api-key-v2 (assoc api-key-map profile key))))

(defn add-profile [profile]
  (let [settings (assoc (sub-zotero-config) profile {})]
    (config-handler/set-config! :zotero/settings-v2 settings)))

(defn set-profile [profile]
  (storage/set :zotero/setting-profile profile)
  (p/let [has-item? (p/then (js/setTimeout 1000) ;; Wait 1000 ms for profile to be applied on config
                            #(contains? (all-profiles) profile))]
    (when-not has-item?
      (add-profile profile))))

(defn remove-profile [profile]
  (let [settings (dissoc (sub-zotero-config) profile)]
    (config-handler/set-config! :zotero/settings-v2 settings)))

(defn set-setting! [k v]
  (let [profile (profile)
        new-settings (update (sub-zotero-config)
                             profile
                             #(assoc % k v))]
    (config-handler/set-config! :zotero/settings-v2 new-settings)))

(defn setting [k]
  (let [profile (profile)]
    (-> (sub-zotero-config)
        (get profile)
        (get k (get default-settings k)))))

(defn valid? []
  (and
   (not (str/blank? (api-key)))
   (not (str/blank? (setting :type-id)))))
