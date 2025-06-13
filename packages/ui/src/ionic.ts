import {
  setupIonicReact,
  IonApp, IonPage,
  IonNav, IonNavLink, IonContent,
  IonHeader, IonBackButton,
  IonButtons, IonToolbar, IonLoading,
  IonTitle, IonButton, IonAlert,
  IonInput, IonTextarea, IonIcon,
  IonBadge, IonTabs, IonTab, IonTabBar,
  IonTabButton, IonModal, IonLabel,
  IonList, IonItem, IonDatetime,
  IonDatetimeButton, IonRefresher,
  IonRefresherContent, IonMenu,
  IonMenuButton, IonActionSheet, IonSearchbar,
  IonRouterOutlet,  useIonViewDidEnter,
  useIonViewDidLeave,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from '@ionic/react'

declare global {
  var LSIonic: any
}

const ionicUI = {
  IonApp,
  IonPage,
  IonNav, IonNavLink, IonContent,
  IonHeader, IonBackButton,
  IonButtons, IonToolbar, IonLoading,
  IonTitle, IonButton, IonAlert,
  IonInput, IonTextarea, IonIcon,
  IonBadge, IonTabs, IonTab, IonTabBar,
  IonTabButton, IonModal, IonLabel,
  IonList, IonItem, IonDatetime,
  IonDatetimeButton, IonRefresher,
  IonRefresherContent, IonMenu,
  IonMenuButton, IonActionSheet, IonSearchbar,
  IonRouterOutlet,
  useIonViewDidEnter,
  useIonViewDidLeave,
  useIonViewWillEnter,
  useIonViewWillLeave,
}

// initialize ionic mode
setupIonicReact()

window.LSIonic = ionicUI

export {
  setupIonicReact,
}
