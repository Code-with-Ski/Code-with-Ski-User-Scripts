# Bulk Update Threaded Reply Settings

This adds the ability to bulk update the threaded reply setting of course enrollments. This can be accessed from the "Update Threaded" link that is added in the 3 dot Discussions options menu in the upper right of the Discussions page of a course. This requires permission to perform the change. Some initial permission (roles that can be managed) and role checks ("AccountAdmin" or "teacher") are performed to try to avoid showing it if it isn't applicable. Updates will show an error if you attempt to make an update that your role isn't authorized to perform.

There is an option to enable threaded replies or to disable threaded replies. Based on the selected update type, it will add the relevant discussions that could potentially be updated to that setting. Discussions that already have replies are excluded when selecting to disable threaded replies. This is to avoid unexpected errors with updating the setting since discussions with threaded replies can't have threaded replies disabled. By default all loaded in discussions are selected to be updated. You can use the checkboxes to change the selected discussions to update. Once you have finalized selecting discussions to update, click "Update" and then confirm. The loading messages will provide status updates as the selected discussions are updated.

Discussion updates are processed one at a time, so it will take longer to process when updating a large number of discussions. Remember to stay on the page and don't refresh until the process completes. Leaving the page and/or reloading the page will cause the process to stop running.