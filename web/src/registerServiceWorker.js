/* eslint-disable no-console */

import { register } from "register-service-worker";

export function registerServiceWorker() {
  try {
    if (
      process.env.NODE_ENV === "production" &&
      !window.getQueryString("nopwa")
    ) {
      // 新 Service Worker 接管已打开的页面后，自动刷新一次以加载新资源。
      // 用 refreshing 标志防止 controllerchange 死循环。
      let refreshing = false;
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      }
      register(`${process.env.BASE_URL}service-worker.js`, {
        ready() {
          // console.log(
          //   "App is being served from cache by a service worker.\n" +
          //     "For more details, visit https://goo.gl/AFskqB"
          // );
          window.serviceWorkerReady = true;
        },
        registered(registration) {
          // 让处于 waiting 状态的新 SW 立即生效（必须发给 registration.waiting，
          // 之前误发给 registration.active 导致永远不激活，iOS 一直跑旧缓存）。
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          // 主动检查一次更新，尽快拉取新版本 SW
          try {
            registration.update();
          } catch (e) {
            // ignore
          }
        },
        updated(registration) {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        },
        // cached() {
        //   console.log("Content has been cached for offline use.");
        // },
        // updatefound() {
        //   console.log("New content is downloading.");
        // },
        // updated() {
        //   console.log("New content is available; please refresh.");
        // },
        // offline() {
        //   console.log(
        //     "No internet connection found. App is running in offline mode."
        //   );
        // },
        // error(error) {
        //   console.error("Error during service worker registration:", error);
        // }
      });
    }
  } catch (error) {
    //
  }
}
