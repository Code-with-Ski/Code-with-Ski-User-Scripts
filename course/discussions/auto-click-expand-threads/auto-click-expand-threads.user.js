// ==UserScript==
// @name         Auto-Click Expand Threads
// @namespace    https://github.com/Code-with-Ski/Code-with-Ski-User-Scripts/course/discussions/auto-click-expand-threads
// @version      1.0.0
// @description  Automatically clicks the expand threads button
// @author       James Sekcienski, Code with Ski
// @match      https://*.instructure.com/courses/*/discussion_topics/*
// ==/UserScript==

(function () {
  "use strict";

  if (
    /^\/courses\/[0-9]+\/discussion_topics\/[0-9]+\??[^\/]*\/?$/.test(
      window.location.pathname
    )
  ) {
    watchForExpandThreadsButton();
  }

  function watchForExpandThreadsButton() {
    const expandThreadsButton = document.querySelector(
      "#content button[data-testid=ExpandCollapseThreads-button]"
    );
    if (expandThreadsButton) {
      updateExpandThreadsButton(expandThreadsButton);
      watchForRemovedExpandThreadsButton(expandThreadsButton);
    } else {
      const observer = new MutationObserver((mutations) => {
        const addedButton = document.querySelector(
          "#content button[data-testid=ExpandCollapseThreads-button]"
        );
        if (addedButton) {
          updateExpandThreadsButton(addedButton);
          watchForRemovedExpandThreadsButton(addedButton);
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function updateExpandThreadsButton(button) {
    const expandIcon = button.querySelector("svg[name=IconCollapse]");
    if (!expandIcon) {
      return;
    }

    button.click();
  }

  function watchForRemovedExpandThreadsButton(button) {
    const observer = new MutationObserver((mutations) => {
      watchForExpandThreadsButton();
      observer.disconnect();
    });

    observer.observe(button, { attributes: true });
  }
})();
