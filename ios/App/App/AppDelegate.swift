// code from https://github.com/ionic-team/capacitor/discussions/7097#discussioncomment-12804297
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    let maxBackgroundTime: TimeInterval = 300 // 5 minutes in seconds

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        //...

        // Listen to Memory Constraints to restart the app
        // Observe for low-memory warnings.
        NotificationCenter.default.addObserver(self,
                                            selector: #selector(handleMemoryWarning),
                                            name: UIApplication.didReceiveMemoryWarningNotification,
                                            object: nil)
        return true
    }

    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        // Allow Remote Notifications to be handled by the BackgroundRunnerPlugin
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.

        // Record the Background Enter Date
        UserDefaults.standard.set(Date(), forKey: "backgroundEnterDate")
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
        if let backgroundDate = UserDefaults.standard.object(forKey: "backgroundEnterDate") as? Date {
            let elapsed = Date().timeIntervalSince(backgroundDate)
            if elapsed > maxBackgroundTime {
                // More than N minutes have passed.
                // Reconstruct your WKWebView (or trigger an app state reset) as needed.
                restartApplication()
            }
        }

        // Clear the background enter date
        UserDefaults.standard.removeObject(forKey: "backgroundEnterDate")
        UserDefaults.standard.synchronize() // Optional, to flush the data right away
    }

    func applicationDidBecomeActive(_ e: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func restartApplication() {
        // Create a simple view controller as a placeholder during transition
        let viewController = UIViewController()
        let navCtrl = UINavigationController(rootViewController: viewController)

        guard
            let window = self.window,
            let rootViewController = window.rootViewController
        else {
            return
        }

        navCtrl.view.frame = rootViewController.view.frame
        navCtrl.view.layoutIfNeeded()

        UIView.transition(with: window, duration: 0.3, options: .transitionCrossDissolve, animations: {
            window.rootViewController = navCtrl
        }) { _ in
            // After transition, reload the app by recreating the main view controller
            let mainStoryboard = UIStoryboard(name: "Main", bundle: nil)
            if let initialViewController = mainStoryboard.instantiateInitialViewController() {
                window.rootViewController = initialViewController

                // Post a notification that can be caught in the web view to reload the app state
                NotificationCenter.default.post(name: Notification.Name("AppRestartRequired"), object: nil)
            }
        }
    }

    // Called when the app receives a low memory warning.
    @objc func handleMemoryWarning() {
        // Only kill the app if it's in the background.
        if UIApplication.shared.applicationState == .background {
            // Set an old date to guarantee a restart next time
            let staleDate = Date(timeIntervalSinceNow: -(maxBackgroundTime * 2))
            UserDefaults.standard.set(staleDate, forKey: "backgroundEnterDate")
            UserDefaults.standard.synchronize() // Optional, to flush the data right away
            print("🔴 Memory warning in background: setting stale timestamp \(staleDate)")
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
