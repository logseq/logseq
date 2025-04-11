(ns capacitor.ionic
  (:require ["@ionic/react" :as ionicReact]
            [logseq.shui.util :as shui-util]))

;(def define-custom-component ionicLoader/defineCustomElements)
(def ^js ionic-react ionicReact)

(defonce ion-button (shui-util/react->rum (.-IonButton ionic-react) true))