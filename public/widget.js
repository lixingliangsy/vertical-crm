/**
 * public/widget.js — embeddable support launcher. No dependencies.
 *
 * <script src="https://YOUR_DOMAIN/widget.js" data-host="https://YOUR_DOMAIN" data-product="vertical-crm" async></script>
 *
 * Injects a button that opens /embed/chat in an iframe. Does not read the host page.
 */
(function () {
  "use strict";
  if (window.__supportWidgetLoaded) return;
  window.__supportWidgetLoaded = true;

  function getScriptTag() {
    if (document.currentScript) return document.currentScript;
    var tags = document.getElementsByTagName("script");
    for (var i = 0; i < tags.length; i++) {
      if (/widget(\.min)?\.js(\?|$)/.test(tags[i].src || "")) return tags[i];
    }
    return null;
  }

  var tag = getScriptTag();
  var host = (tag && tag.getAttribute("data-host")) || window.location.origin;
  host = host.replace(/\/+$/, "");
  var product = (tag && tag.getAttribute("data-product")) || "vertical-crm";

  var BLUE = "#2563EB";
  var shadow = null;

  function ensureRoot() {
    if (shadow) return shadow;
    var hostEl = document.createElement("div");
    hostEl.id = "support-chat-root";
    hostEl.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483000;";
    document.body.appendChild(hostEl);
    shadow = hostEl.attachShadow ? hostEl.attachShadow({ mode: "open" }) : hostEl;
    return shadow;
  }

  function build() {
    var root = ensureRoot();
    var style = document.createElement("style");
    style.textContent =
      ".gw-btn{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;" +
      "background:" + BLUE + ";color:#fff;border:0;font-size:24px;cursor:pointer;" +
      "box-shadow:0 8px 24px rgba(37,99,235,.4);z-index:2147483001;}" +
      ".gw-panel{position:fixed;right:20px;bottom:88px;width:360px;height:520px;max-height:80vh;" +
      "border:0;border-radius:12px;box-shadow:0 12px 40px rgba(15,23,42,.18);z-index:2147483001;}";
    root.appendChild(style);

    var btn = document.createElement("button");
    btn.className = "gw-btn";
    btn.setAttribute("aria-label", "Open AI support");
    btn.textContent = "\uD83D\uDCAC";
    root.appendChild(btn);

    var panel = null;
    var sessionKey = (product || "vertical-crm") + "_chat_session";
    var sid = "cw_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    try {
      sid = localStorage.getItem(sessionKey) || sid;
    } catch (e) {}

    btn.addEventListener("click", function () {
      if (panel) {
        panel.remove();
        panel = null;
        return;
      }
      panel = document.createElement("iframe");
      panel.className = "gw-panel";
      panel.setAttribute("title", product + " AI support");
      panel.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
      panel.src = host + "/embed/chat?product=" + encodeURIComponent(product) + "&sessionId=" + encodeURIComponent(sid);
      root.appendChild(panel);
    });
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
