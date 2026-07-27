(ns frontend.components.header-reactivity-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]))

(defn- source-for
  [relative-file]
  (.toString
   (fs/readFileSync (node-path/join (.cwd js/process) relative-file) "utf8")))

(defn- form-source
  [source marker]
  (let [start (string/index-of source marker)
        end (when start
              (or (some->> ["\n(hsx/defc "
                            "\n(defn"
                            "\n(def "
                            "\n(declare "]
                           (keep #(string/index-of source % (inc start)))
                           seq
                           (apply min))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(deftest toolbar-menu-subscribes-to-current-page-and-favorite-state-test
  (let [source (source-for "src/main/frontend/components/header.cljs")
        content (form-source
                 source
                 "(hsx/defc ^:large-vars/cleanup-todo toolbar-dots-menu-content")
        loaded-page (form-source source "(hsx/defc toolbar-dots-menu-page")
        lookup (form-source source "(hsx/defc toolbar-dots-menu-lookup")
        ready (form-source source "(hsx/defc toolbar-dots-menu-ready")]
    (is (string/includes? loaded-page "db-hooks/use-block"))
    (is (string/includes? loaded-page ":favorite-status"))
    (is (string/includes? lookup "db-hooks/use-resource"))
    (is (string/includes? lookup ":page-identity"))
    (is (string/includes? ready "(rfx/use-sub [:route-match])")
        "The component that reads current-page must rerender when the route changes.")
    (is (not (string/includes? content "(rfx/use-sub [:route-match])"))
        "A child route subscription cannot refresh the current-page prop chosen by its parent.")
    (is (not (string/includes? content "hooks/use-effect")))
    (is (not (string/includes? content "db-async/<get-block")))))

(deftest favorites-and-recent-sidebar-sections-use-live-resources-test
  (let [source (source-for "src/main/frontend/components/left_sidebar.cljs")
        favorites (form-source source "(hsx/defc sidebar-favorites-loaded")
        recent (form-source source "(hsx/defc sidebar-recent-pages-loaded")]
    (is (string/includes? favorites "(db-hooks/use-resource [:favorites])"))
    (is (not (string/includes? favorites "hooks/use-effect")))
    (is (not (string/includes? favorites "<get-favorites")))
    (is (string/includes? recent ":recent-pages"))
    (is (string/includes? recent "db-hooks/use-resource"))
    (is (not (string/includes? recent "hooks/use-effect")))
    (is (not (string/includes? recent "get-recent-pages")))))
