// Pianificatore itinerario multi-tratta.
// Ogni "tratta" ha partenza, eventuale tappa facoltativa e arrivo,
// con note, orari e giorno di appartenenza (per i colori sulla mappa).

const DAY_COLORS = [
    { h: 214, s: 80 }, // blu
    { h: 152, s: 30 }, // verde salvia
    { h: 16,  s: 65 }, // terracotta
    { h: 265, s: 45 }, // viola
    { h: 340, s: 55 }, // rosa
    { h: 45,  s: 65 }  // oro
];

let legs = [];
let legCounter = 0;
let lastCalculation = null;



function hslToHex(h, s, l) {

    s /= 100;
    l /= 100;

    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);

    const f = n =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const toHex = x => Math.round(255 * x).toString(16).padStart(2, "0");

    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;

}



function colorForLeg(day, indexInDay, countInDay) {

    const dayIndex = Math.max(0, (Number(day) || 1) - 1);

    const palette = DAY_COLORS[dayIndex % DAY_COLORS.length];

    const factor = countInDay > 1 ? indexInDay / (countInDay - 1) : 0;

    const lightness = 62 - factor * 28;

    return hslToHex(palette.h, palette.s, lightness);

}



function createLeg() {

    legCounter++;

    const previousLeg = legs[legs.length - 1];

    return {
        id: "leg" + legCounter,
        day: previousLeg ? previousLeg.day : 1,
        date: "",
        purpose: "",
        startText: "",
        startNote: "",
        stopText: "",
        stopNote: "",
        endText: "",
        endNote: "",
        departureTime: "",
        stopDuration: "",
        arrivalTime: "",
        arrivalNextDay: false,
        distanceKm: null,
        durationMin: null
    };

}



async function addLeg() {

    // Prima "fotografo" quanto scritto nelle tratte esistenti, altrimenti
    // ridisegnando la lista si perderebbero i dati non ancora calcolati.
    readLegsFromForm();

    const previousLeg = legs[legs.length - 1];

    const newLeg = createLeg();

    if (previousLeg && previousLeg.endText.trim() !== "") {
        newLeg.startText = previousLeg.endText;
    }

    legs.push(newLeg);

    renderLegs();

    document
        .getElementById(newLeg.id + "-start")
        .scrollIntoView({ behavior: "smooth", block: "center" });

    // Calcolo parziale della tratta precedente, per suggerire l'orario
    // di partenza della nuova tratta (partenza precedente + tempo di
    // percorrenza + eventuale sosta). Se manca qualcosa, la tratta resta
    // comunque aggiunta senza precompilazione.
    if (
        previousLeg &&
        previousLeg.startText.trim() !== "" &&
        previousLeg.endText.trim() !== "" &&
        previousLeg.departureTime
    ) {

        try {

            const camperProfile = loadCamperProfile();

            const speedValue = document.getElementById("itinerarySpeed").value;

            const camperFactor = speedValue === "" ? 1 : Number(speedValue) / 100;

            const start = await geocode(previousLeg.startText);
            const end = await geocode(previousLeg.endText);

            let waypoint = null;

            if (previousLeg.stopText.trim() !== "") {
                waypoint = await geocode(previousLeg.stopText);
            }

            const route = await computeRoute(start, waypoint, end, camperProfile);

            const durationMin = (route.duration / camperFactor) / 60;

            previousLeg.distanceKm = (route.distance / 1000).toFixed(0);
            previousLeg.durationMin =
                Math.floor(durationMin / 60) + "h " +
                Math.round(durationMin % 60) + "m";

            const [dh, dm] = previousLeg.departureTime.split(":").map(Number);

            const departureTotal = dh * 60 + dm;

            const arrivalTotal = departureTotal + durationMin;

            previousLeg.arrivalTime = minutesToTime(arrivalTotal);
            previousLeg.arrivalNextDay = arrivalTotal >= 1440;

            const stopMinutes = Number(previousLeg.stopDuration) || 0;

            newLeg.departureTime = minutesToTime(arrivalTotal + stopMinutes);

            if (arrivalTotal >= 1440) {
                newLeg.day = previousLeg.day + 1;
            }

            renderLegs();

        } catch (error) {
            // Località non trovata o rete assente: nessuna precompilazione,
            // ma la tratta resta comunque aggiunta.
        }

    }

}



function removeLeg(id) {

    readLegsFromForm();

    legs = legs.filter(function (leg) {
        return leg.id !== id;
    });

    renderLegs();

}



