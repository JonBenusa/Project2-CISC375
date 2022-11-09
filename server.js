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

// Serve static files from 'public' directory
app.use(express.static(public_dir));


// GET request handler for home page '/' (redirect to desired route)
app.get('/year/:year', (req, res) => {
    
    fs.readFile(path.join(template_dir, 'main_template.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = 'SELECT flightdata.Origin_airport, flightdata.Destination_airport, flightdata.Passengers,\
         flightdata.Seats, flightdata.Flights, flightdata.Distance, flightdata.Fly_date FROM flightdata WHERE flightdata.year = ? LIMIT 50';

        db.all(query, [req.params.year] ,(err, rows)=>{
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
            response = response.replace('%%TOPIC%%', ('Year: ' + req.params.year));
            response = response.replace('%%FLIGHT_INFO%%', flight_info);
            //console.log('images\\' + mfr + '_logo.png')

            res.status(200).type('html').send(response);
        });
    });

    //let home = './public'; // <-- change this
    //res.redirect(home);
});

app.get('/dest/:dest', (req, res) => {
    
    fs.readFile(path.join(template_dir, 'main_template.html'), (err, template) => {
        
        let query = 'SELECT flightdata.Origin_airport, flightdata.Destination_airport, flightdata.Passengers,\
         flightdata.Seats, flightdata.Flights, flightdata.Distance, flightdata.Fly_date FROM flightdata WHERE flightdata.Destination_airport = ? LIMIT 50';

        console.log(req.params.dest);
        db.all(query, [req.params.dest] ,(err, rows)=>{
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

            response = response.replace('%%FLIGHT_INFO%%', flight_info);
            //console.log('images\\' + mfr + '_logo.png')

            res.status(200).type('html').send(response);
        });
    });

    //let home = './public'; // <-- change this
    //res.redirect(home);
});

app.get('/orig/:orig', (req, res) => {
    
    fs.readFile(path.join(template_dir, 'main_template.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = 'SELECT flightdata.Origin_airport, flightdata.Destination_airport, flightdata.Passengers,\
         flightdata.Seats, flightdata.Flights, flightdata.Distance, flightdata.Fly_date FROM flightdata WHERE flightdata.Origin_airport = ? LIMIT 50';

        db.all(query, [req.params.orig] ,(err, rows)=>{
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

            response = response.replace('%%FLIGHT_INFO%%', flight_info);
            //console.log('images\\' + mfr + '_logo.png')

            res.status(200).type('html').send(response);
        });
    });

    //let home = './public'; // <-- change this
    //res.redirect(home);
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
