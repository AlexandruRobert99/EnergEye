# EnergEye

This is the project of my Bachelor's thesis named "Web application for monitoring electricity consumption using JavaScript, Node.js and SQL".

## Requirements

 - [A browser](https://www.google.com/chrome/)
 - [Visual Studio Code](https://code.visualstudio.com/download)
 - [MySQL](https://dev.mysql.com/downloads/installer/)
 - [Node.js](https://nodejs.org/it/download/current)

 
## MySQL setup:
&nbsp;1. Open MySQL Workbench.\
&nbsp;2. Hit the + symbol right after "MySQL Connections".\
&nbsp;3. The connection name can be anything, but be sure that hostname is "localhost", username is "root" and password is "1234".\
&nbsp;4. Right-click inside Navigator (Schemas Tab) and click "Create Schema".\
&nbsp;5. Set the name as "userdb" and then click Apply.\
&nbsp;6. Double-click on "userdb" to select it.\
&nbsp;7. In menu bar, click File > Open SQL Script (or Ctrl + Shift + O) and open "database.sql" inside the project folder.\
&nbsp;8. In menu bar, click Query > Execute (All or Selection) (or Ctrl + Shift + Enter).



## Run Locally

&nbsp;1. Clone the project

```bash
  git clone https://github.com/AlexandruRobert99/EnergEye
```

&nbsp;2. Go to the project directory

```bash
  cd EnergEye
```

&nbsp;3. Install dependencies

```bash
  npm install
```

&nbsp;4. Start the server

```bash
  npm run start
```

&nbsp;5. Open your browser and type:
```bash
  http://localhost:3000/register.html
```

&nbsp;6. Register yourself and then log in.

&nbsp;7. You can add electricity consumption inside the form in "Adaugă consum" page
```bash
  http://localhost:3000/consum.html
```

&nbsp;**(Optional)** If you want to see how the web application works after more time, then you can add some random consumptions:\
&nbsp;8. In menu bar, click File > Open SQL Script (or Ctrl + Shift + O) and open "consumuri_random.sql" inside the project folder.\
&nbsp;9. In menu bar, click Query > Execute (All or Selection) (or Ctrl + Shift + Enter).\

&nbsp;**(Important)** Check the 30th line to match your user_id.\
&nbsp;user_id is autoincremented, so the first registered user is 1, the second one is 2 and so on. \
&nbsp;If this is your first time, then the 30th line should look like this:
```bash
VALUES (1, dispozitiv_nume, dispozitiv_putere, rand_timp, (dispozitiv_putere * rand_timp / 1000), DATE_SUB(CURDATE(), INTERVAL i DAY));
```