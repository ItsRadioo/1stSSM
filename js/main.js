"use strict";

/**
 * Mobile navigation
 */
const menuButton = document.querySelector("#menuButton");
const siteNav = document.querySelector("#siteNav");

if (menuButton && siteNav) {
  menuButton.addEventListener("click", () => {
    const isExpanded =
      menuButton.getAttribute("aria-expanded") === "true";

    menuButton.setAttribute(
      "aria-expanded",
      String(!isExpanded)
    );

    siteNav.classList.toggle("is-open", !isExpanded);

    const menuText =
      menuButton.querySelector(".sr-only");

    if (menuText) {
      menuText.textContent =
        isExpanded
          ? "Open navigation menu"
          : "Close navigation menu";
    }
  });

  siteNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");

      const menuText =
        menuButton.querySelector(".sr-only");

      if (menuText) {
        menuText.textContent = "Open navigation menu";
      }
    });
  });
}

/**
 * Current copyright year
 */
const yearElement = document.querySelector("#year");

if (yearElement) {
  yearElement.textContent =
    String(new Date().getFullYear());
}

/**
 * Uniform-section selector
 */
const uniformSection =
  document.querySelector("#uniformSection");

const uniformPanels =
  document.querySelectorAll("[data-uniform-panel]");

function showUniformPanel(sectionName) {
  uniformPanels.forEach(panel => {
    const isSelected =
      panel.dataset.uniformPanel === sectionName;

    panel.hidden = !isSelected;
  });
}

if (uniformSection && uniformPanels.length > 0) {
  showUniformPanel(uniformSection.value);

  uniformSection.addEventListener("change", event => {
    showUniformPanel(event.target.value);

    const visiblePanel = document.querySelector(
      `[data-uniform-panel="${event.target.value}"]`
    );

    if (visiblePanel) {
      visiblePanel.focus({
        preventScroll: true
      });
    }
  });
}
