import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to normalize strings
const upper = v => v.trim().toUpperCase();


const countries = JSON.parse(
  fs.readFileSync(path.join(__dirname, "countries.json"), "utf-8")
);

const states = JSON.parse(
  fs.readFileSync(path.join(__dirname, "states.json"), "utf-8")
);

const cities = JSON.parse(
  fs.readFileSync(path.join(__dirname, "cities.json"), "utf-8")
);

//Indexes

const countryByCode = new Map();
const statesByCountry = new Map();
const citiesByState = new Map();
const stateByCountryAndCode = new Map();


// Countries
for (const c of countries) {
  if (!c.iso2) continue;
  countryByCode.set(upper(c.iso2), c);
}

// States
for (const s of states) {
  // states by country
  if (!statesByCountry.has(s.country_id)) {
    statesByCountry.set(s.country_id, []);
  }
  statesByCountry.get(s.country_id).push(s);

  // composite key
  if (s.country_code && s.state_code) {
    const key = `${upper(s.country_code)}-${upper(s.state_code)}`;
    stateByCountryAndCode.set(key, s);
  }
}

// Cities
for (const c of cities) {
  if (!citiesByState.has(c.state_id)) {
    citiesByState.set(c.state_id, []);
  }
  citiesByState.get(c.state_id).push(c);
}



router.get("/countries", (req, res) => {
  res.json({
    ok: true,
    data: countries.map(c => ({
      name: c.name,
      iso2: c.iso2,
    })),
  });
});



router.get("/states/:country_code", (req, res) => {
  const countryCode = upper(req.params.country_code);
  const country = countryByCode.get(countryCode);

  if (!country) {
    return res.status(404).json({
      ok: false,
      message: "Country not found",
    });
  }

  res.json({
    ok: true,
    data: (statesByCountry.get(country.id) || []).map(s => ({
      name: s.name,
      state_code: s.state_code,
    })),
  });
});


router.get("/cities/:country_code/:state_code", (req, res) => {
  const countryCode = upper(req.params.country_code);
  const stateCode = upper(req.params.state_code);

  const key = `${countryCode}-${stateCode}`;
  const state = stateByCountryAndCode.get(key);

  if (!state) {
    return res.status(404).json({
      ok: false,
      message: "State not found for this country",
    });
  }

  res.json({
    ok: true,
    data: (citiesByState.get(state.id) || []).map(c => ({
      id: c.id,
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
    })),
  });
});

export default router;
