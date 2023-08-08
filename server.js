const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql');
const path = require('path');
const moment = require('moment');

const app = express();
const port = 3000;


// Configurarea conexiunii la baza de date MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'userdb'
});

// Conectarea la baza de date
connection.connect((err) => {
  if (err) throw err;
  console.log('Conectat la baza de date MySQL');
});

// Configurarea parserului JSON pentru a prelua datele din cereri
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurarea sesiunii
app.use(
  session({
    secret: 'mysecretkey',
    resave: true,
    saveUninitialized: true
  })
);

// Configurarea motorului de sabloane EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pentru verificarea starii de autentificare
const checkAuthentication = (req, res, next) => {
  if (req.session.authenticated) {
    next(); // Permite accesul catre ruta solicitata daca utilizatorul este autentificat
  } else {
    res.redirect('/login.html'); // Redirectioneaza catre pagina de login daca utilizatorul nu este autentificat
  }
};

app.get('/', (req, res) => {
  res.redirect('/login.html');
});


// !!!!!!!     REGISTER.HTML     !!!!!!!

// Ruta pentru inregistrare
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  // Verifica daca utilizatorul exista deja in baza de date
  connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
    if (error) throw error;
    if (results.length > 0) {
      res.json({ success: false, message: 'Numele de utilizator exista deja.' });
    } else {
      // Insereaza utilizatorul in baza de date
      connection.query('INSERT INTO users SET ?', { username, password }, (error) => {
        if (error) throw error;
        res.json({ success: true, message: 'inregistrare reusită.' });
      });
    }
  });
});

// !!!!!!!     LOGIN.HTML     !!!!!!!

// Ruta pentru autentificare
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Verifica credidentialele utilizatorului in baza de date
    connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (error, results) => {
      if (error) throw error;
      if (results.length > 0) {
        req.session.authenticated = true; // Setează starea de autentificare in sesiune
        req.session.userId = results[0].id; // Setează ID-ul utilizatorului in sesiune
        res.json({ success: true, message: 'Autentificare reusită' });
      } else {
        res.json({ success: false, message: 'Nume de utilizator sau parolă incorectă' });
      }
    });
  });
  

// Ruta pentru deconectare
app.post('/logout', (req, res) => {
  req.session.destroy(); // Distruge sesiunea utilizatorului la deconectare
  res.json({ success: true, message: 'Delogare efectuată' });
});


// !!!!!!!     DASHBOARD.HTML     !!!!!!!

// Ruta pentru pagina de dashboard
app.get('/dashboard.html', checkAuthentication, (req, res) => {
  const userId = req.session.userId; // Obtine ID-ul utilizatorului autentificat

  // Selecteaza suma consumului de azi, suma consumurilor pentru ultimele 7 zile si suma consumurilor pentru ultimele 30 de zile
  const query = `
    SELECT
      COALESCE((SELECT SUM(consum) FROM consum WHERE user_id = ? AND DATE(data_calendar) = CURDATE()), 0) AS aziConsum,
      COALESCE((SELECT SUM(consum) FROM consum WHERE user_id = ? AND DATE(data_calendar) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)), 0) AS saptamanaConsum,
      COALESCE((SELECT SUM(consum) FROM consum WHERE user_id = ? AND DATE(data_calendar) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)), 0) AS lunaConsum
  `;

  // Selecteaza referinta utilizatorului din tabela users
  const queryReferinta = 'SELECT referinta FROM users WHERE id = ?';

  connection.query(query, [userId, userId, userId], (error, results) => {
    if (error) throw error;
    const aziConsum = results[0].aziConsum;
    const saptamanaConsum = results[0].saptamanaConsum;
    const lunaConsum = results[0].lunaConsum;

    // Selecteaza referinta utilizatorului din tabela users
    connection.query(queryReferinta, [userId], (error, results) => {
      if (error) throw error;
      const referinta = results[0].referinta;

      // Selecteaza topul consumatorilor per total
      connection.query('SELECT nume, MAX(putere) AS putere, SUM(timp) as durataTotala, MAX(data_calendar) AS ultimaData, SUM(consum) AS totalConsum FROM consum WHERE user_id = ? GROUP BY nume, putere ORDER BY totalConsum DESC', [userId], (error, results) => {
        if (error) throw error;
        const topConsumatori = results.map(item => ({
          nume: item.nume,
          putere: item.putere,
          durataTotala: item.durataTotala,
          ultimaData: item.ultimaData,
          totalConsum: item.totalConsum
        }));

        res.render('dashboard', { referinta, aziConsum, saptamanaConsum, lunaConsum, topConsumatori, moment });
      });
    });
  });
});

  
  

// !!!!!!!     CONSUM.HTML     !!!!!!!

// Ruta pentru pagina de consum
app.get('/consum.html', checkAuthentication, (req, res) => {
    const userId = req.session.userId; // Obtine ID-ul utilizatorului autentificat
  
    // Obtine datele consumului specific pentru utilizatorul autentificat din baza de date si le salveaza in variabila `consum`
    connection.query('SELECT * FROM consum WHERE user_id = ? ORDER BY data_calendar DESC', [userId], (error, results) => {
      if (error) throw error;
      const consum = results; // Nu mai este nevoie să inversam ordinea deoarece rezultatele sunt deja in ordinea dorita
      res.render('consum', { consum, moment }); // Furnizeaza variabila `consum` la randarea sablonului
    });    
  });
  
  

