(ns capacitor.app
  (:require [rum.core :as rum]))

(rum/defc main
  []
  [:h1.text-6xl.text-center.py-20.border.p-8
   "Hello World, capacitor!"])