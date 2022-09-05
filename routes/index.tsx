/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Button } from "../components/Button.tsx";
import Derpy from "../islands/CitySearchBar.tsx";

export default function Home() {
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <form>
        <input
          type="text"
          class={tw`border-black border-solid border-2 p-6`}
          placeholder="Enter your location"
          required
        >
        </input>
      </form>
      <Derpy />
    </div>
  );
}
