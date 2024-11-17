// ==UserScript==
// @name         Add User Identifier - Canvas Inbox
// @namespace    https://github.com/Code-with-Ski/Code-with-Ski-User-Scripts/inbox/add-user-identifier
// @version      1.0.0
// @description  Loads additional information about users in the search results
// @author       James Sekcienski, Code with Ski
// @match      https://*.instructure.com/conversations*
// ==/UserScript==

"use strict";

(() => {
  const dataOptions = {
    short_name: "display name",
    sis_user_id: "SIS ID",
    login_id: "login ID",
    primary_email: "email",
  };
  const selectedDataOption = "primary_email";

  const approvedUserRoles = ["admin", "teacher"];
  const isApprovedUser = approvedUserRoles.some((userRole) => {
    return ENV.current_user_roles?.includes(userRole);
  });

  let courseId;

  if (isApprovedUser && /^\/conversations/.test(window.location.pathname)) {
    watchForSendToList();
  }

  function watchForSendToList() {
    const sendToList = document.querySelector(
      "ul[data-testid='address-book-popover']"
    );
    if (sendToList) {
      watchForSendToListItems(sendToList);
      watchForRemovedSendToList(sendToList);
    } else {
      const observer = new MutationObserver((mutations) => {
        const addedSendToList = document.querySelector(
          "ul[data-testid='address-book-popover']"
        );
        if (addedSendToList) {
          watchForSendToListItems(addedSendToList);
          watchForRemovedSendToList(addedSendToList);
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function watchForSendToListItems(sendToList) {
    const sendToListItems = [
      ...sendToList.querySelectorAll(
        "div[data-testid='address-book-item'] li:not(.skius-updated)"
      ),
    ];
    if (sendToListItems) {
      updateListItems(sendToListItems);
    }

    const observer = new MutationObserver((mutations) => {
      if (
        mutations.some((mutation) => {
          const hasAddedNodes =
            !!mutation.addedNodes && mutation.addedNodes.length > 0;
          return hasAddedNodes;
        })
      ) {
        const addedSendToListItems = [
          ...sendToList.querySelectorAll(
            "div[data-testid='address-book-item'] li:not(.skius-updated)"
          ),
        ];
        if (addedSendToListItems) {
          updateListItems(addedSendToListItems);
        }
      }
    });

    observer.observe(sendToList, { childList: true, subtree: true });
  }

  function watchForRemovedSendToList(sendToList) {
    const observer = new MutationObserver((mutations) => {
      const isRemoved = mutations.some((mutation) => {
        const isListRemoved =
          !!mutation.removedNodes && !document.getElementById(sendToList.id);
        return isListRemoved;
      });

      if (isRemoved) {
        watchForSendToList();
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function updateListItems(listItems) {
    for (const item of listItems) {
      updateListItem(item);
    }
  }

  async function updateListItem(item) {
    if (item.classList.contains("skius-updated")) {
      return;
    }

    item.classList.add("skius-updated");

    const id = item.id;
    if (/^address-book-menu-item-/.test(id) && /-user$/.test(id)) {
      const encodedId = id
        .replace("address-book-menu-item-", "")
        .replace("-user", "");
      const decodedId = atob(encodedId);
      if (/^MessageableUser-/.test(decodedId)) {
        const userId = decodedId.replace("MessageableUser-", "");
        const [isSuccess, result] = await getUser(userId);
        if (!isSuccess) {
          item.classList.remove("skius-updated");
          return;
        } else {
          const userDataToAdd =
            result[selectedDataOption] ??
            `Missing ${dataOptions[selectedDataOption]}`;

          const nameSpan = item.querySelector(`span[class$="-truncateText"]`);
          if (!nameSpan) {
            return;
          }
          nameSpan.insertAdjacentHTML(
            "afterend",
            `<span class="skius-added-data" style="font-size: 0.875rem;">${userDataToAdd}</span><br />`
          );
          item.title = `${nameSpan.innerText} (${userDataToAdd})`;
        }
      }
    }
  }

  async function getUser(userId) {
    return await fetch(`/api/v1/users/${userId}/profile`)
      .then(async (response) => {
        if (response.ok) {
          const responseJson = await response.json();
          return [true, responseJson];
        } else {
          return [
            false,
            { statusCode: response.status, statusText: response.statusText },
          ];
        }
      })
      .catch((error) => {
        console.error(`Error: ${error}`);
        return [false, error];
      });
  }
})();
