/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import CitySearch from "../islands/CitySearch.tsx";
import { HandlerContext, PageProps } from "$fresh/server.ts";
import { HttpErrorCodes } from "../utils/httpCodes.ts";
import { z } from "https://deno.land/x/zod@v3.18.0/mod.ts";

const API_KEY = Deno.env.get("OPENWEATHER_API_KEY");

const makeQuery = ({ lat, lon }: { lat: number; lon: number }) => {
  return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
};

const RawWeatherResponse = z.object({
  coord: z.object({
    lon: z.number(),
    lat: z.number(),
  }),
  weather: z.array(z.object({
    id: z.number(),
    main: z.string(),
    description: z.string(),
    icon: z.string(),
  })),
  base: z.string(),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    pressure: z.number(),
  }),
  visibility: z.number(),
  wind: z.object({
    speed: z.number(),
    deg: z.number(),
  }),
  clouds: z.object({
    all: z.number(),
  }),
  dt: z.number(),
  sys: z.object({
    country: z.string(),
    sunrise: z.number(),
    sunset: z.number(),
  }),
  timezone: z.number(),
  id: z.number(),
  name: z.string(),
});

type WeatherResponse = z.infer<typeof RawWeatherResponse>;

export const handler = async (
  _req: Request,
  _ctx: HandlerContext,
): Promise<Response> => {
  const searchParams = new URLSearchParams(_req.url.split("?")[1]);
  const [lat, lon] = ["lat", "lon"].map((key) => searchParams.get(key));
  if (!(lat && lon)) {
    return new Response("Missing lat or lon", {
      status: HttpErrorCodes.BadRequest,
    });
  }
  if (isNaN(Number(lat)) || isNaN(Number(lon))) {
    return new Response("lat or lon is not a number", {
      status: HttpErrorCodes.BadRequest,
    });
  }

  const query = makeQuery({ lat: Number(lat), lon: Number(lon) });
  const res = await fetch(query).then((res) => res.json()).then((res) =>
    RawWeatherResponse.parse(res)
  );

  return _ctx.render(res);
};

export default function WeatherPage(props: PageProps<WeatherResponse>) {
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <CitySearch />
      <div class={tw`mt-4`}>
        <h1 class={tw`text-2xl`}>
          Weather in {props.data.name}, {props.data.sys.country}
        </h1>
        <div>
          {props.data.weather.map((weather) => (
            <div>
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                alt={weather.description}
              />
              <span>{weather.description}</span>
            </div>
          ))}
          {props.data.main.temp} °C
        </div>
      </div>
    </div>
  );
}
