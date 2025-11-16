//
//  NativePageViewController.swift
//  Logseq
//
//  A lightweight UIViewController that hosts the shared WebView and
//  asks JS to render the desired path when shown.
//

import UIKit

class NativePageViewController: UIViewController {
    let targetPath: String
    let push: Bool

    init(path: String, push: Bool = true, title: String? = nil) {
        self.targetPath = path
        self.push = push
        super.init(nibName: nil, bundle: nil)
        self.navigationItem.title = title
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        SharedWebViewController.instance.attach(to: self)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        // Tell JS to navigate to the desired path
        UILocalPlugin.requestNavigation(path: targetPath, push: push)
    }
}
