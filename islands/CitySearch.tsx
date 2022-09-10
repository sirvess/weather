/** @jsx h */
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { tw } from "@twind";
import { City, ResponseType } from "../routes/api/location/[cityName].ts";

// a hook that debounces a value
// the debounced value is updated after the given delay
const useDebounce = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay],
  );
  return debouncedValue;
};

// A JSX component that renders a searchbar with autocomplete dropdown
// After debounce, the search query is automatically sent to the server,
// and the results are rendered as autocomplete options in the dropdown
const CitySearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [selectedResult, setSelectedResult] = useState(0);
  const [isRefFocused, setIsRefFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const onSelect = (city: City) => {
    window.location.href = `/weather?lat=${city.lat}&lon=${city.lon}`;
  };

  // An effect that resets selectedResult when new search results are fetched
  useEffect(() => {
    setSelectedResult(0);
  }, [searchResults]);

  // An effect that listens to if the ref is in focus
  // If it is, it listens to keyboard events
  useEffect(() => {
    if (ref.current) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // If the user presses the up arrow, we decrement the selectedResult
        if (e.key === "ArrowUp") {
          setSelectedResult((prev) => {
            if (prev === 0) {
              return searchResults.length - 1;
            }
            return prev - 1;
          });
        }
        // If the user presses the down arrow, we increment the selectedResult
        if (e.key === "ArrowDown") {
          setSelectedResult((prev) => {
            if (prev === searchResults.length - 1) {
              return 0;
            }
            return prev + 1;
          });
        }
        // If the user presses the enter key, we select the selectedResult
        if (e.key === "Enter") {
          onSelect(searchResults[selectedResult]);
        }
      };
      ref.current.addEventListener("keydown", handleKeyDown);
      return () => {
        ref.current?.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      return;
    }
  }, [ref, searchResults, selectedResult]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearchQuery) {
      fetch(window.location.origin + `/api/location/${debouncedSearchQuery}`)
        .then((res) => res.json())
        .then((data: ResponseType) => {
          setSearchResults(data.cities);
        });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  return (
    <div class={tw`flex flex-col relative`} ref={ref}>
      <input
        type="text"
        placeholder="Search for a city"
        class={tw`border border-gray-300 rounded-md p-2`}
        onFocus={() => {
          setIsRefFocused(true);
        }}
        onBlur={() => {
          setIsRefFocused(false);
        }}
        onInput={(e) => {
          setSearchQuery(
            //@ts-ignore TODO fix type
            e.target?.value,
          );
        }}
      />
      {isRefFocused && searchResults.length > 0 && (
        <ul
          class={tw
            `absolute bg-white mt-11 border border-gray-300 rounded-md p-2 w-full`}
        >
          {searchResults.map((city: City, i) => (
            <li
              key={i}
              class={tw`p-2 ${selectedResult === i ? "bg-gray-300" : ""}`}
              onMouseMove={() => {
                setSelectedResult(i);
              }}
              onMouseDown={(e) => {
                // Prevent onblur from triggering
                e.preventDefault();
              }}
              onClick={() => {
                onSelect(city);
              }}
            >
              {city.name}, {city.country.countryCode}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CitySearch;
