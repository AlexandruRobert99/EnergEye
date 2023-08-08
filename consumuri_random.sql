DELIMITER //

CREATE PROCEDURE AddRandomData()
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE rand_dispozitiv INT;
  DECLARE rand_timp DECIMAL(10,2);
  DECLARE dispozitiv_nume VARCHAR(255);
  DECLARE dispozitiv_putere DECIMAL(10,2);
  WHILE i < 180 DO
    -- Alegem un numar aleatoriu intre 1 si 5
    SET rand_dispozitiv = FLOOR(1 + RAND() * 5);
    -- Atribuim numele si puterea dispozitivului in functie de numarul ales
    SET dispozitiv_nume = CASE rand_dispozitiv 
      WHEN 1 THEN 'Aspirator'
      WHEN 2 THEN 'TV'
      WHEN 3 THEN 'Frigider'
      WHEN 4 THEN 'Cuptor cu microunde'
      WHEN 5 THEN 'Masina de spalat'
      END;
    SET dispozitiv_putere = CASE rand_dispozitiv 
      WHEN 1 THEN 1000
      WHEN 2 THEN 100
      WHEN 3 THEN 200
      WHEN 4 THEN 700
      WHEN 5 THEN 800
      END;
    SET rand_timp = RAND() * 8;
    INSERT INTO consum (user_id, nume, putere, timp, consum, data_calendar)
    VALUES (1, dispozitiv_nume, dispozitiv_putere, rand_timp, (dispozitiv_putere * rand_timp / 1000), DATE_SUB(CURDATE(), INTERVAL i DAY));
    SET i = i + 1;
  END WHILE;
END //



DELIMITER ;

CALL AddRandomData();

DROP PROCEDURE IF EXISTS AddRandomData;

