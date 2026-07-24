(ns frontend.components.left-sidebar-util)

(defn mobile-navigation-target?
  [target]
  (boolean
   (some (fn [selector] (.closest target selector))
         [".sidebar-navigations a"
          ".favorites .bd"
          ".recent .bd"
          ".nav-header"])))
