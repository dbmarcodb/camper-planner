let currentStopLocation = "";

// Icone da mostrare sui pulsanti 📍 una volta scelta la posizione dalla mappa
const mapSelectIcons = {
    start: "🟢",
    stop: "🚩",
    end: "🔵"
};

// Campo attualmente in attesa di un tap sulla mappa (null = nessuno)
let activeSelectionField = null;



document.addEventListener("DOMContentLoaded", function () {


    initMap();
    loadData();
    setupMapSelectionButtons();


    document
    .getElementById("routeButton")
    .addEventListener("click", async function () {


        const button =
        document.getElementById("routeButton");


        button.disabled = true;

        button.innerHTML = '<span class="btn-spinner"></span> CALCOLO...';



        try {


            const startText =
            document.getElementById("start").value;


            const endText =
            document.getElementById("end").value;


            const stopText =
            document.getElementById("stop").value;



            const speedValue =
            document.getElementById("camperSpeedFactor").value;


            const departureTime =
            document.getElementById("departureTime").value;


            const stopTime =
            document.getElementById("stopTime").value;



            if (!startText || !endText) {

                alert("Inserisci partenza e destinazione");

                return;

            }



            saveData();



            const start =
            await geocode(startText);



            const end =
            await geocode(endText);



            let route;

            let waypointStop = null;

            const camperProfile = loadCamperProfile();



            if (stopText.trim() !== "") {

                waypointStop =
                await geocode(stopText);

            }


            route =
            await computeRoute(
                start,
                waypointStop,
                end,
                camperProfile
            );



            


            const camperFactor =
            speedValue === ""
            ? 1
            : Number(speedValue) / 100;



            const camperDuration =
            route.duration / camperFactor;




            const stopPoint =
            calculateStopPoint(
                route.geometry.coordinates,
                camperDuration,
                departureTime,
                stopTime
            );

if (stopPoint) {

    drawRouteSplit(
        route.geometry.coordinates,
        stopPoint.lat,
        stopPoint.lon
    );

}

            

            let stopTextResult =
            "Non calcolabile";



            let stopCoordinates =
            "";



            if (stopPoint) {


                addStopMarker(
                    stopPoint.lat,
                    stopPoint.lon
                );


                addMarker(
                start.lat,
                start.lon,
                "Partenza"
            );



            addMarker(
                end.lat,
                end.lon,
                "Destinazione"
            );

            if (waypointStop) {

                addWaypointMarker(
                    waypointStop.lat,
                    waypointStop.lon,
                    "Tappa: " + stopText
                );

            }

                const location =
                await reverseGeocode(
                    stopPoint.lat,
                    stopPoint.lon
                );


                currentStopLocation =
                location.name;


                stopTextResult =
                location.name;


                stopCoordinates =
                stopPoint.lat.toFixed(5)
                + ", "
                + stopPoint.lon.toFixed(5);



            }




            const standardHours =
            Math.floor(
                route.duration / 3600
            );


            const standardMinutes =
            Math.round(
                (route.duration % 3600) / 60
            );



            const camperHours =
            Math.floor(
                camperDuration / 3600
            );


            const camperMinutes =
            Math.round(
                (camperDuration % 3600) / 60
            );

const totalDistanceKm =
route.distance / 1000;

const stopRatio =
Math.min(
    1,
    (
        (
            timeToMinutes(stopTime)
            -
            timeToMinutes(departureTime)
            +
            1440
        ) % 1440
    ) * 60
    /
    camperDuration
);

const travelledKm =
totalDistanceKm * stopRatio;

const remainingKm =
Math.max(
    0,
    totalDistanceKm - travelledKm
);

const stopDrivingSeconds =
camperDuration * stopRatio;

const stopDrivingHours =
Math.floor(
    stopDrivingSeconds / 3600
);

const stopDrivingMinutes =
Math.round(
    (stopDrivingSeconds % 3600) / 60
);

            document
            .getElementById("results")
            .innerHTML = `

            <div class="results-content">

            <div class="results-hero">

                <div class="results-hero-label">
                    Alle ore ${stopTime} sarai a
                </div>

                <div class="stop-location">
                    ${stopTextResult}
                </div>

                ${camperProfile ? '<div class="results-badge">🚐 Percorso calcolato in base alle dimensioni impostate</div>' : ""}

            </div>

            <div class="results-grid">

                <div class="result-card">
                    <div class="result-icon">📏</div>
                    <div class="result-label">Distanza totale</div>
                    <div class="result-value">${(route.distance/1000).toFixed(0)} km</div>
                </div>

                <div class="result-card">
                    <div class="result-icon">⏱️</div>
                    <div class="result-label">Tempo in camper</div>
                    <div class="result-value">${camperHours}h ${camperMinutes}m</div>
                </div>

                <div class="result-card">
                    <div class="result-icon">🚗</div>
                    <div class="result-label">Tempo con un'auto</div>
                    <div class="result-value">${standardHours}h ${standardMinutes}m</div>
                </div>

                <div class="result-card">
                    <div class="result-icon">🛣️</div>
                    <div class="result-label">Km alla sosta</div>
                    <div class="result-value">${travelledKm.toFixed(0)} km</div>
                </div>

                <div class="result-card">
                    <div class="result-icon">🕓</div>
                    <div class="result-label">Guida alla sosta</div>
                    <div class="result-value">${stopDrivingHours}h ${stopDrivingMinutes}m</div>
                </div>

                <div class="result-card">
                    <div class="result-icon">📍</div>
                    <div class="result-label">Km rimanenti</div>
                    <div class="result-value">${remainingKm.toFixed(0)} km</div>
                </div>

                <div class="result-card">
                    <div class="result-icon">🐢</div>
                    <div class="result-label">Velocità camper</div>
                    <div class="result-value">${speedValue || 100}%</div>
                </div>

                <div class="result-card">
                    <div class="result-icon">🧭</div>
                    <div class="result-label">Coordinate sosta</div>
                    <div class="result-value">${stopCoordinates}</div>
                </div>

            </div>

            <button
            class="copy-button"
            onclick="copyStopLocation()">

            📋 Copia località

            </button>

            </div>

            `;



        }

        catch(error) {


            alert(
                "Errore: "
                + error.message
            );


        }

        finally {


            button.disabled = false;

            button.innerText =
            "CALCOLA PERCORSO";


        }


    });



});


