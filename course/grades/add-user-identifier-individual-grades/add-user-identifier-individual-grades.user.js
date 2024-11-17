// ==UserScript==
// @name         Add User Identifier - Individual Gradebook
// @namespace    https://github.com/Code-with-Ski/Code-with-Ski-User-Scripts/course/grades/add-user-identifier-individual-grades
// @version      1.0.0
// @description  Loads additional information about the student next to their name
// @author       James Sekcienski, Code with Ski
// @match      https://*.instructure.com/courses/*/grades/*
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

  if (
    isApprovedUser &&
    /^\/courses\/[0-9]+\/grades\/[0-9]+/.test(window.location.pathname)
  ) {
    watchForNameHeading();
  }

  function watchForNameHeading() {
    const nameHeading = document.querySelector("#grade-summary-content h1");
    if (nameHeading) {
      addUserIdentifier(nameHeading);
    } else {
      const observer = new MutationObserver((mutations) => {
        const addedNameHeading = document.querySelector(
          "#grade-summary-content h1"
        );
        if (addedNameHeading) {
          addUserIdentifier(addedNameHeading);
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  async function addUserIdentifier(nameHeading) {
    const userId = window.location.pathname.split("/")[4];
    const [isSuccess, result] = await getUser(userId);
    if (!isSuccess) {
      return;
    }

    const userDataToAdd =
      result[selectedDataOption] ??
      `Missing ${dataOptions[selectedDataOption]}`;

    nameHeading.insertAdjacentHTML(
      "afterend",
      `<span class="skius-added-data" style="font-size: 0.875rem;">${userDataToAdd}</span>`
    );
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
