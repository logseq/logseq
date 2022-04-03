(ns frontend.handler.config
  (:require [frontend.state :as state]
            [frontend.handler.file :as file-handler]
            [frontend.config :as config]))

(defn set-config!
  [k v]
  (let [path (config/get-config-path)]
    (file-handler/edn-file-set-key-value path k v)))

(defn toggle-ui-show-brackets! []
  (let [show-brackets? (state/show-brackets?)]
    (set-config! :ui/show-brackets? (not show-brackets?))))

(defn toggle-logical-outdenting! []
  (let [logical-outdenting? (state/logical-outdenting?)]
    (set-config! :editor/logical-outdenting? (not logical-outdenting?))))

(defn toggle-ui-enable-tooltip! []
  (let [enable-tooltip? (state/enable-tooltip?)]
    (set-config! :ui/enable-tooltip? (not enable-tooltip?))))
