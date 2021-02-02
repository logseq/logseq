(ns frontend.env
  #?(:clj (:require [aero.core :as aero]
                    [clojure.java.io :as io]
                    [clojure.string :as str]))
  (:refer-clojure :exclude [get])
  (:require [shadow-env.core :as env]))

#?(:clj
   (defn read-env [build-state]
     (let [aero-config {:profile (or (some->
                                       (System/getenv "ENV")
                                       (str/lower-case)
                                       (keyword))
                                     :dev)}
           client-config (some-> (io/resource "config.edn")
                           (aero/read-config aero-config))]
       {:cljs client-config})))

(env/link get `read-env)

(defmacro get-static [& ks]
  (let [ks (into [:shadow-env.core/cljs] ks)]
    (clojure.core/get-in get ks)))
