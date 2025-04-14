(ns capacitor.ionic
  (:require ["@ionic/react" :as ionicReact]
            ["@capacitor/camera" :as ionicCamera]
            [logseq.shui.icon.v2 :as shui-icon]
            [logseq.shui.util :as shui-util]))

;(def define-custom-component ionicLoader/defineCustomElements)
(def ^js ionic-react ionicReact)
(def ^js ionic-camera (.-Camera ionicCamera))
(def ^js ionic-camera-result-type (.-CameraResultType ionicCamera))

(def tabler-icon shui-icon/root)
(defonce ion-page (shui-util/react->rum (.-IonPage ionic-react) true))
(defonce ion-content (shui-util/react->rum (.-IonContent ionic-react) true))
(defonce ion-button (shui-util/react->rum (.-IonButton ionic-react) true))
(defonce ion-alert (shui-util/react->rum (.-IonAlert ionic-react) true))
(defonce ion-icon (shui-util/react->rum (.-IonIcon ionic-react) true))
(defonce ion-badge (shui-util/react->rum (.-IonBadge ionic-react) true))
(defonce ion-tabs (shui-util/react->rum (.-IonTabs ionic-react) true))
(defonce ion-tab-bar (shui-util/react->rum (.-IonTabBar ionic-react) false))
(defonce ion-tab-button (shui-util/react->rum (.-IonTabButton ionic-react) false))
(defonce ion-label (shui-util/react->rum (.-IonLabel ionic-react) false))
