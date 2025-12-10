import '../config.js';

const API_KEY = process.env.MAP_API_KEY;


export async function fetchTimeStamp(lat, lng, time) {
  try {
    const dateObj = new Date(time);
    const timestamp = Math.floor(dateObj.getTime() / 1000);

    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`API Error: ${data.status}`);
    }

    const rawOffset = data.rawOffset;
    const dstOffset = data.dstOffset;
    const totalOffset = rawOffset + dstOffset;

    const localTimestamp = timestamp + totalOffset;
    const localTime = new Date(localTimestamp * 1000).toISOString();

    return {
      utcTime: time,
      localTime,
      timezone: data.timeZoneId,
      tzName: data.timeZoneName,
    };
  } catch (err) {
    console.error("Timezone API Error:", err);
    throw err;
  }
}


export async function coordsToAddress(lat, lng) {
  try {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error("Valid lat and lng required");
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("latlng", `${lat},${lng}`);
    url.searchParams.append("key", API_KEY);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000), // 5 sec timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results.length) {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const components = result.address_components.reduce((acc, comp) => {
      if (comp.types.includes("locality")) acc.city = comp.long_name;
      if (comp.types.includes("administrative_area_level_1")) acc.state = comp.short_name;
      if (comp.types.includes("country")) acc.country = comp.long_name;
      if (comp.types.includes("postal_code")) acc.postal = comp.long_name;
      return acc;
    }, {});

    return {
      address: result.formatted_address,
      lat,
      lng,
      components,
    };

  } catch (error) {
    if (error.name === "AbortError") {
      console.error("coordsToAddress timeout:", error.message);
    } else {
      console.error("coordsToAddress failed:", error.message);
    }
    return null;
  }
}

