import UIKit
import WebKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = WebViewController()
        window?.makeKeyAndVisible()
        return true
    }
}

final class WebViewController: UIViewController, WKNavigationDelegate {
    private var web: WKWebView!
    private let ink = UIColor(red: 0x13/255.0, green: 0x16/255.0, blue: 0x1b/255.0, alpha: 1)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = ink

        let cfg = WKWebViewConfiguration()
        cfg.websiteDataStore = .default()                 // keeps workouts (localStorage) on the phone
        cfg.mediaTypesRequiringUserActionForPlayback = [] // lets the rest timer beep

        web = WKWebView(frame: .zero, configuration: cfg)
        web.navigationDelegate = self
        web.isOpaque = false
        web.backgroundColor = UIColor(red: 0x11/255.0, green: 0x14/255.0, blue: 0x19/255.0, alpha: 1)
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])

        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "docs") {
            web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }

        // Save any half-typed set when the app goes to the background.
        NotificationCenter.default.addObserver(forName: UIApplication.willResignActiveNotification,
                                               object: nil, queue: .main) { [weak self] _ in
            self?.web.evaluateJavaScript("window.dispatchEvent(new Event('pagehide'))", completionHandler: nil)
        }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    // Open web links in Safari instead of inside the app.
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let u = navigationAction.request.url, u.scheme != "file", navigationAction.navigationType == .linkActivated {
            UIApplication.shared.open(u)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }
}
