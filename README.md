## Census name service
Ever wanted a random (American) name for some reason? Making a character in a roleplaying game or writing a story? Well here's a place to get a realistic-looking name that is based on real data from the US Government!

This service sources from the Social Security Administration and US Census Bureau. The names are generated based on frequency of use. When requesting a random first name it will not simply pick a random name from the table but rather weight them, giving first names that are used more often a larger relative chance of being selected. For example, if you are asking for a random female name in PA, you are hundreds of times more likely to get "Mary" than "Deandre". You can get either, but the results will skew towards the more common unless you specify otherwise.

## Hosting yourself
This service was originally written for vercel with a neonDB postgresql database. If you want to host a different way, you'll need to make an `.env.local` file with the following values filled in
```
REQUIRE_API_KEYS=""
MIN_SECONDS_BETWEEN_REQUESTS = ""
DATABASE_URL=""
DATABASE_URL_UNPOOLED=""
PGDATABASE=""
PGHOST=""
PGHOST_UNPOOLED=""
PGPASSWORD=""
PGUSER=""
POSTGRES_DATABASE=""
POSTGRES_HOST=""
POSTGRES_PASSWORD=""
POSTGRES_PRISMA_URL=""
POSTGRES_URL=""
POSTGRES_URL_NON_POOLING=""
POSTGRES_URL_NO_SSL=""
POSTGRES_USER=""
```

`REQUIRE_API_KEYS` should be "true" if you want to validate keys for requests to any /api endpoint when not coming from the web frontend.

`MIN_SECONDS_BETWEEN_REQUEST` should the number of seconds that a key must wait between requests. For example `"1"` means users can request once per second. `"0.1"` would mean they could request every 100 ms.

No matter where you're hosting, you can create the tables in your database by using the schema backup located
[here](RawData/dbSchema.sql)

If you change the schemas or routes in `/src/app/api/schemas.ts` or `/src/app/api/generateOpenAPI.ts`, you'll need to regenerate the OpenAPI yaml and html. If using github, the action defined in `.github/workflows/build-documentation.yml` should automatically generate these files and commit them for you.

If you need to generate them locally a different way, try either:
1. Taskfile
    ```bash
    task documentation
    ```
2. Shell script
    ```bash
    sh generateDocumentation.sh
    ```

## Usage

Use the retro-styled frontend
[here](https://census-names.mckay.me)

API documentation
[here](https://census-names.mckay.me/openapi-docs.html)

## Notes about API
## Percentile and top
Percentile represents how much of the distribution to use, and top represents whether this distribution is at the most common end (true) or least common end (false). To put it into simple terms with an example, requesting `top="true", percentile=20` is equivalent to asking for a name that is in the top 20% most common names.
