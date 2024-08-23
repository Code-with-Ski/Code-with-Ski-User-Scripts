// ==UserScript==
// @name         Bulk Publish Courses
// @namespace    https://github.com/Code-with-Ski/Code-with-Ski-User-Scripts/admin/courses/bulk-publish-courses
// @version      1.0.0
// @description  Adds ability to bulk publish courses
// @author       James Sekcienski, Code with Ski
// @match      https://*.instructure.com/accounts/*
// ==/UserScript==

(function () {
  "use strict";

  const approvedUserTypes = ["AccountAdmin"];
  const isApprovedUser = approvedUserTypes.some((userType) => {
    return ENV.current_user_types?.includes(userType);
  });

  if (
    isApprovedUser &&
    /^\/accounts\/[0-9]+\??[^\/]*\/?$/.test(window.location.pathname)
  ) {
    watchForSearchForm();
  }

  function watchForSearchForm() {
    const searchForm = document.querySelector("#content form");
    if (searchForm) {
      addBulkPublishElements(searchForm);
    } else {
      const observer = new MutationObserver((mutations) => {
        const addedForm = document.querySelector("#content form");
        if (addedForm) {
          addBulkPublishElements(addedForm);
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function addBulkPublishElements(searchForm) {
    addBulkPublishButton(searchForm);
    addBulkPublishDialog();
  }

  function addBulkPublishButton(searchForm) {
    const bulkPublishButton = createBulkPublishButton();
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "1rem";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "right";
    wrapper.append(bulkPublishButton);

    searchForm.insertAdjacentElement("beforebegin", wrapper);
  }

  function addBulkPublishDialog() {
    const bulkPublishDialog = createBulkPublishDialog();
    const content = document.getElementById("content");
    content.append(bulkPublishDialog);
  }

  function createBulkPublishButton() {
    const button = document.createElement("button");
    button.classList.add("skius-button", "Button");
    button.innerText = "Bulk Publish";
    button.addEventListener("click", openBulkPublishDialog);

    return button;
  }

  function openBulkPublishDialog() {
    const dialog = document.getElementById("skius-bulk-publish-dialog");
    dialog?.showModal();
  }

  function createBulkPublishDialog() {
    const dialog = document.createElement("dialog");
    dialog.id = "skius-bulk-publish-dialog";
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

    wrapper.append(createDialogHeader(dialog, "Bulk Publish Courses"));
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

    const loadButton = createLoadCoursesButton();
    const loadingWrapper = createLoadingMessagesWrapper();
    const table = createCoursesTable();

    wrapper.insertAdjacentHTML(
      "afterbegin",
      `
      <details style="margin-bottom: 1rem;">
        <summary>About/How to Use</summary>
        <p>Use this tool to publish courses in bulk. Using the "Load Unpublished Courses" button below will retrieve all unpublished courses based on the current course search criteria. You can close this dialog and change the search criteria (i.e. select a different term, enter a different search query).  When you open this dialog again and click the button to "Load Unpublished Courses" it will re-load the table based on the courses that match the updated search criteria.</p>
        <p>Use the checkboxes in the table to select the courses that you want to publish.  By default it will select all and you can use the checkbox in the first column heading to check all/uncheck all. When you click "Publish Courses", it will publish all the selected courses. It will remove course rows when they are successfully published. If any selected courses fail to publish, there will be an error message logged and that selected course row will remain in the table.</p>
      </details>
    `
    );

    wrapper.append(loadButton);
    wrapper.append(loadingWrapper);
    wrapper.append(table);
    return wrapper;
  }

  function createLoadCoursesButton() {
    const button = document.createElement("button");
    button.classList.add("skius", "Button", "Button--secondary");
    button.innerText = "Load Unpublished Courses";
    button.style.marginBottom = "1rem";
    button.addEventListener("click", () => {
      loadCourses();
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
    messagesWrapper.id = "skius-publish-courses-loading-messages";
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

  function createCoursesTable() {
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
    table.id = "skius-courses-to-publish";

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
    selectAllCheckbox.title = "Click to uncheck all courses to publish";
    selectAllCheckbox.addEventListener("click", () => {
      const checkboxes = [
        ...document.querySelectorAll(
          "#skius-courses-to-publish tbody input.skius-publish-checkbox"
        ),
      ];
      const isChecked = selectAllCheckbox.checked;
      for (const checkbox of checkboxes) {
        checkbox.checked = isChecked;
      }

      if (isChecked) {
        selectAllCheckbox.title = "Click to uncheck all courses to publish";
      } else {
        selectAllCheckbox.title = "Click to check all courses to publish";
      }
    });
    selectAllLabel.append(selectAllCheckbox);
    selectAllTh.append(selectAllLabel);
    headerRow.append(selectAllTh);
    headerRow.insertAdjacentHTML(
      "beforeend",
      `
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Course Name</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Course Code</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">SIS Course ID</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Workflow State</th>
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

    const publishButton = document.createElement("button");
    publishButton.classList.add("skius-button", "Button", "Button--primary");
    publishButton.innerText = "Publish";
    publishButton.style.marginLeft = "0.5rem";
    publishButton.addEventListener("click", () => {
      publishSelectedCourses();
    });

    wrapper.append(closeButton);
    wrapper.append(publishButton);
    return wrapper;
  }

  function updateLoadingMessage(messageType, newMessage) {
    const messageWrapper = document.querySelector(
      "#skius-publish-courses-loading-messages"
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
        "#skius-bulk-publish-dialog button:not(.skius-do-not-disable), #skius-bulk-publish-dialog input:not(.skius-do-not-disable)"
      ),
    ];
    for (const inputElement of inputElements) {
      inputElement.disabled = shouldDisable;
    }
  }

  async function loadCourses() {
    updateInputsDisabledState(true);
    updateLoadingMessage("clear");
    const table = document.getElementById("skius-courses-to-publish");
    const tableBody = table.querySelector("tbody");
    if (tableBody) {
      tableBody.innerHTML = "";
    }

    updateLoadingMessage("info", "Getting courses...");
    const courses = (await getCourses()) ?? [];

    updateLoadingMessage("info", "Adding course rows");
    for (const course of courses) {
      addRow(tableBody, course);
    }
    updateLoadingMessage("success", "Finished loading!");

    updateInputsDisabledState(false);
  }

  function addRow(tableBody, course) {
    const row = document.createElement("tr");

    const selectTd = document.createElement("td");
    const selectLabel = document.createElement("label");
    selectLabel.innerHTML = `<span class='screenreader-only'>Check/Uncheck Course</span>`;
    const selectCheckbox = document.createElement("input");
    selectCheckbox.type = "checkbox";
    selectCheckbox.classList.add("skius-publish-checkbox");
    selectCheckbox.checked = true;
    selectCheckbox.title = "Click to not select this course to publish";
    selectCheckbox.addEventListener("click", () => {
      if (selectCheckbox.checked) {
        selectCheckbox.title = "Click to not select this course to publish";
      } else {
        selectCheckbox.title = "Click to select this course to publish";
      }
    });
    selectCheckbox.dataset.courseId = course?.id;
    selectLabel.append(selectCheckbox);
    selectTd.append(selectLabel);
    row.append(selectTd);

    row.insertAdjacentHTML(
      "beforeend",
      `
      <td><a href='/courses/${course?.id}' target='_blank'>${course?.name}</a></td>
      <td>${course?.course_code}</td>
      <td>${course?.sis_course_id}</td>
      <td>${course?.workflow_state}</td>
    `
    );

    tableBody.append(row);
  }

  async function getCourses(url, courses = [], page = 1) {
    if (!url) {
      url = new URL(
        `${window.location.protocol}//${window.location.hostname}/api/v1${
          window.location.pathname
        }/courses${
          window.location.search.length > 0 ? window.location.search : "?"
        }`
      );
      const searchParams = url.searchParams.keys();
      const keysToDelete = [];
      const keyValuesToAppend = {};
      for (let param of searchParams) {
        if (url.searchParams.get(param) === "") {
          keysToDelete.push(param);
        }

        if (param == "page") {
          keysToDelete.push(param);
        }

        if (/\[\d+\]$/.test(param)) {
          const paramArrayName = param.replace(/\[\d+\]/, "[]");
          const currentValue = url.searchParams.get(param);
          if (keyValuesToAppend.hasOwnProperty(paramArrayName)) {
            keyValuesToAppend[paramArrayName].push(currentValue);
          } else {
            keyValuesToAppend[paramArrayName] = [currentValue];
          }
          keysToDelete.push(param);
        }
      }

      for (const key of keysToDelete) {
        url.searchParams.delete(key);
      }

      for (const key in keyValuesToAppend) {
        const values = keyValuesToAppend[key];
        for (const value of values) {
          url.searchParams.append(key, value);
        }
      }
      url.searchParams.set("per_page", 100);
      url.searchParams.set("published", false); // Ensures only unpublished courses are fetched
    }

    let requestResponse;
    return fetch(url)
      .then((response) => {
        requestResponse = response;
        return response.json();
      })
      .then(async (data) => {
        const links = getRequestLinks(requestResponse);
        courses.push(...data);
        if (hasNextPage(links)) {
          page++;
          updateLoadingMessage("info", `Getting courses (Page ${page})...`);
          return await getCourses(links.next, courses, page);
        }
        return courses;
      })
      .catch((error) => {
        console.error(`Error: ${error}\nStack Trace: ${error.stack}`);
        updateLoadingMessage(
          "error",
          `Error: ${error}\nStack Trace: ${error.stack}`
        );
        return courses;
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

  async function publishSelectedCourses() {
    if (
      !confirm(
        "You are about to publish the selected courses. Do NOT refresh or leave this page while it is processing or the process will not fully complete.\n\nClick 'OK' to begin processing. Otherwise, click 'Cancel' and no changes will be made."
      )
    ) {
      return;
    }

    updateInputsDisabledState(true);
    updateLoadingMessage("clear");
    updateLoadingMessage("info", "Preparing to process courses to publish");
    const courseRowsToPublish = [
      ...document.querySelectorAll(
        "#skius-courses-to-publish > tbody > tr:has(input[type='checkbox']:checked)"
      ),
    ];
    const totalCoursesToPublish = courseRowsToPublish.length;
    let currentCourse = 0;
    for (const row of courseRowsToPublish) {
      currentCourse++;
      const publishCheckbox = row.querySelector(
        `input[type='checkbox']:checked`
      );
      const courseId = publishCheckbox?.dataset?.courseId;
      updateLoadingMessage(
        "info",
        `Publishing course [ID: ${courseId}] (Course ${currentCourse} of ${totalCoursesToPublish})`
      );
      const result = await publishCourse(courseId);
      if (result) {
        row.remove();
      } else {
        updateLoadingMessage(
          "error",
          `ERROR: Failed to publish course [ID: ${courseId}]`
        );
      }
    }
    updateLoadingMessage("success", `Finished publishing courses!`);

    updateInputsDisabledState(false);
  }

  async function publishCourse(courseId) {
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
      `${window.location.protocol}//${window.location.hostname}/api/v1/courses/${courseId}`
    );
    const params = {
      course: {
        event: "offer",
      },
    };

    let requestResponse;
    return await fetch(requestUrl, {
      method: "PUT",
      headers: requestHeaders,
      body: JSON.stringify(params),
    })
      .then((response) => {
        requestResponse = response;
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
