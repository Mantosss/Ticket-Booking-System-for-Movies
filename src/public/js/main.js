
// ==================================
// DELETE CONFIRMATION
// ==================================

document.addEventListener("DOMContentLoaded", () => {

    const deleteForms = document.querySelectorAll(".delete-form");

    deleteForms.forEach(form => {

        form.addEventListener("submit", (event) => {

            const confirmed = confirm(
                "Are you sure you want to delete this item?"
            );

            if (!confirmed) {
                event.preventDefault();
            }

        });

    });


    // ==================================
    // FORM VALIDATION
    // ==================================

    const forms = document.querySelectorAll("form");

    forms.forEach(form => {

        form.addEventListener("submit", (event) => {

            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }

            form.classList.add("was-validated");

        });

    });


    // ==================================
    // AUTO DISMISS ALERTS
    // ==================================

    const alerts = document.querySelectorAll(".alert");

    alerts.forEach(alert => {

        setTimeout(() => {

            const bootstrapAlert = bootstrap.Alert.getOrCreateInstance(alert);
            bootstrapAlert.close();

        }, 5000);

    });


    // ==================================
    // PASSWORD CONFIRMATION
    // ==================================

    const signupForm = document.querySelector("#signupForm");

    if (signupForm) {

        signupForm.addEventListener("submit", (event) => {

            const password = signupForm.querySelector(
                '[name="password"]'
            );

            const confirmPassword = signupForm.querySelector(
                '[name="confirmPassword"]'
            );

            if (
                password &&
                confirmPassword &&
                password.value !== confirmPassword.value
            ) {

                event.preventDefault();

                alert("Password and Confirm Password do not match.");

                confirmPassword.focus();

            }

        });

    }

});
