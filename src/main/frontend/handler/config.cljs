(ns frontend.handler.config
  "Fns for setting repo config"
  (:require [frontend.state :as state]
            [frontend.handler.file :as file-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.config :as config]
            [frontend.db :as db]
            [borkdude.rewrite-edn :as rewrite]
            [lambdaisland.glogi :as log]))

(defn parse-repo-config
  "Parse repo configuration file content"
  [content]
  (try
    (rewrite/parse-string content)
    (catch :default e
      (log/error :parse/config-failed e)
      (state/pub-event! [:backup/broken-config (state/get-current-repo) content])
      (rewrite/parse-string config/config-default-content))))

(defn- repo-config-set-key-value
  [path k v]
  (when-let [repo (state/get-current-repo)]
    (when-let [content (db/get-file path)]
      (repo-config-handler/read-repo-config repo content)
      (let [result (parse-repo-config content)
            ks (if (vector? k) k [k])
            new-result (rewrite/assoc-in result ks v)
            new-content (str new-result)]
        (file-handler/set-file-content! repo path new-content) nil))))

(defn set-config!
  ([k v]
   (set-config! (state/get-current-repo) k v))
  ([repo k v]
   (let [path (config/get-repo-config-path repo)]
     (repo-config-set-key-value path k v))))

(defn toggle-ui-show-brackets! []
  (let [show-brackets? (state/show-brackets?)]
    (set-config! :ui/show-brackets? (not show-brackets?))))

(defn toggle-logical-outdenting! []
  (let [logical-outdenting? (state/logical-outdenting?)]
    (set-config! :editor/logical-outdenting? (not logical-outdenting?))))

(defn toggle-show-full-blocks! []
  (let [show-full-blocks? (state/show-full-blocks?)]
    (set-config! :ui/show-full-blocks? (not show-full-blocks?))))

(defn toggle-ui-enable-tooltip! []
  (let [enable-tooltip? (state/enable-tooltip?)]
    (set-config! :ui/enable-tooltip? (not enable-tooltip?))))

(defn toggle-preferred-pasting-file! []
  (let [preferred-pasting-file? (state/preferred-pasting-file?)]
    (set-config! :editor/preferred-pasting-file? (not preferred-pasting-file?))))