function readLegsFromForm() {

    legs.forEach(function (leg) {

        leg.day = Number(document.getElementById(leg.id + "-day").value) || 1;
        leg.date = document.getElementById(leg.id + "-date").value;
        leg.purpose = document.getElementById(leg.id + "-purpose").value;

        leg.startText = document.getElementById(leg.id + "-start").value;
        leg.startNote = document.getElementById(leg.id + "-startNote").value;

        leg.stopText = document.getElementById(leg.id + "-stop").value;
        leg.stopNote = document.getElementById(leg.id + "-stopNote").value;

        leg.endText = document.getElementById(leg.id + "-end").value;
        leg.endNote = document.getElementById(leg.id + "-endNote").value;

        leg.departureTime = document.getElementById(leg.id + "-departure").value;
        leg.stopDuration = document.getElementById(leg.id + "-stopDuration").value;

    });

}



function renderLegs() {

    const container = document.getElementById("legsList");

    if (legs.length === 0) {

        container.innerHTML =
            '<p class="empty-hint">Nessuna tratta ancora. Aggiungi la prima con il pulsante qui sotto.</p>';

        return;

    }

    container.innerHTML = legs.map(function (leg, index) {

        return `
        <div class="leg-card">

            <div class="leg-card-header">
                <span class="leg-number">Tratta ${index + 1}</span>
                <button type="button" class="leg-remove" onclick="removeLeg('${leg.id}')">🗑️ Rimuovi</button>
            </div>

            <div class="leg-row leg-row-meta">
                <div>
                    <label for="${leg.id}-day">Giorno</label>
                    <input id="${leg.id}-day" type="number" min="1" value="${leg.day}">
                </div>
                <div>
                    <label for="${leg.id}-date">Data (facoltativa)</label>
                    <input id="${leg.id}-date" type="date" value="${leg.date}">
                </div>
                <div>
                    <label for="${leg.id}-purpose">Scopo della tratta</label>
                    <input id="${leg.id}-purpose" type="text" placeholder="es. Visita al castello" value="${leg.purpose}">
                </div>
            </div>

            <div class="leg-location-block">
                <label for="${leg.id}-start">Partenza</label>
                <div class="autocomplete">
                    <div class="location-row">
                        <button type="button" class="map-select-btn" data-field="${leg.id}-start" title="Seleziona dalla mappa">📍</button>
                        <input id="${leg.id}-start" type="text" placeholder="Località di partenza" autocomplete="off" value="${leg.startText}">
                    </div>
                    <div id="${leg.id}-startSuggestions" class="suggestions"></div>
                </div>
                <input id="${leg.id}-startNote" type="text" class="note-input" placeholder="Nota sulla partenza (facoltativa)" value="${leg.startNote}">
            </div>

            <div class="leg-location-block">
                <label for="${leg.id}-stop">Tappa (facoltativa)</label>
                <div class="autocomplete">
                    <div class="location-row">
                        <button type="button" class="map-select-btn" data-field="${leg.id}-stop" title="Seleziona dalla mappa">📍</button>
                        <input id="${leg.id}-stop" type="text" placeholder="Tappa intermedia facoltativa" autocomplete="off" value="${leg.stopText}">
                    </div>
                    <div id="${leg.id}-stopSuggestions" class="suggestions"></div>
                </div>
                <input id="${leg.id}-stopNote" type="text" class="note-input" placeholder="Nota sulla tappa (facoltativa)" value="${leg.stopNote}">
            </div>

            <div class="leg-location-block">
                <label for="${leg.id}-end">Arrivo</label>
                <div class="autocomplete">
                    <div class="location-row">
                        <button type="button" class="map-select-btn" data-field="${leg.id}-end" title="Seleziona dalla mappa">📍</button>
                        <input id="${leg.id}-end" type="text" placeholder="Località di arrivo" autocomplete="off" value="${leg.endText}">
                    </div>
                    <div id="${leg.id}-endSuggestions" class="suggestions"></div>
                </div>
                <input id="${leg.id}-endNote" type="text" class="note-input" placeholder="Nota sull'arrivo (facoltativa)" value="${leg.endNote}">
            </div>

            <div class="leg-row leg-row-times">
                <div>
                    <label for="${leg.id}-departure">Orario di partenza</label>
                    <input id="${leg.id}-departure" type="time" value="${leg.departureTime}">
                </div>
                <div>
                    <label>Orario di arrivo (calcolato)</label>
                    <input type="text" class="computed-field" value="${leg.arrivalTime ? leg.arrivalTime + (leg.arrivalNextDay ? " (+1g)" : "") : "—"}" readonly>
                </div>
                <div>
                    <label for="${leg.id}-stopDuration">Sosta qui (minuti, facoltativa)</label>
                    <input id="${leg.id}-stopDuration" type="number" min="0" step="5" placeholder="es. 90" value="${leg.stopDuration}">
                </div>
            </div>

            <div class="leg-row-footer">
                <button type="button" class="leg-focus-btn" onclick="focusLegOnMap('${leg.id}')">🔍 Vedi sulla mappa</button>
                ${leg.distanceKm !== null ? `<span class="leg-summary">${leg.distanceKm} km · ${leg.durationMin}</span>` : ""}
            </div>

        </div>
        `;

    }).join("");

    setupLegAutocompletes();
    setupLegMapButtons();

}



