// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'Airports2.sqlite3');

let app = express();
let port = 8000;

// Open SQLite3 database (in read-only mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});

let airports = [];
db.all('SELECT DISTINCT flightdata.Origin_airport FROM flightdata', (err, rows) => { // Sort all the airports so we can use prev and next buttons
    for (let i = 0; i < rows.length; i++) {
        airports.push(rows[i].Origin_airport);
    }
    airports = airports.sort();
    //first airport: ABE
    //last airport: ZZV
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));

app.get('/', (req, res) => {
    let home = './year/2000'; // <-- change this
    res.redirect(home);
})

// GET request handler for home page '/' (redirect to desired route)
app.get('/year/:year', (req, res) => {

    fs.readFile(path.join(template_dir, 'main_template.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = 'SELECT flightdata.Origin_airport, flightdata.Destination_airport, flightdata.Passengers,\
         flightdata.Seats, flightdata.Flights, flightdata.Distance, flightdata.Fly_date FROM flightdata WHERE flightdata.year = ? LIMIT 50';

        db.all(query, [req.params.year], (err, rows) => {
            console.log(err);
            console.log(rows);

            let response = template.toString();

            let flight_info = '';
            rows.forEach(element => {
                flight_info = flight_info + '<tr>';
                flight_info = flight_info + '<td>' + element.Fly_date + '</td>';
                flight_info = flight_info + '<td>' + element.Origin_airport + '</td>';
                flight_info = flight_info + '<td>' + element.Destination_airport + '</td>';
                flight_info = flight_info + '<td>' + element.Flights + '</td>';
                flight_info = flight_info + '<td>' + element.Seats + '</td>';
                flight_info = flight_info + '<td>' + element.Passengers + '</td>';
                flight_info = flight_info + '<td>' + element.Distance + '</td>';
                flight_info = flight_info + '</tr>';

            });

            response = response.replace('<div class="cell small-6"> <div id ="map"></div> </div>' , "" );

            if (req.params.year == 2009) {
                response = response.replace('%%NEXT%%', '/year/1999'); //wrap back around to beginning
            } else {
                response = response.replace('%%NEXT%%', ('/year/' + (parseInt(req.params.year) + 1)));
            }
            if (req.params.year == 1999) {
                response = response.replace('%%PREV%%', '/year/2009'); //wrap around to end
            } else {
                response = response.replace('%%PREV%%', ('/year/' + (parseInt(req.params.year) - 1)));
            }

            if (parseInt(req.params.year) > 2009 || parseInt(req.params.year) < 1999) { // the dataset only has flights between 1999 and 20009
                response = response.replace('%%TOPIC%%', 'Error: Invalid Year!');
                response = response.replace('%%FLIGHT_INFO%%', 'Sorry, the dataset only has data for flights between 1999 and 2009. ' + req.params.year + ' is not within this range.');
                res.status(404).type('html').send(response);
            } else {
                response = response.replace('%%TOPIC%%', ('Year: ' + req.params.year));
                response = response.replace('%%FLIGHT_INFO%%', flight_info);
                res.status(200).type('html').send(response);
            }
            //console.log('images\\' + mfr + '_logo.png')
        });
    });

});

app.get('/dest/:dest', (req, res) => {

    fs.readFile(path.join(template_dir, 'main_template.html'), (err, template) => {

        let query = 'SELECT flightdata.Origin_airport, flightdata.Destination_airport, flightdata.Passengers, flightdata.Dest_airport_lat, flightdata.Dest_airport_long, \
         flightdata.Seats, flightdata.Flights, flightdata.Distance, flightdata.Fly_date FROM flightdata WHERE flightdata.Destination_airport = ? LIMIT 50';

        console.log(req.params.dest);
        db.all(query, [req.params.dest], (err, rows) => {
            console.log(err);
            console.log(rows);

            let response = template.toString();

            let flight_info = '';
            rows.forEach(element => {
                flight_info = flight_info + '<tr>';
                flight_info = flight_info + '<td>' + element.Fly_date + '</td>';
                flight_info = flight_info + '<td>' + element.Origin_airport + '</td>';
                flight_info = flight_info + '<td>' + element.Destination_airport + '</td>';
                flight_info = flight_info + '<td>' + element.Flights + '</td>';
                flight_info = flight_info + '<td>' + element.Seats + '</td>';
                flight_info = flight_info + '<td>' + element.Passengers + '</td>';
                flight_info = flight_info + '<td>' + element.Distance + '</td>';
                flight_info = flight_info + '</tr>';

            });

            response = response.replace('AirportLat', rows[0].Dest_airport_lat);
            response = response.replace('AirportLong', rows[0].Dest_airport_long);

            if (req.params.dest == 'ZZV') {
                response = response.replace('%%NEXT%%', '/dest/ABE'); //wrap back around to beginning
            } else {
                response = response.replace('%%NEXT%%', ('/dest/' + airports[(airports.indexOf(req.params.dest) + 1)]));
            }

            if (req.params.dest == 'ABE') {
                response = response.replace('%%PREV%%', '/dest/ZZV'); //wrap around to end
            } else {
                response = response.replace('%%PREV%%', ('/dest/' + airports[(airports.indexOf(req.params.dest) - 1)]));
            }

            if (flight_info.length == 0) { // if there is no flight info, we must send an error
                if (airports.indexOf(req.params.dest) >= 0) { // if it's a valid airport, we can say there is no data
                    response = response.replace('%%FLIGHT_INFO%%', 'Sorry, no data exists in the dataset for destination airport ' + req.params.dest);
                    response = response.replace('%%TOPIC%%', 'Error: No data');
                    res.status(404).type('html').send(response);
                } else { // if it's not a valid airport, we can say that as the error
                    response = response.replace('%%FLIGHT_INFO%%', 'Sorry, ' + req.params.dest + ' is not a valid airport!');
                    response = response.replace('%%TOPIC%%', 'Error: Invalid Destination Airport!');
                    res.status(404).type('html').send(response);
                }
            } else {
                response = response.replace('%%TOPIC%%', ('Destination Airport: ' + req.params.dest));
                response = response.replace('%%FLIGHT_INFO%%', flight_info);
                //console.log('images\\' + mfr + '_logo.png')
                res.status(200).type('html').send(response);
            }
        });
    });

});

