(ns frontend.components.lazy-editor
  "SSR stub for code editor."
  (:require [rum.core :as rum]))

(rum/defc editor
  [_config _id _attr code _options]
  [:pre.code-editor
   {:style {:white-space "pre-wrap"}}
   (or code "")])