function setupLegAutocompletes() {

    legs.forEach(function (leg) {

        setupAutocomplete(leg.id + "-start", leg.id + "-startSuggestions");
        setupAutocomplete(leg.id + "-stop", leg.id + "-stopSuggestions");
        setupAutocomplete(leg.id + "-end", leg.id + "-endSuggestions");

    });

}



function setupLegMapButtons() {

    document.querySelectorAll(".map-select-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const field = button.getAttribute("data-field");

            document.querySelectorAll(".map-select-btn").forEach(function (b) {
                b.classList.remove("selecting");
            });

            button.classList.add("selecting");

            startMapSelection(field);

            const hint = document.getElementById("mapSelectionHint");

            if (hint) {
                hint.textContent = "Tocca la mappa per impostare questo punto";
                hint.style.display = "block";
            }

            document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "center" });

        });

    });

}



// Chiamata da map.js quando l'utente tocca la mappa in modalità selezione
async function onMapPointSelected(field, lat, lon) {

    const input = document.getElementById(field);

    if (input) {

        input.value = lat.toFixed(6) + ", " + lon.toFixed(6);

        try {

            const location = await reverseGeocode(lat, lon);

            if (location && location.name && location.name !== "Località non identificata") {
                input.value = location.name;
            }

        } catch (error) {
            // in caso di errore lasciamo le coordinate nel campo
        }

        readLegsFromForm();

    }

    document.querySelectorAll(".map-select-btn").forEach(function (b) {
        b.classList.remove("selecting");
    });

    const hint = document.getElementById("mapSelectionHint");

    if (hint) {
        hint.style.display = "none";
    }

    if (input) {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
    }

}



function minutesToTime(totalMinutes) {

    const normalized = ((totalMinutes % 1440) + 1440) % 1440;

    const h = Math.floor(normalized / 60).toString().padStart(2, "0");
    const m = Math.floor(normalized % 60).toString().padStart(2, "0");

    return h + ":" + m;

}