// Ruta pentru adaugarea consumului in baza de date
app.post('/add-consum', checkAuthentication, (req, res) => {
    const { nume, putere, timp } = req.body;
  
    // Verifica daca toate valorile necesare sunt definite
    if (nume && putere && timp) {
      const consum = putere * timp / 1000;
      const userId = req.session.userId;
      const data_calendar = new Date(); // Obtine timpul actual
  
      const data = {
        user_id: userId,
        nume: nume,
        putere: putere,
        timp: timp,
        consum: consum,
        data_calendar: data_calendar // Adauga valoarea timpului de creare
      };
  
      connection.query('INSERT INTO consum SET ?', data, (error) => {
        if (error) {
          console.error(error);
        } else {
          res.redirect('/consum.html');
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid request' });
    }
});
  

// !!!!!!!     GRAFIC.HTML     !!!!!!!

// Ruta pentru pagina de grafic
app.get('/grafic.html', checkAuthentication, (req, res) => {
  res.render('grafic');
});

app.post('/dataGrafic', checkAuthentication, (req, res) => {
  const userId = req.session.userId;
  const period = req.body.period;

  let query = '';
  if (period === 'saptamana') {
    query = `
      SELECT days.day AS date, IFNULL(consumData.total, 0) AS total
      FROM (
        SELECT 'Luni' AS day
        UNION SELECT 'Marti' AS day
        UNION SELECT 'Miercuri' AS day
        UNION SELECT 'Joi' AS day
        UNION SELECT 'Vineri' AS day
        UNION SELECT 'Sambata' AS day
        UNION SELECT 'Duminica' AS day
      ) days
      LEFT JOIN (
        SELECT CASE 
          WHEN DAYOFWEEK(data_calendar) = 2 THEN 'Luni'
          WHEN DAYOFWEEK(data_calendar) = 3 THEN 'Marti'
          WHEN DAYOFWEEK(data_calendar) = 4 THEN 'Miercuri'
          WHEN DAYOFWEEK(data_calendar) = 5 THEN 'Joi'
          WHEN DAYOFWEEK(data_calendar) = 6 THEN 'Vineri'
          WHEN DAYOFWEEK(data_calendar) = 7 THEN 'Sambata'
          WHEN DAYOFWEEK(data_calendar) = 1 THEN 'Duminica'
          END AS day, SUM(consum) AS total
        FROM consum
        WHERE user_id = ? AND YEARWEEK(data_calendar, 1) = YEARWEEK(CURRENT_DATE(), 1)
        GROUP BY DAYOFWEEK(data_calendar)
      ) consumData
      ON days.day = consumData.day
      ORDER BY FIELD(days.day, 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata', 'Duminica')
    `;
  }
  else if (period === 'luna') {
    query = `
      SELECT days.day AS date, IFNULL(consumData.total, 0) AS total
      FROM (
        SELECT a.a + (10 * b.a) + (100 * c.a) + 1 AS day
        FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a
        CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) AS b
        CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1) AS c
      ) days
      LEFT JOIN (
        SELECT DAY(data_calendar) AS day, SUM(consum) AS total
        FROM consum
        WHERE user_id = ? AND YEAR(data_calendar) = YEAR(CURRENT_DATE()) AND MONTH(data_calendar) = MONTH(CURRENT_DATE())
        GROUP BY DAY(data_calendar)
      ) consumData
      ON days.day = consumData.day
      WHERE days.day <= DAY(LAST_DAY(CURRENT_DATE()))
      ORDER BY days.day
    `;
  }
  
  else if (period === 'an') {
    query = `
      SELECT months.month AS date, IFNULL(consumData.total, 0) AS total
      FROM (
        SELECT a.a + (10 * b.a) + 1 AS month
        FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a
        CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1) AS b
      ) months
      LEFT JOIN (
        SELECT MONTH(data_calendar) AS month, SUM(consum) AS total
        FROM consum
        WHERE user_id = ? AND YEAR(data_calendar) = YEAR(CURRENT_DATE())
        GROUP BY MONTH(data_calendar)
      ) consumData
      ON months.month = consumData.month
      WHERE months.month <= MONTH(CURRENT_DATE())
      ORDER BY months.month
    `;
  }
  
  connection.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Eroare la interogarea bazei de date:', error);
      res.status(500).json({ error: 'Eroare la obținerea datelor graficului' });
      return;
    }

    const data = results.map(item => ({
      label: period === 'saptamana' ? item.day : period === 'luna' ? item.day : item.month,
      value: item.total
    }));

    res.json({ data });
  });
});


// !!!!!!!     SETARI.HTML     !!!!!!!


app.get('/setari.html', checkAuthentication, (req, res) => {
  const userId = req.session.userId;

  // Obtine valoarea referintei din baza de date pentru utilizatorul logat
  connection.query('SELECT referinta FROM users WHERE id = ?', [userId], (error, results) => {
    if (error) {
      console.error('Eroare la obținerea referintei:', error);
      return res.status(500).send('<script>alert("Eroare la obținerea referintei."); window.location="/setari.html";</script>');
    }

    const referinta = results[0].referinta; // Obtine valoarea referintei din rezultatele interogarii

    // Randeaza pagina de setari si furnizeaza valoarea referintei la randarea sablonului
    res.render('setari', { referinta });
  });
});

// Ruta pentru actualizarea referintei
app.post('/update-referinta', checkAuthentication, (req, res) => {
  const userId = req.session.userId; // Obtine ID-ul utilizatorului autentificat
  const referinta = req.body.referinta; // Obtine noua valoare a referintei din cerere


  // Actualizeaza referinta utilizatorului in baza de date
  connection.query('UPDATE users SET referinta = ? WHERE id = ?', [referinta, userId], (error) => {
    if (error) throw error;
    res.redirect('/setari.html'); // Redirectioneaza inapoi catre pagina de setari
  });
});



// Ruta pentru servirea fisierelor statice (HTML, CSS, JS)
app.use(express.static('public'));

// Pornirea serverului
app.listen(port, () => {
  console.log(`Server-ul rulează pe portul: ${port}`);
});

