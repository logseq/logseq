(ns frontend.components.repo
  (:require [rum.core :as rum]
            [frontend.components.widgets :as widgets]
            [frontend.components.sidebar :as sidebar]
            ))

(rum/defc add-repo
  []
  (sidebar/sidebar
   (widgets/add-repo)))
