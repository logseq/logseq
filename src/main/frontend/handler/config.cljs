(ns frontend.handler.config
  (:require [frontend.state :as state]
            [frontend.handler.repo :as repo-handler]))

(defn toggle-ui-show-brackets! []
  (let [show-brackets? (state/show-brackets?)]
    (repo-handler/set-config! :ui/show-brackets? (not show-brackets?))))
