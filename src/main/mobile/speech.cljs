(ns mobile.speech
  "Audio to text"
  (:require ["@capacitor-community/speech-recognition" :refer [SpeechRecognition]]
            [cljs-bean.core :as bean]
            [promesa.core :as p]))

(defn available? []
  (p/let [res (.available SpeechRecognition)]
    (.-available res)))

(defn- ensure-permission! []
  (p/do!
   (.checkPermissions SpeechRecognition)
   (.requestPermissions SpeechRecognition)))

;; e.g. ["en-US" "zh-CN"]
(defn supported-languages
  []
  (p/let [langs (.getSupportedLanguages SpeechRecognition)]
    (bean/->clj langs)))

(defn start-listening! [lang]
  (p/do!
   (ensure-permission!)
   (.start SpeechRecognition
           #js {:language lang
                :popup false
                :partialResults true})))

(defn stop-listening! []
  (p/do!
   (.removeAllListeners SpeechRecognition)
   (.stop SpeechRecognition)))

;; Example of attaching listeners
(defn setup-listeners! []
  (.addListener SpeechRecognition "partialResults"
                (fn [data]
                  (js/console.log "Partial:" (.-matches data))))
  (.addListener SpeechRecognition "result"
                (fn [data]
                  (js/console.log "Final:" (.-matches data)))))
