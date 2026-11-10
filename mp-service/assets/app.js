/* MP Service — menu + booking form that opens WhatsApp with the request prefilled. No libraries. */
(function () {
  "use strict";

  var WA_PHONE = "380981083399";

  // ---- mobile menu ----
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("mobile-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---- phone check: Ukrainian numbers, 10 digits from 0 (or +380 …) ----
  function normalizePhone(raw) {
    var d = String(raw || "").replace(/[^\d+]/g, "");
    if (d.indexOf("+") > 0) return null;          // plus only at the start
    d = d.replace("+", "");
    if (/^380\d{9}$/.test(d)) d = d.slice(2);      // 380XXXXXXXXX -> 0XXXXXXXXX
    else if (/^80\d{9}$/.test(d)) d = d.slice(1);  // 80XXXXXXXXX  -> 0XXXXXXXXX
    if (!/^0[1-9]\d{8}$/.test(d)) return null;
    return "+38" + d;
  }
  function pretty(p) { // +380981234567 -> +38 098 123 45 67
    var d = p.slice(3);
    return "+38 " + d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6, 8) + " " + d.slice(8);
  }

  function setInvalid(field, bad) {
    var box = field.closest(".field");
    if (box) box.classList.toggle("invalid", bad);
    field.setAttribute("aria-invalid", bad ? "true" : "false");
  }

  var forms = document.querySelectorAll("form.booking");
  Array.prototype.forEach.call(forms, function (form) {
    var name = form.querySelector("[name=name]");
    var phone = form.querySelector("[name=phone]");
    var car = form.querySelector("[name=car]");
    var issue = form.querySelector("[name=issue]");
    var service = form.querySelector("[name=service]");
    var ok = form.querySelector(".form-ok");

    phone.addEventListener("blur", function () {
      if (phone.value.trim()) setInvalid(phone, !normalizePhone(phone.value));
    });
    phone.addEventListener("input", function () {
      if (normalizePhone(phone.value)) setInvalid(phone, false);
    });
    name.addEventListener("input", function () {
      if (name.value.trim().length >= 2) setInvalid(name, false);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = name.value.trim();
      var p = normalizePhone(phone.value);
      var badName = n.length < 2;
      setInvalid(name, badName);
      setInvalid(phone, !p);
      if (badName) { name.focus(); return; }
      if (!p) { phone.focus(); return; }

      var lines = ["Заявка на ремонт з сайту MP Service", ""];
      lines.push("Ім'я: " + n);
      lines.push("Телефон: " + pretty(p));
      if (car && car.value.trim()) lines.push("Авто: " + car.value.trim());
      if (service && service.value) lines.push("Послуга: " + service.value);
      if (issue && issue.value.trim()) lines.push("Що турбує: " + issue.value.trim());

      var url = "https://api.whatsapp.com/send?phone=" + WA_PHONE + "&text=" + encodeURIComponent(lines.join("\n"));
      // no "noopener" feature here: with it window.open() always returns null
      var win = window.open(url, "_blank");
      if (win) { try { win.opener = null; } catch (err) { /* ignore */ } }
      else window.location.href = url;
      if (ok) ok.classList.add("show");
    });
  });

  // ---- subtle fade-up on scroll ----
  // Only elements that start below the first screen are hidden, so nothing visible flickers;
  // skipped entirely when the visitor prefers reduced motion or the browser lacks IntersectionObserver.
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]"), function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("reveal");
        io.observe(el);
      }
    });
  }

  // expose for quick checks in the console
  window.__mpNormalizePhone = normalizePhone;
})();
