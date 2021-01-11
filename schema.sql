DROP TABLE IF EXISTS search;

CREATE TABLE  search 
(
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  longitude DEC(10,10),
  latitude DEC(10,10),
  formatted_query VARCHAR(255)
);

-- DROP TABLE IF EXISTS forcast

-- CREATE TABLE  forcast 
-- (
--   id SERIAL PRIMARY KEY,
--   forecast VARCHAR(255),
--   time VARCHAR(255)
-- );