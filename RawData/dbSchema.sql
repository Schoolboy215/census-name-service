--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CENSUS_NAMES; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA "CENSUS_NAMES";


ALTER SCHEMA "CENSUS_NAMES" OWNER TO neondb_owner;

--
-- Name: get_weighted_first_name(text, integer, text); Type: FUNCTION; Schema: CENSUS_NAMES; Owner: neondb_owner
--

CREATE FUNCTION "CENSUS_NAMES".get_weighted_first_name(_sex text DEFAULT NULL::text, _yob integer DEFAULT NULL::integer, _state text DEFAULT NULL::text) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_weight INT;
    target_weight INT;
    cumulative_weight INT := 0;
    rec RECORD;
    v_sql text;
BEGIN
    SET search_path TO "CENSUS_NAMES";
    
    -- Create a temp table with weights multiplied by the selected race
    CREATE TEMP TABLE IF NOT EXISTS my_temp(
      name varchar(32),
      weight INT
    ) ON COMMIT DROP;
    
    IF (_sex IS NULL) AND (_yob IS NULL) AND (_state IS NULL) THEN                -- 0 0 0
      v_sql := 'INSERT INTO my_temp (name, weight) SELECT name, sum("occurences") from "firstNames" GROUP BY name;';
    ELSIF (_sex IS NOT NULL) AND (_yob IS NULL) AND (_state IS NULL) THEN         -- 1 0 0
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) FROM "firstNames" WHERE sex = ''%s'' GROUP BY name', _sex);
    ELSIF (_sex IS NULL) AND (_yob IS NOT NULL) AND (_state IS NULL) THEN         -- 0 1 0
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) FROM "firstNames" WHERE yob = %s GROUP BY name', _yob);
    ELSIF (_sex IS NOT NULL) AND (_yob IS NOT NULL) AND (_STATE IS NULL) THEN     -- 1 1 0
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) FROM "firstNames" WHERE sex = ''%s'' AND yob = %s GROUP BY name', _sex, _yob);
    ELSIF (_sex IS NULL) AND (_yob IS NULL) AND (_state IS NOT NULL) THEN         -- 0 0 1
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) FROM "firstNames" WHERE state = ''%s'' GROUP BY name', _state);
    ELSIF (_sex IS NOT NULL) AND (_yob IS NULL) AND (_state IS NOT NULL) THEN     -- 1 0 1
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) FROM "firstNames" WHERE sex = ''%s'' AND state = ''%s'' GROUP BY name', _sex, _state);
    ELSIF (_sex IS NULL) AND (_yob IS NOT NULL) AND (_state IS NOT NULL) THEN     -- 0 1 1
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) FROM "firstNames" WHERE yob = %s AND state = ''%s'' GROUP BY name', _yob, _state);
    ELSIF (_sex IS NOT NULL) AND (_yob IS NOT NULL) AND (_state IS NOT NULL) THEN -- 1 1 1
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) FROM "firstNames" WHERE sex = ''%s'' AND yob = %s AND state = ''%s'' GROUP BY name', _sex, _yob, _state);
    END IF;

    -- Execute the dynamic SQL
    EXECUTE v_sql;
    
    -- Get the sum of all weights
    SELECT SUM(weight) INTO total_weight FROM my_temp;

    -- Generate a random number between 0 and total_weight
    SELECT FLOOR(random() * total_weight) INTO target_weight;

    -- Iterate through the records and find the one matching the weighted random number
    FOR rec IN SELECT name, weight FROM my_temp LOOP
        cumulative_weight := cumulative_weight + rec.weight;
        IF cumulative_weight > target_weight THEN
            RETURN rec.name;
        END IF;
    END LOOP;
    RETURN ''; -- If nothing found
END;
$$;


ALTER FUNCTION "CENSUS_NAMES".get_weighted_first_name(_sex text, _yob integer, _state text) OWNER TO neondb_owner;

--
-- Name: get_weighted_last_name(text); Type: FUNCTION; Schema: CENSUS_NAMES; Owner: neondb_owner
--

CREATE FUNCTION "CENSUS_NAMES".get_weighted_last_name(_race text DEFAULT NULL::text) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_weight INT;
    target_weight INT;
    cumulative_weight INT := 0;
    rec RECORD;
    raceField text;
    v_sql text;
BEGIN
    SET search_path TO "CENSUS_NAMES";
    
    CASE _race
      WHEN 'white'    THEN raceField := 'pctWhite';
      WHEN 'black'    THEN raceField := 'pctBlack';
      WHEN 'asian'    THEN raceField := 'pctApi';
      WHEN 'native'   THEN raceField := 'pctAian';
      WHEN 'hispanic' THEN raceField := 'pctHispanic';
      ELSE raceField := '';
    END CASE;
    
    -- Create a temp table with weights multiplied by the selected race
    CREATE TEMP TABLE IF NOT EXISTS my_temp(
      name varchar(32),
      weight INT
    ) ON COMMIT DROP;
    
    IF _race IS NOT NULL THEN
      v_sql := format(
          'INSERT INTO my_temp (name, weight)
          SELECT name, occurences * "lastNames".%I / 100 FROM "lastNames";',
          raceField
      );
    ELSE
      v_sql := 
          'INSERT INTO my_temp (name, weight)
          SELECT name, occurences FROM "lastNames";';
    END IF;

    -- Execute the dynamic SQL
    EXECUTE v_sql;
    
    -- Get the sum of all weights
    SELECT SUM(weight) INTO total_weight FROM my_temp;

    -- Generate a random number between 0 and total_weight
    SELECT FLOOR(random() * total_weight) INTO target_weight;

    -- Iterate through the records and find the one matching the weighted random number
    FOR rec IN SELECT name, weight FROM my_temp LOOP
        cumulative_weight := cumulative_weight + rec.weight;
        IF cumulative_weight > target_weight THEN
            RETURN rec.name;
        END IF;
    END LOOP;
    RETURN ''; -- If nothing found in results
END;
$$;


ALTER FUNCTION "CENSUS_NAMES".get_weighted_last_name(_race text) OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: firstNames; Type: TABLE; Schema: CENSUS_NAMES; Owner: neondb_owner
--

CREATE TABLE "CENSUS_NAMES"."firstNames" (
    state character varying,
    sex character varying,
    yob integer,
    name character varying,
    occurences integer
);


ALTER TABLE "CENSUS_NAMES"."firstNames" OWNER TO neondb_owner;

--
-- Name: lastNames; Type: TABLE; Schema: CENSUS_NAMES; Owner: neondb_owner
--

CREATE TABLE "CENSUS_NAMES"."lastNames" (
    name character varying,
    occurences integer,
    "pctWhite" numeric,
    "pctBlack" numeric,
    "pctApi" numeric,
    "pctAian" numeric,
    "pct2Race" numeric,
    "pctHispanic" numeric
);


ALTER TABLE "CENSUS_NAMES"."lastNames" OWNER TO neondb_owner;

--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

