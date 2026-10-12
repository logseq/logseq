(ns logseq.db.frontend.db-ident-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.frontend.db-ident :as db-ident]))

(deftest ensure-unique-db-ident-takes-next-number-test
  (let [conn (d/create-conn {:db/ident {:db/unique :db.unique/identity}})]
    (d/transact! conn [{:db/ident :user.property/foo}
                       {:db/ident :user.property/foo-1}])
    (is (= :user.property/foo-2 (db-ident/ensure-unique-db-ident @conn :user.property/foo)))
    (d/transact! conn [{:db/ident :user.property/foo-3}])
    (is (= :user.property/foo-4 (db-ident/ensure-unique-db-ident @conn :user.property/foo)))))

;; nbb always makes stable idents; the random suffix only exists in the app build
#?(:org.babashka/nbb nil
   :cljs
   (defn- without-stable-idents
     [f]
     (let [old (aget js/process.env "LOGSEQ_STABLE_IDENTS")]
       (js-delete js/process.env "LOGSEQ_STABLE_IDENTS")
       (try
         (f)
         (finally
           (when (some? old)
             (aset js/process.env "LOGSEQ_STABLE_IDENTS" old)))))))

#?(:org.babashka/nbb nil
   :cljs
   (deftest create-db-ident-from-name-random-suffix-test
     (without-stable-idents
      (fn []
        (let [ident (db-ident/create-db-ident-from-name "user.property" "Foo")]
          (is (= "user.property" (namespace ident)))
          (is (re-matches #"Foo-[a-zA-Z][_\-0-9a-zA-Z]{7}" (name ident))
              "without $LOGSEQ_STABLE_IDENTS a user ident gets a random suffix"))
        (is (= :plugin.class.my-plugin/Foo
               (db-ident/create-db-ident-from-name "plugin.class.my-plugin" "Foo"))
            "a plugin class ident gets no suffix")))))
