import UIKit
import SwiftUI

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    // If you still want a reference to nav:
    var navController: UINavigationController?

    func scene(_ scene: UIScene,
               willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {

        guard let windowScene = scene as? UIWindowScene else { return }

        // 1) Create your nav controller
        let nav = UINavigationController()
        nav.navigationBar.prefersLargeTitles = false

        // hook the delegate on AppDelegate so all your existing
        // UINavigationControllerDelegate logic keeps working
        if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
            nav.delegate = appDelegate
            appDelegate.navController = nav
        }

        let rootPath = "/"
        // Start with NO title so "Logseq" isn't shown during splash.
        let rootVC = NativePageViewController(
            path: rootPath,
            push: true,
            title: nil // or "" – plugin will set real title later
        )
        // Just to be extra safe:
        rootVC.navigationItem.title = ""

        nav.setViewControllers([rootVC], animated: false)
        self.navController = nav

        // 2) Wrap in SwiftUI root (LiquidTabsRootView)
        let rootView = LiquidTabsRootView(navController: nav)
        let hosting = UIHostingController(rootView: rootView)

        // 3) Standard UIWindowScene setup
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = hosting
        window.tintColor = UIColor.logseqTint
        self.window = window
        window.makeKeyAndVisible()

        // 4) Start observing route changes (your existing logic)
        (UIApplication.shared.delegate as? AppDelegate)?.startRouteObservation()

        handleInitialSceneOptions(connectionOptions)
    }

    // Optional, but nice to have:
    func sceneDidDisconnect(_ scene: UIScene) { }
    func sceneDidBecomeActive(_ scene: UIScene) { }
    func sceneWillResignActive(_ scene: UIScene) { }
    func sceneWillEnterForeground(_ scene: UIScene) { }
    func sceneDidEnterBackground(_ scene: UIScene) { }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        forwardUserActivity(userActivity)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        forwardURLContexts(URLContexts)
    }

    func windowScene(_ windowScene: UIWindowScene,
                     performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        let handled = (UIApplication.shared.delegate as? AppDelegate)?
            .handleShortcutItem(shortcutItem) ?? false
        completionHandler(handled)
    }

    private func handleInitialSceneOptions(_ options: UIScene.ConnectionOptions) {
        if let shortcut = options.shortcutItem {
            DispatchQueue.main.async {
                _ = (UIApplication.shared.delegate as? AppDelegate)?
                    .handleShortcutItem(shortcut)
            }
        }

        if let activity = options.userActivities.first {
            forwardUserActivity(activity)
        }

        if !options.urlContexts.isEmpty {
            forwardURLContexts(options.urlContexts)
        }
    }

    private func forwardUserActivity(_ userActivity: NSUserActivity) {
        guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
        _ = appDelegate.application(
            UIApplication.shared,
            continue: userActivity,
            restorationHandler: { _ in }
        )
    }

    private func forwardURLContexts(_ contexts: Set<UIOpenURLContext>) {
        guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
        for context in contexts {
            let sceneOptions = context.options
            var appOptions: [UIApplication.OpenURLOptionsKey: Any] = [:]
            if let sourceApplication = sceneOptions.sourceApplication {
                appOptions[.sourceApplication] = sourceApplication
            }
            if let annotation = sceneOptions.annotation {
                appOptions[.annotation] = annotation
            }
            appOptions[.openInPlace] = sceneOptions.openInPlace
            if let eventAttribution = sceneOptions.eventAttribution {
                appOptions[.eventAttribution] = eventAttribution
            }
            _ = appDelegate.application(
                UIApplication.shared,
                open: context.url,
                options: appOptions
            )
        }
    }
}
