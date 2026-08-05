document.addEventListener("DOMContentLoaded", function(){

    initMap();


    document
    .getElementById("routeButton")
    .addEventListener("click", async function(){


        const startText =
        document.getElementById("start").value;


        const endText =
        document.getElementById("end").value;


        if (!startText || !endText) {

            alert("Inserisci partenza e arrivo");
            return;

        }


        try {

            const start =
            await geocode(startText);


            const end =
            await geocode(endText);



            const route =
            await getRoute(start,end);



            const coords =
            route.geometry.coordinates.map(
                p => [p[1],p[0]]
            );


            drawRoute(coords);


            addMarker(
                start.lat,
                start.lon,
                "Partenza: " + startText
            );


            addMarker(
                end.lat,
                end.lon,
                "Arrivo: " + endText
            );


           document.getElementById("results").innerHTML =
`
<b>Percorso calcolato</b><br><br>

Distanza:
${(route.distance/1000).toFixed(1)} km
<br>

Tempo stimato:
${Math.floor(route.duration/3600)} ore 
${Math.round((route.duration%3600)/60)} minuti
`;


        } catch(error) {

            alert(error.message);

        }


    });


});