app.get('/orig/:orig', (req, res) => {

    fs.readFile(path.join(template_dir, 'main_template.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = 'SELECT flightdata.Origin_airport, flightdata.Destination_airport, flightdata.Passengers, flightdata.Org_airport_lat, flightdata.Org_airport_long, \
         flightdata.Seats, flightdata.Flights, flightdata.Distance, flightdata.Fly_date FROM flightdata WHERE flightdata.Origin_airport = ? LIMIT 50';

        db.all(query, [req.params.orig], (err, rows) => {
            console.log(err);
            console.log(rows);

            let response = template.toString();

            let flight_info = '';
            rows.forEach(element => {
                flight_info = flight_info + '<tr>';
                flight_info = flight_info + '<td>' + element.Fly_date + '</td>';
                flight_info = flight_info + '<td>' + element.Origin_airport + '</td>';
                flight_info = flight_info + '<td>' + element.Destination_airport + '</td>';
                flight_info = flight_info + '<td>' + element.Flights + '</td>';
                flight_info = flight_info + '<td>' + element.Seats + '</td>';
                flight_info = flight_info + '<td>' + element.Passengers + '</td>';
                flight_info = flight_info + '<td>' + element.Distance + '</td>';
                flight_info = flight_info + '</tr>';

            });

            response = response.replace('AirportLat', rows[0].Org_airport_lat);
            response = response.replace('AirportLong', rows[0].Org_airport_long);

            if (req.params.orig == 'ZZV') {
                response = response.replace('%%NEXT%%', '/orig/ABE'); //wrap back around to beginning
            } else {
                response = response.replace('%%NEXT%%', ('/orig/' + airports[(airports.indexOf(req.params.orig) + 1)]));
            }

            if (req.params.orig == 'ABE') {
                response = response.replace('%%PREV%%', '/orig/ZZV'); //wrap around to end
            } else {
                response = response.replace('%%PREV%%', ('/orig/' + airports[(airports.indexOf(req.params.orig) - 1)]));
            }

            if (flight_info.length == 0) { // if there is no flight info, we must send an error
                if (airports.indexOf(req.params.orig) >= 0) { // if it's a valid airport, we can say there is no data
                    response = response.replace('%%FLIGHT_INFO%%', 'Sorry, no data exists in the dataset for origin airport ' + req.params.orig);
                    response = response.replace('%%TOPIC%%', 'Error: No data');
                    res.status(404).type('html').send(response);
                } else { // if it's not a valid airport, we can say that as the error
                    response = response.replace('%%FLIGHT_INFO%%', 'Sorry, ' + req.params.orig + ' is not a valid airport!');
                    response = response.replace('%%TOPIC%%', 'Error: Invalid Origin Airport!');
                    res.status(404).type('html').send(response);
                }
            } else { // if there is at least one flight we can send the data like normal
                response = response.replace('%%TOPIC%%', ('Origin Airport: ' + req.params.orig));
                response = response.replace('%%FLIGHT_INFO%%', flight_info);
                //console.log('images\\' + mfr + '_logo.png')
                res.status(200).type('html').send(response);
            }
        });
    });
});


/*
// Example GET request handler for data about a specific year
app.get('/year/:selected_year', (req, res) => {
    console.log(req.params.selected_year);
    fs.readFile(path.join(template_dir, 'year.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database

        res.status(200).type('html').send(template); // <-- you may need to change this
    });
});
*/

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
