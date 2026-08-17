(ns electron.spell-check
  (:require [clojure.string :as string]))

(def hunspell-dictionary-download-url
  "https://redirector.gvt1.com/edgedl/chrome/dict/")

(defn session-spellcheck-enabled?
  [value]
  (not= false value))

(defn window-web-preferences
  [config-value]
  {:spellcheck (session-spellcheck-enabled? config-value)})

(defn- normalize-language
  [language]
  (when (string? language)
    (let [normalized (string/replace language "_" "-")]
      (when (seq normalized)
        normalized))))

(defn- language-prefix
  [language]
  (some-> language normalize-language (string/split #"-") first))

(defn hunspell-languages
  "Choose hunspell language codes that Electron will accept.
   Prefer already-configured languages, then the OS/app locale, then en-US."
  [current-languages available-languages fallback-language]
  (let [available (filterv seq available-languages)
        available-set (set available)
        current (filterv available-set current-languages)
        fallback (normalize-language fallback-language)
        prefixed (when-let [prefix (language-prefix fallback)]
                   (filterv #(= prefix (language-prefix %)) available))]
    (cond
      (seq current) current
      (and fallback (contains? available-set fallback)) [fallback]
      (seq prefixed) [(first prefixed)]
      (contains? available-set "en-US") ["en-US"]
      (seq available) [(first available)]
      :else [])))

(defn- spellchecker-languages
  [^js session]
  (if (fn? (.-getSpellCheckerLanguages session))
    (vec (js->clj (.getSpellCheckerLanguages session)))
    []))

(defn- available-spellchecker-languages
  [^js session]
  (vec (js->clj (or (.-availableSpellCheckerLanguages session) #js []))))

(defn- hunspell-platform?
  []
  (contains? #{"linux" "win32"} (.-platform js/process)))

(defn- linux-platform?
  []
  (= "linux" (.-platform js/process)))

(defn- app-locale
  []
  (try
    (some-> (js/require "electron") .-app .getLocale)
    (catch :default _
      nil)))

(defn apply-session-spellcheck!
  "Apply spellcheck to an Electron session.

  On hunspell platforms (Linux/Windows), enabling also restores a dictionary
  download URL and language list so a persisted disabled or empty-dictionary
  session can recover. Linux additionally resets languages to work around
  Electron 40+ failing to initialize cached .bdic files."
  ([session enabled?]
   (apply-session-spellcheck! session enabled? nil))
  ([^js session enabled? {:keys [hunspell? reinit-hunspell? fallback-language dictionary-download-url]
                          :or {hunspell? false
                               reinit-hunspell? false
                               dictionary-download-url hunspell-dictionary-download-url}}]
   (when session
     (when (and enabled? hunspell?)
       (when (fn? (.-setSpellCheckerDictionaryDownloadURL session))
         (.setSpellCheckerDictionaryDownloadURL session dictionary-download-url))
       (let [current (spellchecker-languages session)
             available (available-spellchecker-languages session)
             languages (hunspell-languages current available fallback-language)]
         (when (and (fn? (.-setSpellCheckerLanguages session)) (seq languages))
           (if reinit-hunspell?
             (do (.setSpellCheckerLanguages session #js [])
                 (.setSpellCheckerLanguages session (clj->js languages)))
             (when (empty? current)
               (.setSpellCheckerLanguages session (clj->js languages)))))))
     (.setSpellCheckerEnabled session enabled?))
   session))

(defn apply-window-spellcheck!
  ([win enabled?]
   (apply-window-spellcheck! win enabled? nil))
  ([^js win enabled? opts]
   (when-let [^js session (some-> win .-webContents .-session)]
     (apply-session-spellcheck!
      session
      enabled?
      (merge {:hunspell? (hunspell-platform?)
              :reinit-hunspell? (linux-platform?)
              :fallback-language (app-locale)}
             opts)))
   win))
