(ns frontend.extensions.zotero
  (:require [clojure.edn :refer [read-string]]
            [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(defn open-button [full-path]
  (if (string/ends-with? (string/lower-case full-path) "pdf")
    (ui/button
     (t :ui/open)
     :small? true
     :on-click
     (fn [e]
       (when-let [current (pdf-assets/inflate-asset full-path)]
         (util/stop e)
         (state/set-state! :pdf/current current))))
    (ui/button
     (t :ui/open)
     :small? true
     :target "_blank"
     :href full-path)))

(defn sub-zotero-config
  []
  (:zotero/settings-v2 (state/sub-config)))

(def default-settings
  {:type                                    :user
   :prefer-citekey?                         true
   :include-attachments?                    true
   :include-notes?                          true
   :overwrite-mode?                         false
   :zotero-data-directory                   ""
   :zotero-linked-attachment-base-directory ""
   :extra-tags                              ""
   :page-insert-prefix                      "@"})

(defn default-setting
  [k]
  (case k
    :attachments-block-text (t :zotero/attachments)
    :notes-block-text (t :zotero/notes)
    (get default-settings k)))

(defn all-profiles []
  (let [profiles (-> (sub-zotero-config) keys set)
        default #{"default"}]
    (if (empty? profiles) default profiles)))

(defn get-profile []
  (let [profile (storage/get :zotero/setting-profile)]
    (if (and profile (contains? (all-profiles) profile))
      profile
      (first (all-profiles)))))

(defn setting [k]
  (let [profile (get-profile)]
    (-> (sub-zotero-config)
        (get profile)
        (get k (default-setting k)))))

(defn zotero-full-path
  [item-key filename]
  (str "file://"
       (util/node-path.join
        (setting :zotero-data-directory)
        "storage"
        item-key
        filename)))

(rum/defc zotero-imported-file
  [item-key filename]
  (if (string/blank? (setting :zotero-data-directory))
    [:p.warning (t :zotero.imported-file/warning)]
    (let [filename (read-string filename)
          full-path (zotero-full-path item-key filename)]
      (open-button full-path))))

(rum/defc zotero-linked-file
  [path]
  (if (string/blank? (setting :zotero-linked-attachment-base-directory))
    [:p.warning (t :zotero.linked-file/warning)]
    (let [path (read-string path)
          full-path
          (str "file://"
               (util/node-path.join
                (setting :zotero-linked-attachment-base-directory)
                (string/replace-first path "attachments:" "")))]
      (open-button full-path))))
