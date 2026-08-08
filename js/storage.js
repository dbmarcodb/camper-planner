function saveData() {

    const fields = [
        "start",
        "stop",
        "end",
        "camperSpeedFactor",
        "departureTime",
        "stopTime"
    ];

    fields.forEach(function (id) {

        const element = document.getElementById(id);

        if (element) {

            localStorage.setItem(id, element.value);

        }

    });

}



function loadData() {

    const fields = [
        "start",
        "stop",
        "end",
        "camperSpeedFactor",
        "departureTime",
        "stopTime"
    ];

    fields.forEach(function (id) {

        const element = document.getElementById(id);

        if (!element) {

            return;

        }

        const value = localStorage.getItem(id);

        if (value !== null) {

            element.value = value;

        }

    });

}



function clearSavedData() {

    const fields = [
        "start",
        "stop",
        "end",
        "departureTime",
        "stopTime"
    ];

    fields.forEach(function (id) {

        localStorage.removeItem(id);

    });

}



// --- Profilo dimensioni camper ---
// Salvato con chiavi separate da quelle del viaggio: NON viene mai
// toccato da clearSavedData() né dal pulsante "Nuovo viaggio".

const CAMPER_PROFILE_KEY = "camperProfile";



function saveCamperProfile(profile) {

    localStorage.setItem(
        CAMPER_PROFILE_KEY,
        JSON.stringify(profile)
    );

}



function loadCamperProfile() {

    const raw = localStorage.getItem(CAMPER_PROFILE_KEY);

    if (!raw) {
        return null;
    }

    try {

        const profile = JSON.parse(raw);

        const hasDimensions =
            (profile.height && profile.height > 0) ||
            (profile.width && profile.width > 0) ||
            (profile.length && profile.length > 0);

        if (!hasDimensions) {
            return null;
        }

        return profile;

    } catch (error) {

        return null;

    }

}



function deleteCamperProfile() {

    localStorage.removeItem(CAMPER_PROFILE_KEY);

}
