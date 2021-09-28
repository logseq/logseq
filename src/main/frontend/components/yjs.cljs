(ns frontend.components.yjs
  (:require [rum.core :as rum]
            [frontend.handler.yjs :as yjs-handler]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [frontend.state :as state]))

(rum/defc setup-sync-server
  []
  (let [address (atom nil)
        room (atom nil)
        username (atom nil)]
    [:div.p-2.mt-2.rounded-md.shadow-sm.bg-base-2
     [:input.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5
      {:placeholder "Server Address: e.g. ws://localhost:1234"
       :on-change (fn [e] (reset! address (util/evalue e)))}]
     [:input.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5
      {:placeholder "Server Roomname: e.g. roomname-1"
       :on-change (fn [e] (reset! room (util/evalue e)))}]
     [:input.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5
      {:placeholder "Username for display"
       :on-change (fn [e] (reset! username (util/evalue e)))}]
     (ui/button "Save" :on-click (fn [e]
                                   (util/stop e)
                                   (yjs-handler/setup-sync-server! @address @room @username)))]))
