(ns frontend.components.settings-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]))

(deftest theme-preview-assets-resolve-relative-to-stylesheet-test
  (let [source (.toString
                (fs/readFileSync
                 (node-path/join (.cwd js/process)
                                 "src/main/frontend/components/settings.css")
                 "utf8"))]
    (doseq [theme ["light" "dark" "system"]]
      (is (string/includes? source (str "url('../img/" theme "-theme.png')")))
      (is (not (string/includes? source (str "url('/static/img/" theme "-theme.png')")))))))
