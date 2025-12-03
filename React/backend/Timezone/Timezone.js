import '../config.js';

const API_KEY = process.env.MAP_API_KEY;


export async function fetchTimeStamp(lat, lon, time) {
  try {
    const dateObj = new Date(time);
    const timestamp = Math.floor(dateObj.getTime() / 1000);

    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${timestamp}&key=${API_KEY}`;

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
