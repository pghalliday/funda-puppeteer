# funda-puppeteer

Collect and archive data from https://www.funda.nl/

## Prerequisites

- NodeJS >= 8.6
- A Google API key for the maps geocoding API - https://developers.google.com/maps/documentation/geocoding/get-api-key

## Install

```
npm install -g funda-puppeteer
```

## Usage

```
funda-puppeteer [args]

Collect and archive data from https://www.funda.nl/

Options:
  --version                   Show version number                      [boolean]
  -p, --place                 The place to search
                                      [string] [required] [default: "amsterdam"]
  -o, --outputdir             The path to the output directory
                                         [string] [required] [default: "output"]
  -c, --categories            list of categories to query (searches all if
                              omitted)
       [array] [choices: "for-sale", "for-rent", "sold", "rented"] [default: []]
  -k, --google-api-key        The google API key for geocoding the addresses
                              (will skip geocoding if omitted)          [string]
  -r, --result-recheck-days   Maximum number of days before a result should be
                              rechecked (0 to check every run)
                                                           [number] [default: 7]
  -g, --geocode-recheck-days  Maximum number of days before geocode data should
                              be rechecked (0 to check every run)
                                                          [number] [default: 14]
  -m, --max-concurrent-pages  Maximum number of browser pages to load
                              concurrently                [number] [default: 16]
  -u, --user-agent            The user agent string to use for requests
     [string] [default: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML,
                                  like Gecko) Chrome/41.0.2228.0 Safari/537.36"]
  -l, --log-level             The log level for console output
      [required] [choices: "error", "warn", "info", "verbose", "debug", "silly"]
                                                               [default: "info"]
  --list-page-delay           The number of milliseconds to wait for javascript
                              to run on the list pages  [number] [default: 5000]
  --result-page-delay         The number of milliseconds to wait for javascript
                              to run on the result pages[number] [default: 5000]
  --description-delay         The number of milliseconds to wait for the result
                              description to expand     [number] [default: 1000]
  --features-delay            The number of milliseconds to wait for the result
                              features to expand        [number] [default: 1000]
  --help                      Show help                                [boolean]
```

The output directory will then be structured as follows

```
/
  logs/ - the logs from each run of the tool
    [timestamp].log
    ...
  geocodes/ - geocode data for each address
    [address]/
      [timestamp].json - the timestamped geocoding data (known addresses will be periodically rechecked for changes)
      ...
    ...
  results/
    for-sale/ - properties currently for sale
      [place]/ - the results are sorted by place as identified in the Funda URL
        [funda reference]/ - a combination of the Funda ID and address as used in the Funda URL
          [timestamp].json - the timestamped listing data (known listings will be periodically rechecked for changes)
          ...
        ...
      ...
    sold/ - properties already sold (structure will match the for-sale category)
      ...
    for-rent/ - properties currently for rent (structure will match the for-sale category)
      ...
    rented/ - properties already rented (structure will match the for-sale category)
      ...
    archive/ - for sale and for rent items that no longer appear in search results and are not in sold or rented (this may mean they were withdrawn, but could also mean the tool has not been run for a long time)
      for-sale/ - (structure will match the for-sale category)
        ...
      for-rent/ - (structure will match the for-sale category)
        ...
```

## Implementation notes

- The geocode data for a result can be looked up from the `sanitizedAddress` field of the result object. This is to avoid invalid file names.
- Results and geocode data will generally not be downloaded if it is already present in the output. However, result pages and geocode data will be rechecked randomly up to the maximum recheck days settings. This is to ensure that changes are eventually picked up and also to ensure that the hits to the Funda and Google services are distributed evenly over time.
- TODO: Once a listing has been marked as `sold` its historical data will be moved from the `for-sale` category. Similarly for `rented` and `for-rent`.
- TODO: Once a listing can no longer be found under `for-sale` or `for-rent` and it is not in `sold` or `rented`, then it will be placed in the `archive` for historical purposes (it may also be restored if the listing reappears)
