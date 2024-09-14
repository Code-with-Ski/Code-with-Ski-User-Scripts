// ==UserScript==
// @name         Bulk Update Threaded Reply Setting
// @namespace    https://github.com/Code-with-Ski/Code-with-Ski-User-Scripts/course/discussions/bulk-update-threaded-reply-setting
// @version      1.0.0
// @description  Adds ability to bulk update threaded reply setting
// @author       James Sekcienski, Code with Ski
// @match      https://*.instructure.com/courses/*/discussion_topics
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

  const hasPermission =
    ENV?.permissions?.change_settings && ENV?.permissions?.manage_content;

  if (
    isApprovedUser &&
    hasPermission &&
    /^\/courses\/[0-9]+\/discussion_topics\??[^\/]*\/?$/.test(
      window.location.pathname
    )
  ) {
    watchForDiscussionsMenu();
  }

  function watchForDiscussionsMenu() {
    const discussionsMenu = document.querySelector(
      "#discussion_menu_link + ul.al-options.ui-menu"
    );
    if (discussionsMenu) {
      addBulkUpdateElements(discussionsMenu);
    } else {
      const observer = new MutationObserver((mutations) => {
        const addedMenu = document.querySelector(
          "#discussion_menu_link + ul.al-options.ui-menu"
        );
        if (addedMenu) {
          addBulkUpdateElements(addedMenu);
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function addBulkUpdateElements(discussionsMenu) {
    addBulkUpdateMenuOption(discussionsMenu);
    addDialog();
  }

  function addBulkUpdateMenuOption(discussionsMenu) {
    const bulkUpdateOption = createBulkUpdateOption();
    discussionsMenu.insertAdjacentElement("beforeend", bulkUpdateOption);
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
      <i class="icon-edit" aria-hidden="true"></i> Update Threaded
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

    wrapper.append(
      createDialogHeader(dialog, "Bulk Update Threaded Reply Settings")
    );
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
        <p>Use this tool to bulk update the threaded reply setting for discussions. Use the select options to configure the type of bulk update you want to make. Then, click "Load Discussions" and it will load in the relevant discussions to potentially change.</p>
        <p>After the discussions are loaded in, they are all selected to be updated by default. You can uncheck discussions that you don't want to update.  When ready, click "Update" and confirm to begin the update process. If the update is succcessful, it will remove that row from the table. If there is an error, it will remain in the table and an error message will be loaded in the loading messages. <em>*NOTE: Discussions with replies are excluded from disabling threaded replies.</em></p>
        <p>Threaded replies means users can reply to each other's replies.  Not threaded means that users can only reply to the original discussion topic post and not directly to other user's replies.</p>
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
    wrapper.id = "skius-update-threaded-reply-settings";

    const typeLabel = document.createElement("label");
    typeLabel.innerText = "Select Type of Update: ";
    typeLabel.style.display = "block";
    const typeSelect = document.createElement("select");
    typeSelect.id = "skius-select-update-type";
    addUpdateOptions(typeSelect);
    typeLabel.append(typeSelect);

    wrapper.append(typeLabel);

    return wrapper;
  }

  function addUpdateOptions(select) {
    const options = [
      {
        value: "threaded",
        name: "Enable threaded replies",
        selected: true,
      },
      { value: "not_threaded", name: "Disable threaded replies" },
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
    button.innerText = "Load Discussions";
    button.style.marginBottom = "1rem";
    button.addEventListener("click", () => {
      loadDiscussions();
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

    const loadingMessageControlsWrapper = document.createElement("div");

    const clearButton = document.createElement("button");
    clearButton.innerText = "Clear Messages";
    clearButton.classList.add("skius-button", "Button");
    clearButton.addEventListener("click", () => {
      updateLoadingMessage("clear");
    });

    const downloadButton = document.createElement("button");
    downloadButton.innerHTML = `<i class='icon-line icon-download' title="Download loading messages"></i>`;
    downloadButton.classList.add("skius-button", "Button");
    downloadButton.style.marginLeft = "0.5rem";
    downloadButton.addEventListener("click", () => {
      downloadLoadingMessages();
    });

    const messagesWrapper = document.createElement("div");
    messagesWrapper.id =
      "skius-update-threaded-reply-settings-loading-messages";
    messagesWrapper.style.borderTop = "1px solid gray";
    messagesWrapper.style.maxHeight = "120px";
    messagesWrapper.style.overflow = "auto";
    messagesWrapper.style.marginBottom = "1rem";

    loadingMessageControlsWrapper.append(clearButton);
    loadingMessageControlsWrapper.append(downloadButton);
    headingWrapper.append(heading);
    headingWrapper.append(loadingMessageControlsWrapper);
    wrapper.append(headingWrapper);
    wrapper.append(messagesWrapper);
    return wrapper;
  }

  function downloadLoadingMessages() {
    const fileName = `export-loading-messages-bulk-update-threaded-reply-settings.csv`;
    const data = [];
    const messages = [
      ...document.querySelectorAll(
        "#skius-update-threaded-reply-settings-loading-messages p"
      ),
    ];
    for (const message of messages) {
      const rowData = [];

      const messageType = message?.dataset?.type ?? "";
      rowData.push(`"${messageType}"`);

      let messageText = message.innerText?.trim();
      messageText = messageText.replace(/(\r\n|\n|\r)/gm, ";");
      messageText = messageText.replace(/(\s\s)/gm, " ");
      messageText = messageText.replace(/(; )+/gm, ";");
      messageText = messageText.replace(/"/g, '""');
      rowData.push(`"${messageText}"`);

      data.push(rowData.join(","));
    }

    const csvString = data.join("\n");

    // Download it
    const link = document.createElement("a");
    link.style.display = "none";
    link.setAttribute("target", "_blank");
    link.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csvString)
    );
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    table.id = "skius-discussions";

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
    selectAllCheckbox.title = "Click to uncheck all discussions for update";
    selectAllCheckbox.addEventListener("click", () => {
      const checkboxes = [
        ...document.querySelectorAll(
          "#skius-discussions tbody input.skius-update-checkbox"
        ),
      ];
      const isChecked = selectAllCheckbox.checked;
      for (const checkbox of checkboxes) {
        checkbox.checked = isChecked;
      }

      if (isChecked) {
        selectAllCheckbox.title = "Click to uncheck all discussions to update";
      } else {
        selectAllCheckbox.title = "Click to check all discussions to update";
      }
    });
    selectAllLabel.append(selectAllCheckbox);
    selectAllTh.append(selectAllLabel);
    headerRow.append(selectAllTh);
    headerRow.insertAdjacentHTML(
      "beforeend",
      `
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Discussion Title</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Last Date of Reply</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Number of Replies</th>
      <th style="background-color: #ffffff; position: sticky; top: 0px;">Published</th>
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
      updateSelectedDiscussions();
    });

    wrapper.append(closeButton);
    wrapper.append(updateButton);
    return wrapper;
  }

  function updateLoadingMessage(messageType, newMessage) {
    const messageWrapper = document.querySelector(
      "#skius-update-threaded-reply-settings-loading-messages"
    );
    if (!messageWrapper) {
      return;
    }

    if (messageType == "clear") {
      messageWrapper.innerHTML = "";
    } else if (messageType == "success") {
      messageWrapper.innerHTML += `
        <p class='text-success' data-type='${messageType}'><i class='icon-line icon-check'></i> ${newMessage}</p>
      `;
    } else if (messageType == "error") {
      messageWrapper.innerHTML = `
        ${messageWrapper.innerHTML}
        <p class='text-error' data-type='${messageType}'><i class='icon-line icon-warning'></i> ${newMessage}</p>
      `;
    } else {
      messageWrapper.innerHTML += `
        <p class='text-info' data-type='${messageType}'><i class='icon-line icon-info'></i> ${newMessage}</p>
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

  async function loadDiscussions() {
    updateInputsDisabledState(true);
    updateLoadingMessage("clear");

    const updateType = document.getElementById(
      "skius-select-update-type"
    )?.value;
    if (!updateType) {
      updateLoadingMessage("error", "No update type selected");
      return;
    }

    const table = document.getElementById("skius-discussions");
    const tableBody = table.querySelector("tbody");
    if (tableBody) {
      tableBody.innerHTML = "";
    }

    updateLoadingMessage("info", "Getting discussions...");
    const url = createDiscussionsRequestUrl();
    const discussions = (await getDiscussions(url)) ?? [];

    updateLoadingMessage("info", "Adding discussion rows");
    for (const discussion of discussions) {
      const discussionType = discussion?.discussion_type;
      const numOfReplies = discussion?.discussion_subentry_count ?? 0;
      if (
        (updateType == "threaded" && discussionType != "threaded") ||
        (updateType == "not_threaded" &&
          discussionType == "threaded" &&
          numOfReplies == 0)
      ) {
        addRow(tableBody, discussion);
      }
    }
    updateLoadingMessage("success", "Finished loading!");

    updateInputsDisabledState(false);
  }

  function addRow(tableBody, discussion) {
    const row = document.createElement("tr");

    const selectTd = document.createElement("td");
    const selectLabel = document.createElement("label");
    selectLabel.innerHTML = `<span class='screenreader-only'>Check/Uncheck Discussion</span>`;
    const selectCheckbox = document.createElement("input");
    selectCheckbox.type = "checkbox";
    selectCheckbox.classList.add("skius-update-checkbox");
    selectCheckbox.checked = true;
    selectCheckbox.title = "Click to not select this discussion to update";
    selectCheckbox.addEventListener("click", () => {
      if (selectCheckbox.checked) {
        selectCheckbox.title = "Click to not select this discussion to update";
      } else {
        selectCheckbox.title = "Click to select this discussion to update";
      }
    });
    selectCheckbox.dataset.discussionId = discussion?.id;
    selectLabel.append(selectCheckbox);
    selectTd.append(selectLabel);
    row.append(selectTd);

    let lastReplyDate = discussion?.last_reply_at;
    if (lastReplyDate) {
      lastReplyDate = new Date(lastReplyDate).toLocaleString();
    } else {
      lastReplyDate = "No replies yet";
    }

    row.insertAdjacentHTML(
      "beforeend",
      `
      <td>${discussion?.title}</td>
      <td>${lastReplyDate}</td>
      <td>${discussion?.discussion_subentry_count ?? 0}</td>
      <td>${discussion?.published}</td>
    `
    );

    tableBody.append(row);
  }

  function createDiscussionsRequestUrl() {
    const updateType = document.getElementById(
      "skius-select-update-type"
    )?.value;

    if (updateType) {
      const courseId = window.location.pathname.split("/")[2];
      return `
        ${window.location.protocol}//${window.location.hostname}/api/v1/courses/${courseId}/discussion_topics?&per_page=100
      `;
    }

    updateLoadingMessage("error", "ERROR: Missing expected select value");
    return;
  }

  async function getDiscussions(url, discussions = [], page = 1) {
    if (!url) {
      updateLoadingMessage(
        "error",
        "ERROR: No URL provided for getDiscussions"
      );
      return discussions;
    }

    let requestResponse;
    return fetch(url)
      .then((response) => {
        requestResponse = response;
        return response.json();
      })
      .then(async (data) => {
        const links = getRequestLinks(requestResponse);
        discussions.push(...data);
        if (hasNextPage(links)) {
          page++;
          updateLoadingMessage("info", `Getting discussions (Page ${page})...`);
          return await getDiscussions(links.next, discussions, page);
        }
        return discussions;
      })
      .catch((error) => {
        console.error(`Error: ${error}\nStack Trace: ${error.stack}`);
        updateLoadingMessage(
          "error",
          `Error: ${error}\nStack Trace: ${error.stack}`
        );
        return discussions;
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

  async function updateSelectedDiscussions() {
    const updateType = document.getElementById(
      "skius-select-update-type"
    )?.value;
    const courseId = window.location.pathname.split("/")[2];

    if (
      !confirm(
        `You are about to update the selected discussions. Do NOT refresh or leave this page while it is processing or the process will not fully complete.\n\nClick 'OK' to begin processing. Otherwise, click 'Cancel' and no changes will be made.`
      )
    ) {
      return;
    }

    updateInputsDisabledState(true);
    updateLoadingMessage("clear");
    updateLoadingMessage("info", "Preparing to process discussions to update");
    const rowsToUpdate = [
      ...document.querySelectorAll(
        "#skius-discussions > tbody > tr:has(input[type='checkbox']:checked)"
      ),
    ];
    const totalRowsToUpdate = rowsToUpdate.length;
    let currentCount = 0;
    for (const row of rowsToUpdate) {
      currentCount++;
      const updateCheckbox = row.querySelector(
        `input[type='checkbox']:checked`
      );
      const discussionId = updateCheckbox?.dataset?.discussionId;
      updateLoadingMessage(
        "info",
        `Updating discussion [ID: ${discussionId}] (Discussion ${currentCount} of ${totalRowsToUpdate})`
      );
      let result;
      result = await updateDiscussion(courseId, discussionId, {
        discussion_type: updateType,
      });

      if (result) {
        row.remove();
      } else {
        updateLoadingMessage(
          "error",
          `ERROR: Failed to update discussion [ID: ${discussionId}]`
        );
      }
    }
    updateLoadingMessage("success", `Finished updating discussions!`);

    updateInputsDisabledState(false);
  }

  async function updateDiscussion(courseId, discussionId, params = {}) {
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
      `${window.location.protocol}//${window.location.hostname}/api/v1/courses/${courseId}/discussion_topics/${discussionId}`
    );

    return await fetch(requestUrl, {
      method: "PUT",
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
})();
