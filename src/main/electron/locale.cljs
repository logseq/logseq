(ns electron.locale
  "Electron locale synchronization helpers."
  (:require [electron.ipc :as ipc]))

(defn push-locale!
  [language]
  (ipc/ipc :updateElectronLocale (or (some-> language keyword) :en)))
