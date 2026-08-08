// Gestione del pannello "Dimensioni del camper".
// Le dimensioni vengono salvate separatamente dai dati del viaggio:
// NON vengono azzerate da "Nuovo viaggio" né dal ricarico della pagina.

function setupCamperProfile() {

    const toggleButton =
        document.getElementById("camperProfileButton");

    const panel =
        document.getElementById("camperProfilePanel");

    const saveButton =
        document.getElementById("camperProfileSave");

    const cancelButton =
        document.getElementById("camperProfileCancel");

    const resetButton =
        document.getElementById("camperProfileReset");

    const modal =
        document.getElementById("camperDisclaimerModal");

    const disclaimerAccept =
        document.getElementById("camperDisclaimerAccept");

    const disclaimerCancel =
        document.getElementById("camperDisclaimerCancel");


    if (!toggleButton || !panel) {
        return;
    }


    updateCamperProfileButtonLabel();


    toggleButton.addEventListener("click", function () {

        const isOpen = panel.style.display === "block";

        if (isOpen) {

            panel.style.display = "none";

        } else {

            fillCamperProfileFields();
            panel.style.display = "block";

            panel.scrollIntoView({ behavior: "smooth", block: "center" });

        }

    });


    if (cancelButton) {

        cancelButton.addEventListener("click", function () {
            panel.style.display = "none";
        });

    }


    if (resetButton) {

        resetButton.addEventListener("click", function () {

            deleteCamperProfile();

            fillCamperProfileFields();

            updateCamperProfileButtonLabel();

            panel.style.display = "none";

        });

    }


    if (saveButton && modal) {

        saveButton.addEventListener("click", function () {

            modal.style.display = "flex";

        });

    }


    if (disclaimerCancel && modal) {

        disclaimerCancel.addEventListener("click", function () {
            modal.style.display = "none";
        });

    }


    if (disclaimerAccept && modal) {

        disclaimerAccept.addEventListener("click", function () {

            const profile = readCamperProfileFields();

            saveCamperProfile(profile);

            modal.style.display = "none";

            panel.style.display = "none";

            updateCamperProfileButtonLabel();

        });

    }

}



function readCamperProfileFields() {

    const height =
        Number(document.getElementById("camperHeight").value) || 0;

    const width =
        Number(document.getElementById("camperWidth").value) || 0;

    const length =
        Number(document.getElementById("camperLength").value) || 0;

    const avoidHighways =
        document.getElementById("camperAvoidHighways").checked;

    const avoidTolls =
        document.getElementById("camperAvoidTolls").checked;

    const avoidFerries =
        document.getElementById("camperAvoidFerries").checked;


    return {
        height: height,
        width: width,
        length: length,
        avoidHighways: avoidHighways,
        avoidTolls: avoidTolls,
        avoidFerries: avoidFerries
    };

}



function fillCamperProfileFields() {

    const profile = loadCamperProfile();

    const heightInput = document.getElementById("camperHeight");
    const widthInput = document.getElementById("camperWidth");
    const lengthInput = document.getElementById("camperLength");
    const avoidHighwaysInput = document.getElementById("camperAvoidHighways");
    const avoidTollsInput = document.getElementById("camperAvoidTolls");
    const avoidFerriesInput = document.getElementById("camperAvoidFerries");

    if (!heightInput) {
        return;
    }

    heightInput.value = profile ? profile.height || "" : "";
    widthInput.value = profile ? profile.width || "" : "";
    lengthInput.value = profile ? profile.length || "" : "";
    avoidHighwaysInput.checked = profile ? !!profile.avoidHighways : false;
    avoidTollsInput.checked = profile ? !!profile.avoidTolls : false;
    avoidFerriesInput.checked = profile ? !!profile.avoidFerries : false;

}



function updateCamperProfileButtonLabel() {

    const toggleButton =
        document.getElementById("camperProfileButton");

    if (!toggleButton) {
        return;
    }

    const profile = loadCamperProfile();

    if (!profile) {

        toggleButton.textContent =
            "🚐 Imposta le dimensioni del camper per adeguare il percorso";

        toggleButton.classList.remove("camper-profile-set");

        return;

    }


    const parts = [];

    if (profile.height > 0) {
        parts.push(profile.height + "m h");
    }

    if (profile.width > 0) {
        parts.push(profile.width + "m l");
    }

    if (profile.length > 0) {
        parts.push(profile.length + "m lung.");
    }

    const summary =
        parts.length > 0
        ? " (" + parts.join(" × ") + ")"
        : "";

    toggleButton.textContent =
        "✅ Dimensioni impostate" + summary;

    toggleButton.classList.add("camper-profile-set");

}



document.addEventListener("DOMContentLoaded", function () {

    setupCamperProfile();

});
