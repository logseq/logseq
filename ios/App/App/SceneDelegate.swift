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

        // 1) Create your nav controller as before
        let nav = UINavigationController()
        nav.navigationBar.prefersLargeTitles = false

        // hook the delegate on AppDelegate so all your existing
        // UINavigationControllerDelegate logic keeps working
        if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
            nav.delegate = appDelegate
            appDelegate.navController = nav
        }

        if #available(iOS 15.0, *) {
            let appearance = UINavigationBarAppearance()
            appearance.configureWithTransparentBackground()
            appearance.backgroundEffect = UIBlurEffect(style: .systemMaterial)
            appearance.backgroundColor = UIColor.systemBackground.withAlphaComponent(0.6)
            appearance.shadowColor = .clear
            nav.navigationBar.standardAppearance = appearance
            nav.navigationBar.scrollEdgeAppearance = appearance
            nav.navigationBar.compactAppearance = appearance
        }

        let rootPath = "/"
        let rootVC = NativePageViewController(path: rootPath,
                                              push: true,
                                              title: "Logseq")
        nav.setViewControllers([rootVC], animated: false)
        self.navController = nav

        // 2) Wrap in SwiftUI root (LiquidTabsRootView)
        let rootView = LiquidTabsRootView(navController: nav)
        let hosting = UIHostingController(rootView: rootView)

        // 3) Standard UIWindowScene setup
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = hosting
        self.window = window
        window.makeKeyAndVisible()

        // 4) Start observing route changes (your existing logic)
        (UIApplication.shared.delegate as? AppDelegate)?.startRouteObservation()
    }

    // Optional, but nice to have:
    func sceneDidDisconnect(_ scene: UIScene) { }
    func sceneDidBecomeActive(_ scene: UIScene) { }
    func sceneWillResignActive(_ scene: UIScene) { }
    func sceneWillEnterForeground(_ scene: UIScene) { }
    func sceneDidEnterBackground(_ scene: UIScene) { }
}
