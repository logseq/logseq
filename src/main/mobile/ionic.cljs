(ns mobile.ionic
  "Ionic ui"
  (:refer-clojure :exclude [list])
  (:require [logseq.shui.icon.v2 :as shui-icon]
            [logseq.shui.util :as shui-util]))

;(def define-custom-component ionicLoader/defineCustomElements)
(def ^js ionic-react js/window.LSIonic)

(def tabler-icon shui-icon/root)

(defonce app (shui-util/react->rum (.-IonApp ionic-react) true))
(defonce page (shui-util/react->rum (.-IonPage ionic-react) true))

(defonce content (shui-util/react->rum (.-IonContent ionic-react) true))
(defonce header (shui-util/react->rum (.-IonHeader ionic-react) true))
(defonce buttons (shui-util/react->rum (.-IonButtons ionic-react) true))
(defonce toolbar (shui-util/react->rum (.-IonToolbar ionic-react) true))
(defonce title (shui-util/react->rum (.-IonTitle ionic-react) true))
(defonce button (shui-util/react->rum (.-IonButton ionic-react) true))
(defonce alert (shui-util/react->rum (.-IonAlert ionic-react) true))
(defonce tabs (shui-util/react->rum (.-IonTabs ionic-react) false))
(defonce tab (shui-util/react->rum (.-IonTab ionic-react) false))
(defonce tab-bar (shui-util/react->rum (.-IonTabBar ionic-react) false))
(defonce tab-button (shui-util/react->rum (.-IonTabButton ionic-react) false))
(defonce modal (shui-util/react->rum (.-IonModal ionic-react) false))
(defonce list (shui-util/react->rum (.-IonList ionic-react) false))
(defonce item (shui-util/react->rum (.-IonItem ionic-react) false))

(defonce action-sheet (shui-util/react->rum (.-IonActionSheet ionic-react) false))
(defonce searchbar (shui-util/react->rum (.-IonSearchbar ionic-react) false))

(comment
  (def ^js camera (.-Camera ionicCamera))
  (def ^js camera-result-type (.-CameraResultType ionicCamera))
  (def ^js useIonViewDidEnter (.-useIonViewDidEnter ionic-react))
  (def ^js useIonViewDidLeave (.-useIonViewDidLeave ionic-react))
  (def ^js useIonViewWillEnter (.-useIonViewWillEnter ionic-react))
  (def ^js useIonViewWillLeave (.-useIonViewWillLeave ionic-react))
  (defonce nav (shui-util/react->rum (.-IonNav ionic-react) true))
  (defonce nav-link (shui-util/react->rum (.-IonNavLink ionic-react) true))
  (defonce back-button (shui-util/react->rum (.-IonBackButton ionic-react) false))
  (defonce datetime (shui-util/react->rum (.-IonDatetime ionic-react) false))
  (defonce datetime-button (shui-util/react->rum (.-IonDatetimeButton ionic-react) false))
  (defonce menu (shui-util/react->rum (.-IonMenu ionic-react) false))
  (defonce menu-button (shui-util/react->rum (.-IonMenuButton ionic-react) false))
  (defonce label (shui-util/react->rum (.-IonLabel ionic-react) false))
  (defonce input (shui-util/react->rum (.-IonInput ionic-react) true))
  (defonce textarea (shui-util/react->rum (.-IonTextarea ionic-react) true))
  (defonce icon (shui-util/react->rum (.-IonIcon ionic-react) true))
  (defonce badge (shui-util/react->rum (.-IonBadge ionic-react) true))
  (defonce loading (shui-util/react->rum (.-IonLoading ionic-react) true))
  (defonce refresher (shui-util/react->rum (.-IonRefresher ionic-react) false))
  (defonce refresher-content (shui-util/react->rum (.-IonRefresherContent ionic-react) false)))