async function calculateItinerary() {

    const button = document.getElementById("calculateItineraryButton");

    readLegsFromForm();

    if (legs.length === 0) {
        return;
    }

    button.disabled = true;
    button.innerHTML = '<span class="btn-spinner"></span> CALCOLO...';

    clearMap();

    const camperProfile = loadCamperProfile();

    const speedValue = document.getElementById("itinerarySpeed").value;

    const camperFactor = speedValue === "" ? 1 : Number(speedValue) / 100;

    let totalDistance = 0;
    let totalDurationMin = 0;

    const bounds = [];

    // Raggruppo le tratte per giorno, per calcolare le tonalità chiaro→scuro
    const countByDay = {};

    legs.forEach(function (leg) {
        countByDay[leg.day] = (countByDay[leg.day] || 0) + 1;
    });

    const indexByDay = {};

    try {

        for (let i = 0; i < legs.length; i++) {

            const leg = legs[i];

            if (leg.startText.trim() === "" || leg.endText.trim() === "") {
                continue;
            }

            const start = await geocode(leg.startText);
            const end = await geocode(leg.endText);

            let waypoint = null;

            if (leg.stopText.trim() !== "") {
                waypoint = await geocode(leg.stopText);
            }

            const route = await computeRoute(start, waypoint, end, camperProfile);

            // route.duration è sempre calcolato ad andatura auto (anche con
            // dimensioni impostate, il tracciato viene da OpenRouteService
            // ma il tempo da OSRM): il fattore velocità si applica sempre.
            const durationMin = (route.duration / camperFactor) / 60;

            leg.distanceKm = (route.distance / 1000).toFixed(0);
            leg.durationMin =
                Math.floor(durationMin / 60) + "h " +
                Math.round(durationMin % 60) + "m";

            leg.startLat = start.lat;
            leg.startLon = start.lon;
            leg.endLat = end.lat;
            leg.endLon = end.lon;
            leg.stopLat = waypoint ? waypoint.lat : null;
            leg.stopLon = waypoint ? waypoint.lon : null;
            leg.routeCoordinates = route.geometry.coordinates;

            // Orario di arrivo, a partire dall'orario di partenza inserito
            if (leg.departureTime) {

                const [dh, dm] = leg.departureTime.split(":").map(Number);

                const departureTotal = dh * 60 + dm;

                const arrivalTotal = departureTotal + durationMin;

                leg.arrivalTime = minutesToTime(arrivalTotal);

                leg.arrivalNextDay = arrivalTotal >= 1440;

                // Suggerisco l'orario di partenza della tratta successiva,
                // solo se quel campo è ancora vuoto
                const nextLeg = legs[i + 1];

                if (nextLeg && !nextLeg.departureTime) {

                    const stopMinutes = Number(leg.stopDuration) || 0;

                    const suggested = arrivalTotal + stopMinutes;

                    nextLeg.departureTime = minutesToTime(suggested);

                }

            } else {

                leg.arrivalTime = "";
                leg.arrivalNextDay = false;

            }

            totalDistance += route.distance / 1000;
            totalDurationMin += durationMin;

            // Colore in base al giorno e alla posizione all'interno del giorno
            const dayIndex = indexByDay[leg.day] || 0;

            const color = colorForLeg(leg.day, dayIndex, countByDay[leg.day]);

            indexByDay[leg.day] = dayIndex + 1;

            addColoredPolyline(route.geometry.coordinates, color);

            addLegMarker(start.lat, start.lon, "Partenza: " + leg.startText, color);
            addLegMarker(end.lat, end.lon, "Arrivo: " + leg.endText, color);

            if (waypoint) {
                addWaypointMarker(waypoint.lat, waypoint.lon, "Tappa: " + leg.stopText);
            }

            bounds.push([start.lat, start.lon]);
            bounds.push([end.lat, end.lon]);

        }

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [30, 30] });
        }

        lastCalculation = {
            totalDistance: totalDistance,
            totalDurationMin: totalDurationMin
        };

        renderLegs();
        renderSummary();
        renderSummaryTable();

        document.getElementById("exportButtons").style.display = "flex";
        document.getElementById("mapDownloadButtons").style.display = "flex";

    } catch (error) {

        document.getElementById("itineraryResults").innerHTML =
            `<div class="error-banner">⚠️ ${error.message}</div>`;

    } finally {

        button.disabled = false;
        button.innerText = "CALCOLA ITINERARIO";

    }

}



function renderSummary() {

    if (!lastCalculation) {
        return;
    }

    const hours = Math.floor(lastCalculation.totalDurationMin / 60);
    const minutes = Math.round(lastCalculation.totalDurationMin % 60);

    document.getElementById("itineraryResults").innerHTML = `
        <div class="results-content">
            <div class="results-grid">
                <div class="result-card">
                    <div class="result-icon">📏</div>
                    <div class="result-label">Distanza totale</div>
                    <div class="result-value">${lastCalculation.totalDistance.toFixed(0)} km</div>
                </div>
                <div class="result-card">
                    <div class="result-icon">⏱️</div>
                    <div class="result-label">Guida totale</div>
                    <div class="result-value">${hours}h ${minutes}m</div>
                </div>
                <div class="result-card">
                    <div class="result-icon">🧭</div>
                    <div class="result-label">Tratte</div>
                    <div class="result-value">${legs.length}</div>
                </div>
            </div>
        </div>
    `;

}



