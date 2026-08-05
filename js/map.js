let map;

let routeLayer1;

let routeLayer2;

let markers = [];

let stopIndex = null;






function initMap(){


    map = L.map("map");


    L.tileLayer(

        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            attribution:
            "&copy; OpenStreetMap contributors"

        }

    ).addTo(map);



    map.setView(
        [45.4642, 9.1900],
        6
    );


}








function clearMap(){


    if(routeLayer1){

        map.removeLayer(routeLayer1);

    }


    if(routeLayer2){

        map.removeLayer(routeLayer2);

    }



    markers.forEach(

        function(marker){

            map.removeLayer(marker);

        }

    );



    markers = [];


}








function drawRoute(
    coordinates
){


    clearMap();



    const latlngs =

    coordinates.map(

        function(point){

            return [

                point[1],

                point[0]

            ];

        }

    );



    routeLayer1 =

    L.polyline(

        latlngs,

        {

            weight: 5,

            color: "green"

        }

    ).addTo(map);



    map.fitBounds(

        routeLayer1.getBounds()

    );


}








function drawRouteSplit(
    coordinates,
    stopLat,
    stopLon
){


    clearMap();



    const stopPosition =

    findClosestPointIndex(

        coordinates,

        stopLat,

        stopLon

    );



    const firstPart =

    coordinates
    .slice(
        0,
        stopPosition + 1
    );



    const secondPart =

    coordinates
    .slice(
        stopPosition
    );





    routeLayer1 =

    L.polyline(

        convertCoordinates(firstPart),

        {

            weight: 6,

            color: "green"

        }

    ).addTo(map);





    routeLayer2 =

    L.polyline(

        convertCoordinates(secondPart),

        {

            weight: 6,

            color: "blue"

        }

    ).addTo(map);



    map.fitBounds(

        routeLayer1.getBounds()

    );


}








function convertCoordinates(
    coordinates
){


    return coordinates.map(

        function(point){

            return [

                point[1],

                point[0]

            ];

        }

    );


}








function findClosestPointIndex(
    coordinates,
    lat,
    lon
){


    let minimum = Infinity;

    let index = 0;



    coordinates.forEach(

        function(point, i){


            const distance =

            Math.sqrt(

                Math.pow(point[1]-lat,2)

                +

                Math.pow(point[0]-lon,2)

            );



            if(distance < minimum){

                minimum = distance;

                index = i;

            }


        }

    );



    return index;


}








function addMarker(
    lat,
    lon,
    text
){


    let color = "green";



    if(text === "Destinazione"){

        color = "red";

    }



    const icon =

    L.divIcon({

        className:
        "custom-marker",

        html:

        `<div style="
        background:${color};
        width:18px;
        height:18px;
        border-radius:50%;
        border:2px solid white;">
        </div>`


    });





    const marker =

    L.marker(

        [

            lat,

            lon

        ],

        {

            icon: icon

        }

    )

    .addTo(map)

    .bindPopup(text);



    markers.push(marker);


}








function addStopMarker(
    lat,
    lon
){


    const icon =

    L.divIcon({

        className:
        "stop-marker",

        html:

        `<div style="
        font-size:32px;">
        ⭐
        </div>`


    });



    const marker =

    L.marker(

        [

            lat,

            lon

        ],

        {

            icon: icon

        }

    )

    .addTo(map)

    .bindPopup(

        "<b>Sosta prevista</b>"

    );



    markers.push(marker);


}
