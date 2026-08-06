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
