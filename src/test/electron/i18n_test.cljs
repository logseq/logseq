(ns electron.i18n-test
  (:require [cljs.test :refer [deftest is]]
            [electron.i18n :as i18n]
            [frontend.dicts :as dicts]
            [tongue.core :as tongue]))

(deftest first-use-electron-locales-preserve-fallback-and-switching
  (let [dictionaries (into {} (map (fn [[locale dictionary]]
                                    [locale (dicts/realize-dict dictionary)]))
                           dicts/dicts)
        full (tongue/build-translate (assoc dictionaries :tongue/fallback :en))]
    (try
      (doseq [locale [:fr :zh-CN :de :en :xx :fr]]
        (i18n/update-locale! locale)
        (doseq [key [:ui/close :view/all :electron/new-window :no.such/key]]
          (is (= (str (full locale key)) (str (i18n/t key))))))
      (finally
        (i18n/update-locale! :en)))))
