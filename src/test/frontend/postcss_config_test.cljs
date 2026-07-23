(ns frontend.postcss-config-test
  (:require ["child_process" :as child-process]
            [cljs.test :refer [deftest is]]))

(deftest mobile-config-loads-ios-font-source-plugin-test
  (let [script (str "(async () => {"
                    "process.argv.push('tailwind.mobile.css');"
                    "const { default: load } = await import('postcss-load-config');"
                    "const config = await load({}, process.cwd());"
                    "const names = config.plugins.map((plugin) => plugin.postcssPlugin);"
                    "if (!names.includes('strip-ios-web-font-sources')) process.exit(2);"
                    "})().catch((error) => { console.error(error); process.exit(1); });")
        result (child-process/spawnSync js/process.execPath
                                        #js ["-e" script]
                                        #js {:cwd (.cwd js/process)
                                             :encoding "utf8"})]
    (is (zero? (.-status result))
        (str (.-stderr result)))))
