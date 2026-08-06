function setupAutocomplete(inputId, suggestionsId) {

    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);

    if (!input || !suggestions) {
        return;
    }

    let timer;

    input.addEventListener("input", function () {

        clearTimeout(timer);

        timer = setTimeout(async function () {

            const text = input.value.trim();

            // campo vuoto
            if (text.length < 3) {

                suggestions.innerHTML = "";
                return;

            }

            // se sono coordinate non cercare località
            if (typeof parseCoordinates === "function") {

                if (parseCoordinates(text)) {

                    suggestions.innerHTML = "";
                    return;

                }

            }

            const url =
                "https://nominatim.openstreetmap.org/search?format=json&limit=5&q="
                + encodeURIComponent(text);

            const response = await fetch(url);

            const results = await response.json();

            suggestions.innerHTML = "";

            results.forEach(function (place) {

                const item = document.createElement("div");

                item.innerText = place.display_name;

                item.onclick = function () {

                    input.value = place.display_name;

                    suggestions.innerHTML = "";

                };

                suggestions.appendChild(item);

            });

        }, 400);

    });

}

document.addEventListener("DOMContentLoaded", function () {

    setupAutocomplete(
        "start",
        "startSuggestions"
    );

    setupAutocomplete(
        "stop",
        "stopSuggestions"
    );

    setupAutocomplete(
        "end",
        "endSuggestions"
    );

});
