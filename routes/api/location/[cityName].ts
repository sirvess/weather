import { HandlerContext } from "$fresh/server.ts";
import { CountryInfoProvider } from "https://deno.land/x/countries/infoprovider.ts";
import { ICountry } from "https://deno.land/x/countries@v1.1.2/types.ts";
import { z } from "https://deno.land/x/zod@v3.18.0/mod.ts";

const LIMIT = 5;
const API_KEY = Deno.env.get("OPENWEATHER_API_KEY");

const makeQuery = (cityName: string) =>
  `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=${LIMIT}&appid=${API_KEY}`;

const RawResponse = z.array(
  z.object({
    name: z.string(),
    country: z.string(),
    lat: z.number(),
    lon: z.number(),
  }),
);

type RawResponse = z.infer<typeof RawResponse>;

export type City = {
  name: string;
  country: ICountry;
  lat: number;
  lon: number;
};

export type ResponseType = {
  query: string;
  cities: City[];
};

const responseMapper = (res: RawResponse): Pick<ResponseType, "cities"> => {
  return {
    cities: res.map((city) => ({
      name: city.name,
      country: CountryInfoProvider.getCountryFromCode(city.country),
      lat: city.lat,
      lon: city.lon,
    })).filter((
      city,
    ): city is City => !!city.country),
  };
};

export const handler = async (
  _req: Request,
  _ctx: HandlerContext,
): Promise<Response> => {
  const { cityName } = await _ctx.params;
  const queryUrl = makeQuery(cityName);
  const res = await fetch(queryUrl).then((res) => res.json());
  const response: ResponseType = {
    query: cityName,
    ...responseMapper(RawResponse.parse(res)),
  };
  return new Response(JSON.stringify(response));
};