function renderSummaryTable() {

    const container = document.getElementById("itinerarySummaryTable");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const legsWithArrival = legs.filter(function (leg) {
        return leg.endLat != null;
    });

    if (legsWithArrival.length === 0) {
        return;
    }

    const title = document.createElement("h3");
    title.className = "summary-title";
    title.textContent = "📋 Riepilogo tappe (clicca per centrare la mappa)";
    container.appendChild(title);

    const table = document.createElement("div");
    table.className = "summary-table";

    legsWithArrival.forEach(function (leg) {

        const row = document.createElement("div");
        row.className = "summary-row";

        const dayCell = document.createElement("div");
        dayCell.className = "summary-cell summary-day";
        dayCell.textContent = "G" + leg.day;

        const placeCell = document.createElement("div");
        placeCell.className = "summary-cell summary-place";
        placeCell.textContent = leg.endText;

        const timeCell = document.createElement("div");
        timeCell.className = "summary-cell summary-time";
        timeCell.textContent = (leg.arrivalTime || "-") + (leg.arrivalNextDay ? " (+1g)" : "");

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "copy-coord-btn";
        copyBtn.title = "Copia coordinate";
        copyBtn.textContent = "📍";

        copyBtn.addEventListener("click", function (event) {
            event.stopPropagation();
            copyCoordinates(leg.endLat, leg.endLon, copyBtn);
        });

        row.addEventListener("click", function () {

            focusPointOnMap(
                leg.endLat,
                leg.endLon,
                leg.endText,
                leg.arrivalTime,
                leg.arrivalNextDay,
                leg.date || ("Giorno " + leg.day)
            );

        });

        row.appendChild(dayCell);
        row.appendChild(placeCell);
        row.appendChild(timeCell);
        row.appendChild(copyBtn);

        table.appendChild(row);

    });

    container.appendChild(table);

}



function focusPointOnMap(lat, lon, place, time, nextDay, date) {

    document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "center" });

    map.setView([lat, lon], 14);

    const content =
        "<b>🕐 " + (time || "?") + (nextDay ? " (+1g)" : "") + "</b><br>" +
        "📍 " + place + "<br>" +
        "📅 " + date;

    L.popup().setLatLng([lat, lon]).setContent(content).openOn(map);

}



function copyCoordinates(lat, lon, button) {

    const text = lat.toFixed(6) + ", " + lon.toFixed(6);

    if (navigator.clipboard && navigator.clipboard.writeText) {

        navigator.clipboard.writeText(text).then(function () {
            flashCopyFeedback(button);
        }).catch(function () {
            alert("Coordinate: " + text);
        });

    } else {

        alert("Coordinate: " + text);

    }

}



function flashCopyFeedback(button) {

    const original = button.textContent;

    button.textContent = "✅";

    setTimeout(function () {
        button.textContent = original;
    }, 1500);

}



function downloadMapImage() {

    leafletImage(map, function (err, canvas) {

        if (err) {
            alert("Non è stato possibile generare l'immagine della mappa. Riprova dopo che la mappa è completamente caricata.");
            return;
        }

        const link = document.createElement("a");
        link.download = "mappa-itinerario.png";
        link.href = canvas.toDataURL("image/png");
        link.click();

    });

}



function escapeXml(text) {

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

}



function exportGPX() {

    let trkpts = "";

    legs.forEach(function (leg) {

        if (leg.routeCoordinates) {

            leg.routeCoordinates.forEach(function (point) {
                trkpts += '<trkpt lat="' + point[1] + '" lon="' + point[0] + '"></trkpt>\n';
            });

        }

    });

    let wpts = "";

    legs.forEach(function (leg) {

        if (leg.endLat) {
            wpts +=
                '<wpt lat="' + leg.endLat + '" lon="' + leg.endLon + '">' +
                '<name>' + escapeXml(leg.endText) + '</name>' +
                '</wpt>\n';
        }

    });

    const gpx =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<gpx version="1.1" creator="La sosta al punto giusto" xmlns="http://www.topografix.com/GPX/1/1">\n' +
        '<trk><name>Itinerario camper</name><trkseg>\n' +
        trkpts +
        '</trkseg></trk>\n' +
        wpts +
        '</gpx>';

    const blob = new Blob([gpx], { type: "application/gpx+xml" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "itinerario-camper.gpx";
    link.click();

}



function openInGoogleMaps() {

    const points = [];

    legs.forEach(function (leg) {

        if (leg.startLat) {
            points.push([leg.startLat, leg.startLon]);
        }

        if (leg.stopLat) {
            points.push([leg.stopLat, leg.stopLon]);
        }

        if (leg.endLat) {
            points.push([leg.endLat, leg.endLon]);
        }

    });

    if (points.length < 2) {
        alert("Calcola prima l'itinerario per generare il link.");
        return;
    }

    const origin = points[0];
    const destination = points[points.length - 1];
    const waypoints = points.slice(1, -1).slice(0, 9);

    let url =
        "https://www.google.com/maps/dir/?api=1" +
        "&origin=" + origin[0] + "," + origin[1] +
        "&destination=" + destination[0] + "," + destination[1];

    if (waypoints.length > 0) {

        url += "&waypoints=" + waypoints.map(function (p) {
            return p[0] + "," + p[1];
        }).join("|");

    }

    url += "&travelmode=driving";

    window.open(url, "_blank");

}



function focusLegOnMap(id) {

    const leg = legs.find(function (l) {
        return l.id === id;
    });

    if (!leg || !leg.startText) {
        return;
    }

    document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "center" });

    geocode(leg.startText).then(function (start) {

        if (leg.endText) {

            geocode(leg.endText).then(function (end) {
                map.fitBounds([[start.lat, start.lon], [end.lat, end.lon]], { padding: [40, 40] });
            });

        } else {

            map.setView([start.lat, start.lon], 14);

        }

    });

}



