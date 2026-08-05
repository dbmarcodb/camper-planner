let map;

let routeLayer;

let markers = [];





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


    if(routeLayer){

        map.removeLayer(
            routeLayer
        );

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



    routeLayer =

    L.polyline(

        latlngs,

        {

            weight: 5

        }

    ).addTo(map);



    map.fitBounds(
        routeLayer.getBounds()
    );


}









function addMarker(
    lat,
    lon,
    text
){


    const marker =

    L.marker(

        [

            lat,

            lon

        ]

    )

    .addTo(map)

    .bindPopup(text);



    markers.push(marker);



}









function addStopMarker(
    lat,
    lon
){


    const marker =

    L.marker(

        [

            lat,

            lon

        ]

    )

    .addTo(map);



    marker.bindPopup(

        "<b>Sosta prevista</b><br>" +

        "Punto stimato"

    );



    markers.push(marker);


}
