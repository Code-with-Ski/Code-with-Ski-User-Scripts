// ==UserScript==
// @name         Bulk Update Enrollment States
// @namespace    https://github.com/Code-with-Ski/Code-with-Ski-User-Scripts/course/people/bulk-update-enrollment-states
// @version      1.0.0
// @description  Adds ability to bulk update enrollments
// @author       James Sekcienski, Code with Ski
// @match      https://*.instructure.com/courses/*/users*
// ==/UserScript==

(function () {
  "use strict";

  const approvedUserTypes = ["AccountAdmin"];
  const approvedUserRoles = ["teacher"];
  const isApprovedUser =
    approvedUserTypes.some((userType) => {
      return ENV.current_user_types?.includes(userType);
    }) ||
    approvedUserRoles.some((userRole) => {
      return ENV.current_user_roles?.includes(userRole);
    });

  const activeGranularEnrollmentPermissions =
    ENV?.permissions?.active_granular_enrollment_permissions ?? [];
  const hasPermission =
    activeGranularEnrollmentPermissions &&
    activeGranularEnrollmentPermissions.length > 0;

  const allowUpdatingSisEnrollments = false;

  const sections = ENV?.SECTIONS ?? [];
  const sectionsDictionary = {};
  for (const section of sections) {
    sectionsDictionary[section?.id] = section?.name;
  }

  if (
    isApprovedUser &&
    hasPermission &&
    /^\/courses\/[0-9]+\/users\??[^\/]*\/?$/.test(window.location.pathname)
  ) {
    watchForPeopleOptionsMenu();
  }

  function watchForPeopleOptionsMenu() {
    const peopleOptionMenu = document.querySelector("#people-options ul");
    if (peopleOptionMenu) {
      addBulkUpdateElements(peopleOptionMenu);
    } else {
      const observer = new MutationObserver((mutations) => {
        const addedMenu = document.querySelector("#people-options ul");
        if (addedMenu) {
          addBulkUpdateElements(addedMenu);
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function addBulkUpdateElements(peopleOptionsMenu) {
    addBulkUpdateMenuOption(peopleOptionsMenu);
    addDialog();
  }

  function addBulkUpdateMenuOption(peopleOptionsMenu) {
    const bulkUpdateOption = createBulkUpdateOption();
    peopleOptionsMenu.insertAdjacentElement("beforeend", bulkUpdateOption);
  }

  function addDialog() {
    const dialog = createDialog();
    const content = document.getElementById("content");
    content.append(dialog);
  }

  function createBulkUpdateOption() {
    const option = document.createElement("li");
    option.classList.add("ui-menu-item");
    option.setAttribute("role", "presentation");

    const anchor = document.createElement("a");
    anchor.href = "#";
    anchor.classList.add("ui-corner-all");
    anchor.setAttribute("tabindex", -1);
    anchor.setAttribute("role", "menuitem");
    anchor.insertAdjacentHTML(
      "afterbegin",
      `
      <i class="icon-edit" aria-hidden="true"></i> Update Enrollment States
    `
    );
    anchor.addEventListener("click", () => {
      openDialog();
    });

    option.append(anchor);

    return option;
  }

  function openDialog() {
    const dialog = document.getElementById("skius-bulk-update-dialog");
    dialog?.showModal();
  }

  function createDialog() {
    const dialog = document.createElement("dialog");
    dialog.id = "skius-bulk-update-dialog";
    dialog.style.minWidth = "50vw";
    dialog.style.maxHeight = "90vh";
    dialog.style.padding = 0;
    dialog.style.resize = "both";
    dialog.style.overflow = "hidden";

    const wrapper = document.createElement("div");
    wrapper.style.padding = 0;
    wrapper.style.height = "100%";
    wrapper.style.maxHeight = "90vh";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";

    wrapper.append(createDialogHeader(dialog, "Bulk Update Enrollment States"));
    wrapper.append(createDialogBody(dialog));
    wrapper.append(createDialogFooter(dialog));

    dialog.append(wrapper);

    return dialog;
  }

  function createDialogHeader(dialog, title) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "space-between";
    wrapper.style.backgroundColor = "#fdfdfd";
    wrapper.style.borderBottom = "1px solid black";
    wrapper.style.padding = "0.75rem";

    const header = document.createElement("h2");
    header.innerText = title;

    const closeButton = document.createElement("button");
    closeButton.classList.add("skius-button", "Button", "skius-do-not-disable");
    closeButton.innerText = "X";
    closeButton.title = "Close";
    closeButton.style.padding = "0.25rem 1rem";
    closeButton.addEventListener("click", () => {
      dialog.close();
    });

    wrapper.append(header);
    wrapper.append(closeButton);
    return wrapper;
  }

  function createDialogBody(dialog) {
    const wrapper = document.createElement("div");
    wrapper.style.padding = "1rem";
    wrapper.style.overflow = "auto";
    wrapper.style.flex = "1 1 auto";

    const updateSettingsWrapper = createUpdateSettings();
    const loadButton = createLoadButton();
    const loadingWrapper = createLoadingMessagesWrapper();
    const table = createTable();

    wrapper.insertAdjacentHTML(
      "afterbegin",
      `
      <details style="margin-bottom: 1rem;">
        <summary>About/How to Use</summary>
        <p>Use this tool to bulk update enrollment states for users. Use the select options to configure the type of bulk update you want to make. Then, click "Load Enrollments" and it will load in the relevant enrollments to potentially change.</p>
        <p>After the enrollments are loaded in, they are all selected to be updated by default. You can uncheck enrollments that you don't want to update.  When ready, click "Update" and confirm to begin the update process. If the update is succcessful, it will remove that row from the table. If there is an error, it will remain in the table and an error message will be loaded in the loading messages.</p>
      </details>
    `
    );

    wrapper.append(updateSettingsWrapper);
    wrapper.append(loadButton);
    wrapper.append(loadingWrapper);
    wrapper.append(table);
    return wrapper;
  }

  function createUpdateSettings() {
    const wrapper = document.createElement("div");
    wrapper.id = "skius-enrollments-update-settings";

    const typeLabel = document.createElement("label");
    typeLabel.innerText = "Select Type of Users to Update: ";
    typeLabel.style.display = "block";
    const typeSelect = document.createElement("select");
    typeSelect.id = "skius-select-enrollment-type";
    addManageableUserTypeOptions(typeSelect);
    typeLabel.append(typeSelect);

    const sectionLabel = document.createElement("label");
    sectionLabel.innerText = "Select Section (or All) to Update: ";
    sectionLabel.style.display = "block";
    const sectionSelect = document.createElement("select");
    sectionSelect.id = "skius-select-enrollment-section";
    addSectionOptions(sectionSelect);
    sectionLabel.append(sectionSelect);

    const updateLabel = document.createElement("label");
    updateLabel.innerText = "Select Enrollment State Change: ";
    updateLabel.style.display = "block";
    const updateSelect = document.createElement("select");
    updateSelect.id = "skius-select-enrollment-state-change";
    addUpdateOptions(updateSelect);
    updateLabel.append(updateSelect);

    wrapper.append(typeLabel);
    wrapper.append(sectionLabel);
    wrapper.append(updateLabel);

    return wrapper;
  }

  function addManageableUserTypeOptions(select) {
    for (const role of activeGranularEnrollmentPermissions) {
      select.insertAdjacentHTML(
        "beforeend",
        `
        <option value='${role}'${
          role == "StudentEnrollment" ? " selected" : ""
        }>${role.replace("Enrollment", " Based Enrollments")}</option>
      `
      );
    }
  }

  function addSectionOptions(select) {
    select.insertAdjacentHTML(
      "beforeend",
      `
      <option value='' selected>All Sections</option>
    `
    );

    for (const section of sections) {
      select.insertAdjacentHTML(
        "beforeend",
        `
        <option value='${section?.id}'>${section?.name}</option>
      `
      );
    }
  }

  function addUpdateOptions(select) {
    const options = [
      {
        value: "active|inactivate",
        name: "Active to Inactive",
        selected: true,
      },
      { value: "active|delete", name: "Active to Deleted" },
      { value: "active|conclude", name: "Active to Concluded" },
      { value: "inactive|active", name: "Inactive to Active" },
      { value: "completed|active", name: "Concluded to Active" },
      { value: "completed|inactive", name: "Concluded to Inactive" },
      { value: "deleted|inactive", name: "Deleted to Inactive" },
      { value: "deleted|active", name: "Deleted to Active" },
    ];
    for (const option of options) {
      select.insertAdjacentHTML(
        "beforeend",
        `
        <option value='${option?.value}'${
          option?.selected ? " selected" : "'"
        }>${option?.name}</option>
      `
      );
    }
  }

  function createLoadButton() {
    const button = document.createElement("button");
    button.classList.add("skius", "Button", "Button--secondary");
    button.innerText = "Load Enrollments";
    button.style.marginBottom = "1rem";
    button.addEventListener("click", () => {
      loadEnrollments();
    });

    return button;
  }

  function createLoadingMessagesWrapper() {
    const wrapper = document.createElement("div");

    const headingWrapper = document.createElement("div");
    headingWrapper.style.display = "flex";
    headingWrapper.style.justifyContent = "space-between";

    const heading = document.createElement("h3");
    heading.innerText = "Loading Messages";

    const clearButton = document.createElement("button");
    clearButton.innerText = "Clear Messages";
    clearButton.classList.add("skius-button", "Button");
    clearButton.addEventListener("click", () => {
      updateLoadingMessage("clear");
    });

    const messagesWrapper = document.createElement("div");
    messagesWrapper.id = "skius-update-enrollments-loading-messages";
    messagesWrapper.style.borderTop = "1px solid gray";
    messagesWrapper.style.maxHeight = "120px";
    messagesWrapper.style.overflow = "auto";
    messagesWrapper.style.marginBottom = "1rem";

    headingWrapper.append(heading);
    headingWrapper.append(clearButton);
    wrapper.append(headingWrapper);
    wrapper.append(messagesWrapper);
    return wrapper;
  }

  function createTable() {
    const wrapper = document.createElement("div");
    wrapper.style.overflow = "auto";
    wrapper.style.maxHeight = "300px";

    const table = document.createElement("table");
    table.classList.add(
      "skius-table",
      "ic-Table",
      "ic-Table--hover-row",
      "ic-Table--striped"
    );
    table.id = "skius-enrollments";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const selectAllTh = document.createElement("th");
    selectAllTh.style.position = "sticky";
    selectAllTh.style.top = "0px";
    selectAllTh.style.backgroundColor = "#ffffff";
    const selectAllLabel = document.createElement("label");
    selectAllLabel.innerHTML = `<span class='screenreader-only'>Check All/Uncheck All</span>`;
    const selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.checked = true;
    selectAllCheckbox.title = "Click to uncheck all enrollments for update";
    selectAllCheckbox.addEventListener("click", () => {
      const checkboxes = [
        ...document.querySelectorAll(
          "#skius-enrollments tbody input.skius-update-checkbox"
        ),
      ];
      const isChecked = selectAllCheckbox.checked;
      for (const checkbox of checkboxes) {
        checkbox.checked = isChecked;
      }

      if (isChecked) {
        selectAllCheckbox.title = "Click to uncheck all enrollments to update";
      } else {
        selectAllCheckbox.title = "Click to check all enrollments to update";
      }
    });
    selectAllLabel.append(selectAllCheckbox);
    selectAllTh.append(selectAllLabel);
    headerRow.append(selectAllTh);
    headerRow.insertAdjacentHTML(
      "beforeend",
      `
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Name</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Email</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Section</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Role</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Enrollment State</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Last Activity</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Total Activity Time</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Enrolled At</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Updated At</th>
    `
    );
    thead.append(headerRow);

    const tbody = document.createElement("tbody");

    table.append(thead);
    table.append(tbody);

    wrapper.append(table);
    return wrapper;
  }

  function createDialogFooter(dialog) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "right";
    wrapper.style.backgroundColor = "#dbdbdb";
    wrapper.style.borderTop = "1px solid black";
    wrapper.style.padding = "0.75rem";

    const closeButton = document.createElement("button");
    closeButton.classList.add("skius-button", "Button", "skius-do-not-disable");
    closeButton.innerText = "Close";
    closeButton.addEventListener("click", () => {
      dialog.close();
    });

    const updateButton = document.createElement("button");
    updateButton.classList.add("skius-button", "Button", "Button--primary");
    updateButton.innerText = "Update";
    updateButton.style.marginLeft = "0.5rem";
    updateButton.addEventListener("click", () => {
      updateSelectedEnrollments();
    });

    wrapper.append(closeButton);
    wrapper.append(updateButton);
    return wrapper;
  }

  function updateLoadingMessage(messageType, newMessage) {
    const messageWrapper = document.querySelector(
      "#skius-update-enrollments-loading-messages"
    );
    if (!messageWrapper) {
      return;
    }

    if (messageType == "clear") {
      messageWrapper.innerHTML = "";
    } else if (messageType == "success") {
      messageWrapper.innerHTML += `
        <p class='text-success'><i class='icon-line icon-check'></i> ${newMessage}</p>
      `;
    } else if (messageType == "error") {
      messageWrapper.innerHTML = `
        ${messageWrapper.innerHTML}
        <p class='text-error'><i class='icon-line icon-warning'></i> ${newMessage}</p>
      `;
    } else {
      messageWrapper.innerHTML += `
        <p class='text-info'><i class='icon-line icon-info'></i> ${newMessage}</p>
      `;
    }

    messageWrapper.scrollTop = messageWrapper.scrollHeight;
  }

  function updateInputsDisabledState(shouldDisable) {
    const inputElements = [
      ...document.querySelectorAll(
        "#skius-bulk-update-dialog button:not(.skius-do-not-disable), #skius-bulk-update-dialog input:not(.skius-do-not-disable)"
      ),
    ];
    for (const inputElement of inputElements) {
      inputElement.disabled = shouldDisable;
    }
  }

  async function loadEnrollments() {
    updateInputsDisabledState(true);
    updateLoadingMessage("clear");
    const table = document.getElementById("skius-enrollments");
    const tableBody = table.querySelector("tbody");
    if (tableBody) {
      tableBody.innerHTML = "";
    }

    updateLoadingMessage("info", "Getting enrollments...");
    const url = createEnrollmentsRequestUrl();
    const enrollments = (await getEnrollments(url)) ?? [];

    updateLoadingMessage("info", "Adding enrollment rows");
    for (const enrollment of enrollments) {
      if (!allowUpdatingSisEnrollments && enrollment?.sis_import_id) {
        // Skip enrollment from SIS Import when updating isn't permitted
        continue;
      }
      addRow(tableBody, enrollment);
    }
    updateLoadingMessage("success", "Finished loading!");

    updateInputsDisabledState(false);
  }

  function addRow(tableBody, enrollment) {
    const row = document.createElement("tr");

    const selectTd = document.createElement("td");
    const selectLabel = document.createElement("label");
    selectLabel.innerHTML = `<span class='screenreader-only'>Check/Uncheck Enrollment</span>`;
    const selectCheckbox = document.createElement("input");
    selectCheckbox.type = "checkbox";
    selectCheckbox.classList.add("skius-update-checkbox");
    selectCheckbox.checked = true;
    selectCheckbox.title = "Click to not select this enrollment to update";
    selectCheckbox.addEventListener("click", () => {
      if (selectCheckbox.checked) {
        selectCheckbox.title = "Click to not select this enrollment to update";
      } else {
        selectCheckbox.title = "Click to select this enrollment to update";
      }
    });
    selectCheckbox.dataset.enrollmentId = enrollment?.id;
    selectCheckbox.dataset.userId = enrollment?.user_id;
    selectCheckbox.dataset.roleType = enrollment?.type;
    selectCheckbox.dataset.roleId = enrollment?.role_id;
    selectCheckbox.dataset.sectionId = enrollment?.course_section_id;
    selectCheckbox.dataset.limitToSection =
      enrollment?.limit_privileges_to_course_section;
    selectLabel.append(selectCheckbox);
    selectTd.append(selectLabel);
    row.append(selectTd);

    const sectionName =
      sectionsDictionary[enrollment?.course_section_id ?? 0] ??
      "UNKNOWN SECTION NAME";

    row.insertAdjacentHTML(
      "beforeend",
      `
      <td title="${enrollment?.user?.name}">${
        enrollment?.user?.short_name ?? "MISSING DISPLAY NAME"
      }</td>
      <td>${enrollment?.user?.email}</td>
      <td>${sectionName}</td>
      <td>${enrollment?.role}</td>
      <td>${enrollment?.enrollment_state}</td>
      <td>${enrollment?.last_activity_at ?? "Never Accessed"}</td>
      <td>${enrollment?.total_activity_time ?? "Never Accessed"}</td>
      <td>${enrollment?.created_at}</td>
      <td>${enrollment?.updated_at}</td>
    `
    );

    tableBody.append(row);
  }

  function createEnrollmentsRequestUrl() {
    const roleType = document.getElementById(
      "skius-select-enrollment-type"
    )?.value;
    const sectionId = document.getElementById(
      "skius-select-enrollment-section"
    )?.value;
    const updateType = document.getElementById(
      "skius-select-enrollment-state-change"
    )?.value;

    if (roleType && updateType) {
      const enrollmentsToGet = updateType.split("|")[0];
      if (sectionId) {
        return `
          ${window.location.protocol}//${window.location.hostname}/api/v1/sections/${sectionId}/enrollments?type[]=${roleType}&state[]=${enrollmentsToGet}&include[]=email&per_page=100
        `;
      } else {
        const courseId = window.location.pathname.split("/")[2];
        return `
          ${window.location.protocol}//${window.location.hostname}/api/v1/courses/${courseId}/enrollments?type[]=${roleType}&state[]=${enrollmentsToGet}&include[]=email&per_page=100
        `;
      }
    }

    updateLoadingMessage("error", "ERROR: Missing expected select value");
    return;
  }

  async function getEnrollments(url, enrollments = [], page = 1) {
    if (!url) {
      updateLoadingMessage(
        "error",
        "ERROR: No URL provided for getEnrollments"
      );
      return enrollments;
    }

    let requestResponse;
    return fetch(url)
      .then((response) => {
        requestResponse = response;
        return response.json();
      })
      .then(async (data) => {
        const links = getRequestLinks(requestResponse);
        enrollments.push(...data);
        if (hasNextPage(links)) {
          page++;
          updateLoadingMessage("info", `Getting enrollments (Page ${page})...`);
          return await getEnrollments(links.next, enrollments, page);
        }
        return enrollments;
      })
      .catch((error) => {
        console.error(`Error: ${error}\nStack Trace: ${error.stack}`);
        updateLoadingMessage(
          "error",
          `Error: ${error}\nStack Trace: ${error.stack}`
        );
        return enrollments;
      });
  }

  function getRequestLinks(response) {
    let links = response.headers.get("link");
    if (!links) {
      return {};
    }

    links = links
      .replaceAll("<", "")
      .replaceAll(">", "")
      .replaceAll(" rel=", "")
      .replaceAll('"', "");
    links = links.split(",");
    links = links.map((link) => link.split(";"));
    const linkDictionary = {};
    links.forEach((link) => (linkDictionary[link[1]] = link[0]));

    const needToHandleJsonUrl = response.url.split("?")[0].includes(".json");
    if (needToHandleJsonUrl) {
      for (const key of Object.keys(linkDictionary)) {
        const link = linkDictionary[key];
        const splitLink = link.split("?");
        if (!splitLink[0].includes(".json")) {
          splitLink[0] = `${splitLink[0]}.json`;
          linkDictionary[key] = splitLink.join("?");
        }
      }
    }

    return linkDictionary;
  }

  function hasNextPage(links) {
    return "next" in links && links["next"] != links["current"];
  }

  async function updateSelectedEnrollments() {
    const roleType = document.getElementById(
      "skius-select-enrollment-type"
    )?.value;
    const updateType = document.getElementById(
      "skius-select-enrollment-state-change"
    )?.value;
    const [currentState, updateState] = updateType.split("|");
    const courseId = window.location.pathname.split("/")[2];

    if (
      !confirm(
        `You are about to update the selected ${roleType.replace(
          "Enrollment",
          " based"
        )} enrollments. Do NOT refresh or leave this page while it is processing or the process will not fully complete.\n\nClick 'OK' to begin processing. Otherwise, click 'Cancel' and no changes will be made.`
      )
    ) {
      return;
    }

    updateInputsDisabledState(true);
    updateLoadingMessage("clear");
    updateLoadingMessage("info", "Preparing to process enrollments to update");
    const rowsToUpdate = [
      ...document.querySelectorAll(
        "#skius-enrollments > tbody > tr:has(input[type='checkbox']:checked)"
      ),
    ];
    const totalRowsToUpdate = rowsToUpdate.length;
    let currentCount = 0;
    for (const row of rowsToUpdate) {
      currentCount++;
      const updateCheckbox = row.querySelector(
        `input[type='checkbox']:checked`
      );
      const enrollmentId = updateCheckbox?.dataset?.enrollmentId;
      updateLoadingMessage(
        "info",
        `Updating enrollment [ID: ${courseId}] (Enrollment ${currentCount} of ${totalRowsToUpdate})`
      );
      let result;
      if (currentState == "active") {
        if (["conclude", "delete", "inactivate"].includes(updateState)) {
          result = await endEnrollment(courseId, enrollmentId, updateState);
        } else {
          updateLoadingMessage(
            "error",
            `ERROR: Invalid update state for handling (Update State: ${updateState})`
          );
        }
      } else if (currentState == "inactive") {
        if (updateState == "active") {
          result = await reactivateEnrollment(courseId, enrollmentId);
        } else {
          updateLoadingMessage(
            "error",
            `ERROR: Invalid update state for handling (Update State: ${updateState})`
          );
        }
      } else if (currentState == "completed" || currentState == "deleted") {
        if (updateState == "active" || updateState == "inactive") {
          const userId = updateCheckbox?.dataset?.userId;
          const roleType = updateCheckbox?.dataset?.roleType;
          const roleId = updateCheckbox?.dataset?.roleId;
          const sectionId = updateCheckbox?.dataset?.sectionId;
          const limitToSection = updateCheckbox?.dataset?.limitToSection;
          const params = {
            enrollment: {
              user_id: userId,
              type: roleType,
              role_id: roleId,
              enrollment_state: updateState,
              course_section_id: sectionId,
              limit_privileges_to_course_section: limitToSection,
            },
          };
          result = await addEnrollment(courseId, params);
        } else {
          updateLoadingMessage(
            "error",
            `ERROR: Invalid update state for handling (Update State: ${updateState})`
          );
        }
      } else {
        updateLoadingMessage(
          "error",
          `ERROR: Invalid current state for handling (Current State: ${currentState})`
        );
      }
      if (result) {
        row.remove();
      } else {
        updateLoadingMessage(
          "error",
          `ERROR: Failed to update enrollment [ID: ${courseId}]`
        );
      }
    }
    updateLoadingMessage("success", `Finished updating enrollments!`);

    updateInputsDisabledState(false);
  }

  async function addEnrollment(courseId, params = {}) {
    const CSRFtoken = function () {
      return decodeURIComponent(
        (document.cookie.match("(^|;) *_csrf_token=([^;]*)") || "")[2]
      );
    };

    const requestHeaders = {
      "X-CSRF-Token": CSRFtoken(),
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const requestUrl = new URL(
      `${window.location.protocol}//${window.location.hostname}/api/v1/courses/${courseId}/enrollments`
    );

    return await fetch(requestUrl, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(params),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw `Request failed: ${requestUrl} Status: ${response.statusText} (${response.status})`;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  async function endEnrollment(courseId, enrollmentId, endType) {
    const CSRFtoken = function () {
      return decodeURIComponent(
        (document.cookie.match("(^|;) *_csrf_token=([^;]*)") || "")[2]
      );
    };

    const requestHeaders = {
      "X-CSRF-Token": CSRFtoken(),
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const requestUrl = new URL(
      `${window.location.protocol}//${window.location.hostname}/api/v1/courses/${courseId}/enrollments/${enrollmentId}`
    );
    const params = {
      task: endType,
    };

    return await fetch(requestUrl, {
      method: "DELETE",
      headers: requestHeaders,
      body: JSON.stringify(params),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw `Request failed: ${requestUrl} Status: ${response.statusText} (${response.status})`;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  async function reactivateEnrollment(courseId, enrollmentId) {
    const CSRFtoken = function () {
      return decodeURIComponent(
        (document.cookie.match("(^|;) *_csrf_token=([^;]*)") || "")[2]
      );
    };

    const requestHeaders = {
      "X-CSRF-Token": CSRFtoken(),
    };

    const requestUrl = new URL(
      `${window.location.protocol}//${window.location.hostname}/api/v1/courses/${courseId}/enrollments/${enrollmentId}/reactivate`
    );

    return await fetch(requestUrl, {
      method: "PUT",
      headers: requestHeaders,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw `Request failed: ${requestUrl} Status: ${response.statusText} (${response.status})`;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
})();
