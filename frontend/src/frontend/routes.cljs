(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.settings :as settings]
            [frontend.components.file :as file]
            ))

(def routes
  {:home home/home
   :settings settings/settings
   :edit-file file/edit})
