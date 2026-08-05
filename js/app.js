let currentStopLocation = "";



document.addEventListener("DOMContentLoaded", function () {


    initMap();



    document
    .getElementById("routeButton")
    .addEventListener("click", async function () {


        const button =
        document.getElementById("routeButton");


        button.disabled = true;

        button.innerText = "CALCOLO...";



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



            if (stopText.trim() !== "") {


                const stop =
                await geocode(stopText);


                route =
                await getRouteWithWaypoint(
                    start,
                    stop,
                    end
                );


            } else {


                route =
                await getRoute(
                    start,
                    end
                );

            }



            


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



            document
            .getElementById("results")
            .innerHTML = `


            <div>

            Distanza

            <br>

            <b>
            ${(route.distance/1000).toFixed(1)}
            km
            </b>


            <br><br>


            <b>
            Tempo in camper
            </b>

            <br>

            <b>
            ${camperHours} ore
            ${camperMinutes} minuti
            </b>


            <br><br>


            A velocità standard si impiegherebbero:

            <br>

            ${standardHours} ore
            ${standardMinutes} minuti


            <br><br><br>


            <b>
            Alle ore ${stopTime} sarai a
            </b>


            <br>


            <span class="stop-location">

            ${stopTextResult}

            </span>


            <br><br>


            Coordinate:

            <br>

            ${stopCoordinates}


            <br><br>


            Velocità camper:

            ${speedValue || 100}%


            <br><br>


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





function saveData() {


    const fields = [
        "start",
        "stop",
        "end",
        "camperSpeedFactor",
        "departureTime",
        "stopTime"
    ];



    fields.forEach(function(id){


        localStorage.setItem(
            id,
            document.getElementById(id).value
        );


    });


}






function copyStopLocation(){


    navigator.clipboard.writeText(
        currentStopLocation
    );


}






window.onload = function(){


    const fields = [
        "start",
        "stop",
        "end",
        "camperSpeedFactor",
        "departureTime",
        "stopTime"
    ];



    fields.forEach(function(id){


        const value =
        localStorage.getItem(id);



        if(value !== null){

            document.getElementById(id).value =
            value;

        }


    });


};

function setupAutocomplete(inputId, listId){


const input =
document.getElementById(inputId);


const list =
document.getElementById(listId);



let timer;



input.addEventListener(
"input",
function(){


clearTimeout(timer);



timer=setTimeout(
async function(){


const value =
input.value;



if(value.length < 3){

list.innerHTML="";
return;

}



const url =

"https://nominatim.openstreetmap.org/search?format=json&q="

+

encodeURIComponent(value)

+

"&limit=5";



const response =
await fetch(url);



const results =
await response.json();



list.innerHTML="";



results.forEach(
function(item){


const div =
document.createElement("div");


div.innerText =
item.display_name;



div.onclick =
function(){


input.value =
item.display_name;


list.innerHTML="";


};



list.appendChild(div);



});


},
500);


});


}



document.addEventListener(
"DOMContentLoaded",
function(){


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


function setupAutocomplete(inputId, suggestionsId) {


    const input =
    document.getElementById(inputId);


    const suggestions =
    document.getElementById(suggestionsId);



    let timer;



    input.addEventListener(
        "input",
        function(){


            clearTimeout(timer);



            timer = setTimeout(
                async function(){


                    const text =
                    input.value.trim();



                    if(text.length < 3){


                        suggestions.innerHTML = "";

                        return;


                    }




                    const url =

                    "https://nominatim.openstreetmap.org/search?format=json&limit=5&q="

                    +

                    encodeURIComponent(text);




                    const response =
                    await fetch(url);



                    const results =
                    await response.json();




                    suggestions.innerHTML = "";




                    results.forEach(
                        function(place){



                            const item =
                            document.createElement("div");



                            item.innerText =
                            place.display_name;




                            item.onclick =
                            function(){


                                input.value =
                                place.display_name;


                                suggestions.innerHTML =
                                "";


                            };



                            suggestions.appendChild(item);



                        }
                    );



                },

                500

            );


        }

    );


}






document.addEventListener(
"DOMContentLoaded",
function(){


    setupAutocomplete(
        "start",
        "startSuggestions"
    );


    setupAutocomplete(
        "end",
        "endSuggestions"
    );


});

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



        localStorage.removeItem("start");

        localStorage.removeItem("stop");

        localStorage.removeItem("end");

        localStorage.removeItem("departureTime");

        localStorage.removeItem("stopTime");



        if (typeof clearMap === "function") {

            clearMap();

        }


    };


}
