(ns ^:no-doc frontend.version
  (:require [shadow.resource :as rc]))

(defonce version (.-version (js/JSON.parse (rc/inline "package.json"))))
