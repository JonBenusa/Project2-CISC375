// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
const { response } = require('express');


let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'cereal.sqlite3');

let app = express();
let port = 6969;

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
app.get('/', (req, res) => {
    let home = '/cereal/a'; // <-- change this
    res.redirect(home);
});

// GET request handler for cereal from a specific manufacturer
app.get('/cereal/:mfr', (req, res) => {
    console.log(req.params.mfr);
    let mfr = req.params.mfr.toUpperCase();
    fs.readFile(path.join(template_dir, 'cereal_template.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = 'SELECT m.name AS mfr, c.name, c.calories, c.carbohydrates, c.protein, c.fat, c.rating FROM Manufacturers AS m INNER JOIN Cereals AS c ON m.id = c.mfr WHERE c.mfr = ?';
        db.all(query, [mfr], (err, rows) => {
            console.log(err);
            console.log(rows);
            let response = template.toString();
            response = response.replace('%%MANUFACTURER%%', rows[0].mfr);
            response = response.replace('%%MFR_ALT_TEXT%%', 'logo for '+rows[0].mfr);
            response = response.replace('%%MFR_IMAGE%%', '/images/' + mfr + '_logo.png');
            let cereal_data = '';
            let i;
            for (i=0; i<rows.length; i++){
                cereals_data = cereal_data + '<tr>';
                cereal_data = cereal_data+'<td>'+rows[i].name+'</td>';
                cereal_data = cereal_data+'</tr>';
            }
            response = response.replace('%%CEREAL_INFO%%', cereal_data);

            res.status(200).type('html').send(response);
        });


        
    });
});

// Start server
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
