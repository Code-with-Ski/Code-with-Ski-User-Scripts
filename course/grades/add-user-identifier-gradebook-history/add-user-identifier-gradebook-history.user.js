// ==UserScript==
// @name         Add User Identifier - Gradebook History
// @namespace    https://github.com/Code-with-Ski/Code-with-Ski-User-Scripts/course/grades/add-user-identifier-gradebook-history
// @version      1.0.0
// @description  Loads additional information about users in the search results
// @author       James Sekcienski, Code with Ski
// @match      https://*.instructure.com/courses/*/gradebook/history
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

  let searchInput;

  if (
    isApprovedUser &&
    /^\/courses\/[0-9]+\/gradebook\/history/.test(window.location.pathname)
  ) {
    watchForStudentSearchInput();
  }

  function watchForStudentSearchInput() {
    const studentSearchInput = document.querySelector("input#students");
    if (studentSearchInput) {
      searchInput = studentSearchInput;
      watchForStudentSearchList();
    } else {
      const observer = new MutationObserver((mutations) => {
        const addedStudentSearchInput =
          document.querySelector("input#students");
        if (addedStudentSearchInput) {
          searchInput = addedStudentSearchInput;
          watchForStudentSearchList();
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function watchForStudentSearchList() {
    const inputDescribedBy = searchInput?.getAttribute("aria-describedby");
    const inputListId = inputDescribedBy.replace("-description", "-list");
    const studentSearchList = document.getElementById(inputListId);
    if (studentSearchList) {
      watchForStudentSearchListItems(studentSearchList);
      watchForRemovedStudentSearchList(studentSearchList);
    } else {
      const observer = new MutationObserver((mutations) => {
        const addedStudentSearchList = document.getElementById(inputListId);
        if (addedStudentSearchList) {
          watchForStudentSearchListItems(addedStudentSearchList);
          watchForRemovedStudentSearchList(addedStudentSearchList);
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function watchForStudentSearchListItems(studentSearchList) {
    const studentSearchListItems = [
      ...studentSearchList.querySelectorAll("li:not(:has(.skius-added-data)"),
    ];
    if (studentSearchListItems) {
      updateListItems(studentSearchListItems);
    }

    const observer = new MutationObserver((mutations) => {
      if (
        mutations.some((mutation) => {
          const hasAddedNodes =
            !!mutation.addedNodes && mutation.addedNodes.length > 0;
          return hasAddedNodes;
        })
      ) {
        const addedStudentSearchListItems = [
          ...studentSearchList.querySelectorAll(
            "li:not(:has(.skius-added-data)"
          ),
        ];
        if (addedStudentSearchListItems) {
          updateListItems(addedStudentSearchListItems);
        }
      }
    });

    observer.observe(studentSearchList, { childList: true, subtree: true });
  }

  function watchForRemovedStudentSearchList(studentSearchList) {
    const observer = new MutationObserver((mutations) => {
      const isRemoved = mutations.some((mutation) => {
        const isListRemoved =
          !!mutation.removedNodes &&
          !document.getElementById(studentSearchList.id);
        return isListRemoved;
      });

      if (isRemoved) {
        watchForStudentSearchList();
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
    const userSpan = item.querySelector("span");
    if (!userSpan) {
      return;
    }

    const userId = userSpan.id;
    if (userId == "~~empty-option~~") {
      return;
    }

    const [isSuccess, result] = await getUser(userId);
    if (!isSuccess) {
      return;
    }

    const addedData = item.querySelector(".skius-added-data");
    if (addedData) {
      return;
    }
    const userDataToAdd =
      result[selectedDataOption] ??
      `Missing ${dataOptions[selectedDataOption]}`;

    userSpan.insertAdjacentHTML(
      "afterend",
      `<span class="skius-added-data" style="font-size: 0.875rem; padding: 0.5rem 0.75rem 0;">${userDataToAdd}</span>`
    );
    item.title = `${userSpan.innerText} (${userDataToAdd})`;
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
