# Bulk Update Enrollment States

This adds the ability to bulk update the enrollment state of course enrollments. This can be accessed from the "Update Enrollment States" link that is added in the 3 dot People options menu in the upper right of the People page of a course. This requires permission to perform the change. Some initial permission (roles that can be managed) and role checks ("AccountAdmin" or "teacher") are performed to try to avoid showing it if it isn't applicable, but it doesn't currently cover all the granular permission possibilities. Updates will show an error if you attempt to make an update that your role isn't authorized to perform.

Enrollments that are associated with an SIS Import are set to be excluded from the enrollments that can be updated. Tf you have permission to manage these and want to update them too, you will need to update the value of the constant 'allowUpdatingSisEnrollments' (found towards the beginning of the script) to true.

Enrollments can be loaded in by role type, section (all or a specific one), and current enrollment state based on the selected state change. Since the role types are just the base roles, this may result in multiple roles loading in if your institution has custom roles. After the enrollments are loaded in, you can review the table to see if there are any that shouldn't be updated. By default all loaded in enrollments are selected to be updated, but clicking the checkbox will remove them from the ones to be updated. When ready, click "Update" and confirm to begin the update process. Be sure to wait for the process to complete before reloading or leaving the page as that will stop the update.

Courses with large enrollments will take longer to load in the enrollments. In addition, enrollment updates are processed one at a time, so it will take longer to process when updating a large number of users. Remember to stay on the page and don't refresh until the process completes. Leaving the page and/or reloading the page will cause the process to stop running.