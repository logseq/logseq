(ns frontend.routes
  (:require [frontend.components.home :as home]
            [frontend.components.link :as link]
            [frontend.components.settings :as settings]
            [frontend.components.file :as file]
            ))

(def routes
  {:home home/home
   :links link/links
   :settings settings/settings
   :edit-file file/edit})
