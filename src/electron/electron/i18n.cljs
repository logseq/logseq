(ns electron.i18n
  "I18n support for the Electron main process.

  The renderer only syncs the active locale. The main process loads dictionary
  resources locally so it can translate with the same Tongue fallback behavior
  as the renderer without shipping non-serializable translation values over
  IPC."
  (:require [frontend.dicts :as dicts]
            [lambdaisland.glogi :as log]
            [tongue.core :as tongue]))

(def ^:private translate
  (tongue/build-translate (assoc dicts/dicts :tongue/fallback :en)))

(defonce ^:private *locale (atom :en))
(defonce ^:private *on-locale-change (atom nil))

(defn on-locale-change!
  "Register a callback to be invoked when translations are updated"
  [f]
  (reset! *on-locale-change f))

(defn update-locale!
  "Update the active locale from the frontend renderer."
  [language]
  (reset! *locale (or (some-> language keyword) :en))
  (when-let [f @*on-locale-change]
    (f)))

(defn t
  "Translate `k` in the current Electron locale using Tongue fallback rules."
  [& args]
  (try
    (apply translate @*locale args)
    (catch :default e
      (log/error :failed-translation {:error e
                                      :arguments args
                                      :lang @*locale})
      (when (not= @*locale :en)
        (apply translate :en args)))))