function exportCSV() {

    const header = [
        "Giorno", "Data", "Scopo", "Partenza", "Nota partenza",
        "Tappa", "Nota tappa", "Arrivo", "Nota arrivo",
        "Orario partenza", "Orario arrivo", "Distanza (km)", "Durata", "Sosta (min)"
    ];

    const rows = legs.map(function (leg) {
        return [
            leg.day, leg.date, leg.purpose, leg.startText, leg.startNote,
            leg.stopText, leg.stopNote, leg.endText, leg.endNote,
            leg.departureTime, leg.arrivalTime, leg.distanceKm || "", leg.durationMin || "", leg.stopDuration
        ];
    });

    const csvContent = [header].concat(rows)
        .map(function (row) {
            return row.map(function (cell) {
                const value = String(cell === null || cell === undefined ? "" : cell);
                return '"' + value.replace(/"/g, '""') + '"';
            }).join(";");
        })
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "itinerario-camper.csv";
    link.click();

}



function captureMapImage() {

    return new Promise(function (resolve, reject) {

        leafletImage(map, function (err, canvas) {

            if (err) {
                reject(err);
            } else {
                resolve(canvas);
            }

        });

    });

}



async function exportPDF() {

    const doc = new jspdf.jsPDF();

    doc.setFontSize(16);
    doc.text("Itinerario camper", 14, 16);

    let nextY = 22;

    try {

        const canvas = await captureMapImage();

        const imgData = canvas.toDataURL("image/png");

        const pageWidth = doc.internal.pageSize.getWidth();

        const maxWidth = pageWidth - 28;

        const imgHeight = maxWidth * (canvas.height / canvas.width);

        doc.addImage(imgData, "PNG", 14, nextY, maxWidth, imgHeight);

        nextY += imgHeight + 8;

    } catch (error) {
        // Se la mappa non è ancora completamente caricata, il PDF
        // procede comunque senza immagine, solo con la tabella.
    }

    const rows = legs.map(function (leg) {
        return [
            "G" + leg.day,
            leg.date || "",
            leg.purpose || "",
            leg.startText,
            leg.stopText || "-",
            leg.endText,
            leg.departureTime || "-",
            leg.arrivalTime ? leg.arrivalTime + (leg.arrivalNextDay ? " (+1g)" : "") : "-",
            (leg.distanceKm ? leg.distanceKm + " km" : "-")
        ];
    });

    doc.autoTable({
        startY: nextY,
        head: [["Giorno", "Data", "Scopo", "Partenza", "Tappa", "Arrivo", "Partenza ore", "Arrivo ore", "Distanza"]],
        body: rows,
        styles: { fontSize: 8 }
    });

    doc.save("itinerario-camper.pdf");

}



function updateCamperNote() {

    const note = document.getElementById("camperProfileNote");

    if (!note) {
        return;
    }

    const profile = loadCamperProfile();

    if (profile) {

        note.textContent =
            "🚐 Dimensioni camper già impostate: verranno usate per calcolare percorsi compatibili.";

        note.classList.add("camper-note-active");

    } else {

        note.textContent =
            "ℹ️ Nessuna dimensione camper impostata (puoi impostarla nella pagina principale).";

        note.classList.remove("camper-note-active");

    }

}



document.addEventListener("DOMContentLoaded", function () {

    initMap();

    updateCamperNote();

    addLeg();

    document.getElementById("addLegButton").addEventListener("click", addLeg);
    document.getElementById("calculateItineraryButton").addEventListener("click", calculateItinerary);
    document.getElementById("exportCsvButton").addEventListener("click", exportCSV);
    document.getElementById("exportPdfButton").addEventListener("click", exportPDF);
    document.getElementById("downloadMapImageButton").addEventListener("click", downloadMapImage);
    document.getElementById("exportGpxButton").addEventListener("click", exportGPX);
    document.getElementById("openGoogleMapsButton").addEventListener("click", openInGoogleMaps);

});
