# 🔍 Is it Blocked in Your Internet? (سامانه پایش هوشمند فیلترینگ)

I built this lightweight, client-side tool to help users instantly check what's actually happening on their current connection. It gives you a clear picture of whether a site is genuinely down, or just locked behind the national gateway.

👉 **[Live Demo Link](https://YOUR-GITHUB-USERNAME.github.io/iran-site-checker/)** *(Replace with your actual link!)*

---

## 🤔 Why this actually works (The Tech Bit)

If you use a standard server-side script (like a server hosted in Germany or Finland) to check if a site is up, it will *always* say "Yes, YouTube is online!".

To fix this, **the entire check happens directly in your browser**. 

### How the core engine is built:
* **Anti-Cache Trick:** The app appends a random, unique query string (`?__cb__=171000...`) to every single fetch request. This forces your local ISP gateway to actually look up the path every single time instead of giving you a cached shortcut.
* **Smart Latency Analysis:** It tracks response speeds using `performance.now()`. If a connection drops instantly or hangs for exactly 4.5 seconds, it identifies the classic "packet drop" footprint used by the network filters and flags it as <span style="color:#dc2626"><b>Blocked</b></span>.
* **CORS Sandbox Bypass:** By executing requests in `no-cors` mode, we can successfully ping external servers to see if they answer the door without violating browser security sandboxes.

---

## ✨ Features

* **Instant One-Time Checker:** Got a random link a friend sent you? Drop it in the top box for a quick status and latency check.
* **Custom Tracking Dashboard:** Tired of typing the same URLs? You can add your own custom domains to the monitor list. They save securely to your browser's `localStorage` so they’re still there when you refresh.
* **Dual Language Layout:** Full **Persian (RTL)** and **English (LTR)** localization. The entire layout flips cleanly when you toggle the language button.


---

## 🛠️ How to run it locally

Since this is a pure front-end application, there is no messy backend, node modules, or environment setups required.

1. Clone the repo:
   ```bash
   git clone [https://github.com/YOUR-GITHUB-USERNAME/iran-site-checker.git](https://github.com/YOUR-GITHUB-USERNAME/iran-site-checker.git)


## License
   This project is open-source and licensed under the MIT License. Feel free to fork it, break it, tweak the styles, or use the core logic in your own tools.

Built with 💙By DoctorWCoding (aka DoctorW)
