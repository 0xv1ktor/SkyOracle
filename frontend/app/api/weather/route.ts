import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const city = searchParams.get('city') || 'Unknown'

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weathercode,windspeed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&forecast_days=7&timezone=auto`

  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    const data = await res.json()

    const current = data.current || {}
    const daily = data.daily || {}

    const wmo: Record<number, string> = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle',
      55: 'Heavy drizzle', 61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers',
      81: 'Rain showers', 82: 'Heavy showers', 95: 'Thunderstorm',
      96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail',
    }

    const code = current.weathercode ?? 0
    const condition = wmo[code] ?? 'Unknown'
    const isRaining = code >= 51

    return NextResponse.json({
      city,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      current: {
        temperature: current.temperature_2m ?? null,
        precipitation: current.precipitation ?? 0,
        windspeed: current.windspeed_10m ?? null,
        humidity: current.relative_humidity_2m ?? null,
        weathercode: code,
        condition,
        isRaining,
      },
      daily: {
        dates: daily.time ?? [],
        tempMax: daily.temperature_2m_max ?? [],
        tempMin: daily.temperature_2m_min ?? [],
        precipSum: daily.precipitation_sum ?? [],
        weathercodes: daily.weathercode ?? [],
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 })
  }
}
