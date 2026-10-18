// Service worker: lets the site be installed as a web app and keeps it working offline.
// Registered by assets/js/pwa.js. Kept to plain ES2017 so the legacy build leaves it untouched.
//
// Nothing is precached by hand: as pages are visited, what they load is stored, and the first
// page that registers the worker hands over the files it already loaded (see "cache-urls").
//
// - Pages (navigations), scripts, styles and JSON: network first, so a deploy shows up on the
//   next load and files from different versions are never mixed; the stored copy is used offline.
//   An offline page whose query string differs (e.g. /calendar?lat=…) falls back to any stored
//   copy of the same page, since the location is read from the URL in the browser.
// - Images, fonts and the like (incl. Google Fonts): served from storage, refreshed in the background.
// - Other origins (geonames, hanetz.royzmanim.com, …), non-GET requests, "no-store" requests and
//   non-navigation fetches of pages (the shul-wall reload check) go straight to the network.

var VERSION = "v1";
var CACHE = "zemaneh-yosef-" + VERSION;
var NAV_TIMEOUT_MS = 6000;
var FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
var SKIP_EXTENSIONS = /\.(pdf|pdn|psd|mp4|webm|zip)$/i;
var NETWORK_FIRST_EXTENSIONS = /\.(m?js|css|json|html?|webmanifest)$/i;

self.addEventListener("install", function (event) {
	event.waitUntil(
		caches.open(CACHE)
			.then(function (cache) { return cache.addAll(["/", "/manifest.json"]); })
			.catch(function () { /* offline install: pages are stored as they are visited */ })
			.then(function () { return self.skipWaiting(); })
	);
});

self.addEventListener("activate", function (event) {
	event.waitUntil(
		caches.keys()
			.then(function (keys) {
				return Promise.all(keys.filter(function (key) {
					return key.indexOf("zemaneh-yosef-") === 0 && key !== CACHE;
				}).map(function (key) { return caches.delete(key); }));
			})
			.then(function () { return self.clients.claim(); })
	);
});

// The page that first registers the worker sends the same-origin files it already loaded,
// so they work offline without waiting for a second visit.
self.addEventListener("message", function (event) {
	var data = event.data;
	if (!data || data.type !== "cache-urls" || !Array.isArray(data.urls)) return;
	var urls = data.urls.filter(function (url) {
		try {
			var parsed = new URL(url, self.location.href);
			return (parsed.origin === self.location.origin || FONT_HOSTS.indexOf(parsed.hostname) !== -1)
				&& !SKIP_EXTENSIONS.test(parsed.pathname);
		} catch (e) { return false; }
	});
	event.waitUntil(caches.open(CACHE).then(function (cache) {
		return Promise.all(urls.map(function (url) {
			return cache.match(url).then(function (hit) {
				if (hit) return;
				return fetch(url, { credentials: "same-origin" }).then(function (response) {
					if (isStorable(response)) return cache.put(url, response);
				}).catch(function () {});
			});
		}));
	}));
});

// Zeman notifications (assets/js/features/zmanNotifications.js) are shown through this worker: a click brings
// back the calendar that sent it, or opens it if it was closed.
self.addEventListener("notificationclick", function (event) {
	event.notification.close();
	var data = event.notification.data || {};
	var target = new URL(data.url || "/calendar", self.location.href);
	if (target.origin !== self.location.origin) target = new URL("/calendar", self.location.href);

	event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windows) {
		var exact = null, calendar = null;
		for (var i = 0; i < windows.length; i++) {
			var url = new URL(windows[i].url);
			if (url.href === target.href) exact = windows[i];
			else if (!calendar && url.pathname.replace(/\.html$/, "") === target.pathname.replace(/\.html$/, "")) calendar = windows[i];
		}
		var client = exact || calendar;
		if (client && "focus" in client) return client.focus();
		if (self.clients.openWindow) return self.clients.openWindow(target.href);
	}));
});

// Pushes from the notification server (assets/js/features/pushNotifications.js): the same notifications the open
// calendar sends, with the same `tag`. When the calendar already showed one, it is replaced silently (a push must
// always show a notification, or browsers revoke the subscription), so it never sounds twice.
self.addEventListener("push", function (event) {
	var data = null;
	try { data = event.data ? event.data.json() : null; } catch (e) { data = null; }
	if (!data || typeof data.title !== "string") data = { title: "Zemaneh Yosef", body: "", tag: "zman-unknown" };
	var tag = typeof data.tag === "string" ? data.tag : undefined;
	var url = typeof data.url === "string" && data.url.indexOf(self.location.origin + "/") === 0 ? data.url : "/calendar";

	event.waitUntil(self.registration.getNotifications(tag ? { tag: tag } : undefined).then(function (shown) {
		var already = !!tag && shown.length > 0;
		return self.registration.showNotification(data.title, {
			body: typeof data.body === "string" ? data.body : "",
			tag: tag,
			timestamp: typeof data.timestamp === "number" ? data.timestamp : Date.now(),
			icon: "/assets/images/pwa/icon-192.png",
			badge: "/assets/images/pwa/icon-192.png",
			silent: already,
			data: { url: url }
		});
	}));
});

