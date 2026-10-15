// Installable web app support (manifest.json, /sw.js). Loaded in <head> by _includes/pwa.html.
// Kept to plain ES5 so it runs as-is in every browser the site supports.
(function () {
	var storageKey = "pwaLastCalendar";

	function storage(action, value) {
		try {
			if (action === "get") return window.localStorage.getItem(storageKey);
			window.localStorage.setItem(storageKey, value);
		} catch (e) { /* storage blocked: the app simply opens on the home page */ }
		return null;
	}

	var params = new URLSearchParams(window.location.search);
	var path = window.location.pathname.replace(/\.html$/, "");

	// The installed app opens at /?source=pwa (manifest start_url): go straight back to the last
	// calendar location instead of asking for it again. A plain visit to / is left alone, so
	// choosing a new location still works.
	if (path === "/" && params.get("source") === "pwa") {
		var last = storage("get");
		if (last) {
			window.location.replace("/calendar" + last);
			return;
		}
	}

	// Remember the location of the calendar being viewed (it lives only in the URL).
	if (path === "/calendar" && params.has("lat") && params.has("long"))
		storage("set", window.location.search);

	// ─── Service worker ───
	if ("serviceWorker" in navigator && window.isSecureContext !== false) {
		window.addEventListener("load", function () {
			var firstInstall = !navigator.serviceWorker.controller;
			navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(function () {
				if (!firstInstall || !window.performance || !performance.getEntriesByType) return;
				// Hand the worker what this page already loaded, so it works offline right away.
				return navigator.serviceWorker.ready.then(function (registration) {
					var urls = performance.getEntriesByType("resource").map(function (entry) { return entry.name; });
					urls.push(window.location.href);
					if (registration.active) registration.active.postMessage({ type: "cache-urls", urls: urls });
				});
			}).catch(function (error) {
				console.warn("Service worker registration failed", error);
			});
		});
	}

	// ─── Install button (in the "Mobile App downloads" modal) ───
	var deferredPrompt = null;
	var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
		|| window.navigator.standalone === true;

	function section() { return document.getElementById("pwaInstall"); }

	function show(id) {
		var root = section();
		if (!root) return;
		root.classList.remove("d-none");
		var parts = root.querySelectorAll("[data-pwa-state]");
		for (var i = 0; i < parts.length; i++)
			parts[i].classList.toggle("d-none", parts[i].getAttribute("data-pwa-state") !== id);
	}

	window.addEventListener("beforeinstallprompt", function (event) {
		event.preventDefault();
		deferredPrompt = event;
		show("prompt");
	});

	window.addEventListener("appinstalled", function () {
		deferredPrompt = null;
		show("installed");
	});

	document.addEventListener("DOMContentLoaded", function () {
		if (standalone) { show("installed"); return; }
		if (deferredPrompt) show("prompt");
		else if (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))
			show("ios");

		var button = document.getElementById("pwaInstallButton");
		if (button) button.addEventListener("click", function () {
			if (!deferredPrompt) return;
			deferredPrompt.prompt();
			deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
		});
	});
})();
