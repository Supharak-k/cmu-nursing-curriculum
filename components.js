// Shared page components. Keep layout and visual identity in the existing CSS.
(() => {
  const isThai = document.documentElement.lang === "th";
  const headerTemplate = () => `
    <header class="site-header">
      <div class="container nav-wrap">
        <a class="brand" href="index.html" aria-label="Faculty of Nursing, Chiang Mai University — home">
          <img class="faculty-logo" src="image/web/faculty-logo-en.png" width="320" height="288" alt="Faculty of Nursing, Chiang Mai University">
          <span class="faculty-brand-text"><strong data-th="คณะพยาบาลศาสตร์" data-en="Faculty of Nursing">Faculty of Nursing</strong><small data-th="มหาวิทยาลัยเชียงใหม่" data-en="Chiang Mai University">Chiang Mai University</small></span>
        </a>
        <nav class="desktop-nav" aria-label="Primary navigation">
          <a href="index.html" data-th="หน้าแรก" data-en="Home">Home</a>
          <a href="undergraduate.html" data-th="ปริญญาตรี" data-en="Bachelor's Degree">Bachelor's Degree</a>
          <a href="masters.html" data-th="ปริญญาโท" data-en="Master's Degree">Master's Degree</a>
          <a href="doctoral.html" data-th="ปริญญาเอก" data-en="Doctor of Philosophy">Doctor of Philosophy</a>
        </nav>
        <div class="nav-actions">
          <button class="language-toggle" type="button" aria-label="Switch language" aria-pressed="false"><span class="lang-th">TH</span><span class="lang-divider"> | </span><span class="lang-en">EN</span></button>
          <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span></button>
        </div>
      </div>
      <nav class="mobile-nav" aria-label="Mobile navigation">
        <a href="index.html" data-th="หน้าแรก" data-en="Home">Home</a>
        <a href="undergraduate.html" data-th="ปริญญาตรี" data-en="Bachelor's Degree">Bachelor's Degree</a>
        <a href="masters.html" data-th="ปริญญาโท" data-en="Master's Degree">Master's Degree</a>
        <a href="doctoral.html" data-th="ปริญญาเอก" data-en="Doctor of Philosophy">Doctor of Philosophy</a>
      </nav>
    </header>`;

  // Footer = former "LET'S CONNECT" contact block + copyright. The "CONTACT" outline word is drawn in CSS (.site-footer::before).
  const footerTemplate = () => `<footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-intro">
        <img class="footer-cmu-white" src="image/web/cmu-logo-white.png" width="560" height="75" alt="Chiang Mai University" loading="lazy">
      </div>
      <div class="footer-details">
        <div class="footer-row"><span>FON CMU</span><strong data-th="คณะพยาบาลศาสตร์<br>มหาวิทยาลัยเชียงใหม่" data-en="Faculty of Nursing<br>Chiang Mai University" data-lang-html>Faculty of Nursing<br>Chiang Mai University</strong></div>
        <address class="footer-row"><span data-th="ที่อยู่" data-en="Address">Address</span><p data-th="110/406 ถนนอินทวโรรส ตำบลสุเทพ อำเภอเมือง จังหวัดเชียงใหม่ 50200" data-en="110/406 Inthawarorot Road, Suthep, Mueang Chiang Mai, Chiang Mai 50200, Thailand">110/406 Inthawarorot Road, Suthep, Mueang Chiang Mai, Chiang Mai 50200, Thailand</p></address>
        <div class="footer-actions">
          <a href="tel:+6653935024"><span data-th="ติดต่องานรับเข้าศึกษา" data-en="Contact Admisstion team.">Tel.</span><strong>+66 5393 5025 <i aria-hidden="true">↗</i></strong></a>
          <a href="https://www.nurse.cmu.ac.th" target="_blank" rel="noopener"><span data-th="เว็บไซต์คณะ" data-en="Faculty website">Faculty website</span><strong>nurse.cmu.ac.th <i aria-hidden="true">↗</i></strong></a>
        </div>
      </div>
    </div>
    <div class="container footer-bottom"><span>© 2026 Faculty of Nursing, Chiang Mai University</span><span data-i18n="footerNote">Empowering Future Nurses with Pride and Professionalism</span></div>
  </footer>
  <a class="back-to-top" href="#main-content" aria-label="Back to top" data-th="กลับขึ้นด้านบน ↑" data-en="Back to top ↑">Back to top ↑</a>`;

  const mount = (selector, html) => {
    const current = document.querySelector(selector);
    if (current) current.outerHTML = html;
  };
  mount("header.site-header", headerTemplate());
  mount("footer.site-footer", footerTemplate());

  // Mark the menu item of the page being viewed (IPAS belongs to the Bachelor's section).
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const section = file === "ipas.html" ? "undergraduate.html" : file;
  document.querySelectorAll(".desktop-nav a, .mobile-nav a").forEach(link => {
    if ((link.getAttribute("href") || "").toLowerCase() === section) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
})();