// The browser replaced the push subscription: hand the new one to the notification server.
self.addEventListener("pushsubscriptionchange", function (event) {
	event.waitUntil(readPushStore(["token", "server", "publicKey"]).then(function (stored) {
		if (!stored.token || !stored.server) return;
		var resubscribe = event.newSubscription ? Promise.resolve(event.newSubscription)
			: self.registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: (event.oldSubscription && event.oldSubscription.options.applicationServerKey) || base64UrlBytes(stored.publicKey)
			});
		return resubscribe.then(function (subscription) {
			var json = subscription.toJSON();
			return fetch(stored.server + "/v1/subscription", {
				method: "PUT",
				headers: { "Content-Type": "application/json", "Authorization": "Bearer " + stored.token },
				body: JSON.stringify({ subscription: { endpoint: json.endpoint, keys: json.keys } }),
				credentials: "omit"
			});
		});
	}).catch(function (error) { console.warn("Couldn't renew the push subscription", error); }));
});

function readPushStore(keys) {
	return new Promise(function (resolve) {
		var result = {};
		var req;
		try { req = indexedDB.open("royzmanim-push", 1); } catch (e) { return resolve(result); }
		req.onupgradeneeded = function () { req.result.createObjectStore("kv"); };
		req.onerror = function () { resolve(result); };
		req.onsuccess = function () {
			var store = req.result.transaction("kv", "readonly").objectStore("kv");
			var left = keys.length;
			keys.forEach(function (key) {
				var get = store.get(key);
				get.onsuccess = function () { result[key] = get.result; if (--left === 0) resolve(result); };
				get.onerror = function () { if (--left === 0) resolve(result); };
			});
		};
	});
}

function base64UrlBytes(text) {
	if (!text) return undefined;
	var bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
	var bytes = new Uint8Array(bin.length);
	for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

self.addEventListener("fetch", function (event) {
	var request = event.request;
	if (request.method !== "GET" || request.headers.has("range")) return;
	if (request.cache === "no-store" || request.cache === "reload") return;

	var url = new URL(request.url);
	var sameOrigin = url.origin === self.location.origin;
	var isFont = FONT_HOSTS.indexOf(url.hostname) !== -1;
	if (!sameOrigin && !isFont) return;
	if (SKIP_EXTENSIONS.test(url.pathname)) return;
	if (sameOrigin && url.pathname === "/sw.js") return;

	if (request.mode === "navigate") {
		event.respondWith(networkFirst(request, true));
		return;
	}

	// A script fetching a page (e.g. the shul-wall reload check) wants the real network answer.
	var accept = request.headers.get("accept") || "";
	if (sameOrigin && request.destination === "" && accept.indexOf("text/html") !== -1) return;

	if (isFont || !NETWORK_FIRST_EXTENSIONS.test(url.pathname)) {
		event.respondWith(staleWhileRevalidate(event, request));
		return;
	}
	event.respondWith(networkFirst(request, false));
});

function isStorable(response) {
	return response && (response.ok || response.type === "opaque") && !response.redirected;
}

function networkFirst(request, isNavigation) {
	var network = fetch(request).then(function (response) {
		if (isStorable(response)) {
			var copy = response.clone();
			caches.open(CACHE).then(function (cache) { return cache.put(request, copy); });
		}
		return response;
	});

	var fallback = function () {
		return caches.open(CACHE).then(function (cache) {
			return cache.match(request).then(function (hit) {
				if (hit || !isNavigation) return hit;
				return cache.match(request, { ignoreSearch: true });
			});
		});
	};

	if (!isNavigation) {
		return network.catch(function () {
			return fallback().then(function (hit) { return hit || Response.error(); });
		});
	}

	// Navigations: on a stalled connection, show the stored page after a few seconds.
	return new Promise(function (resolve, reject) {
		var settled = false;
		var timer = setTimeout(function () {
			fallback().then(function (hit) {
				if (hit && !settled) { settled = true; resolve(hit); }
			});
		}, NAV_TIMEOUT_MS);

		network.then(function (response) {
			clearTimeout(timer);
			if (!settled) { settled = true; resolve(response); }
		}, function (error) {
			clearTimeout(timer);
			if (settled) return;
			fallback().then(function (hit) {
				settled = true;
				if (hit) resolve(hit); else reject(error);
			});
		});
	});
}

function staleWhileRevalidate(event, request) {
	return caches.open(CACHE).then(function (cache) {
		return cache.match(request).then(function (hit) {
			var network = fetch(request).then(function (response) {
				if (isStorable(response)) return cache.put(request, response.clone()).then(function () { return response; });
				return response;
			});
			if (hit) {
				event.waitUntil(network.catch(function () {}));
				return hit;
			}
			return network;
		});
	});
}