function setupMapSelectionButtons(){

    const buttonsByField = {
        start: document.getElementById("selectStartOnMap"),
        stop: document.getElementById("selectStopOnMap"),
        end: document.getElementById("selectEndOnMap")
    };

    Object.keys(buttonsByField).forEach(function(field){

        const button = buttonsByField[field];

        if(!button){
            return;
        }

        button.addEventListener("click", function(){

            if(activeSelectionField === field){
                exitMapSelection();
                return;
            }

            enterMapSelection(field);

        });

    });

}



function enterMapSelection(field){

    activeSelectionField = field;

    ["start", "stop", "end"].forEach(function(f){

        const button = document.getElementById(
            "select" + f.charAt(0).toUpperCase() + f.slice(1) + "OnMap"
        );

        if(button){
            button.classList.remove("selecting");
        }

    });

    const activeButton = document.getElementById(
        "select" + field.charAt(0).toUpperCase() + field.slice(1) + "OnMap"
    );

    if(activeButton){
        activeButton.classList.add("selecting");
    }

    startMapSelection(field);

    showMapHint("Tocca la mappa per impostare: " + fieldLabel(field));

    const mapElement = document.getElementById("map");

    if(mapElement){
        mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

}



function exitMapSelection(){

    activeSelectionField = null;

    ["start", "stop", "end"].forEach(function(f){

        const button = document.getElementById(
            "select" + f.charAt(0).toUpperCase() + f.slice(1) + "OnMap"
        );

        if(button){
            button.classList.remove("selecting");
        }

    });

    stopMapSelection();

    hideMapHint();

}



function fieldLabel(field){

    if(field === "start"){
        return "Partenza";
    }

    if(field === "stop"){
        return "Tappa facoltativa";
    }

    return "Destinazione";

}



function showMapHint(text){

    const hint = document.getElementById("mapSelectionHint");

    if(!hint){
        return;
    }

    hint.textContent = text;
    hint.style.display = "block";

}



function hideMapHint(){

    const hint = document.getElementById("mapSelectionHint");

    if(!hint){
        return;
    }

    hint.style.display = "none";

}



// Chiamata da map.js quando l'utente tocca la mappa in modalità selezione
async function onMapPointSelected(field, lat, lon){

    const input = document.getElementById(field);

    if(input){

        input.value =
            lat.toFixed(6) + ", " + lon.toFixed(6);

        try {

            const location = await reverseGeocode(lat, lon);

            if(location && location.name && location.name !== "Località non identificata"){
                input.value = location.name;
            }

        } catch(error){
            // in caso di errore lasciamo le coordinate nel campo
        }

    }

    const button = document.getElementById(
        "select" + field.charAt(0).toUpperCase() + field.slice(1) + "OnMap"
    );

    if(button){
        button.textContent = mapSelectIcons[field];
        button.classList.remove("selecting");
    }

    activeSelectionField = null;

    hideMapHint();

    if(input){
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        input.focus();
    }

}



function copyStopLocation(){


    navigator.clipboard.writeText(
        currentStopLocation
    );


}





const clearButton =
document.getElementById("clearButton");


if (clearButton) {


    clearButton.onclick = function(){


        document.getElementById("start").value = "";

        document.getElementById("stop").value = "";

        document.getElementById("end").value = "";

        document.getElementById("departureTime").value = "";

        document.getElementById("stopTime").value = "";


        document.getElementById("results").innerHTML = "";



        clearSavedData();


        if (typeof clearMap === "function") {

            clearMap();

        }


    };


}
