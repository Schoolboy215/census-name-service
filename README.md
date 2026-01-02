## Census name service
Ever wanted a random (American) name for some reason? Making a character in a roleplaying game or writing a story? Well here's a place to get a realistic-looking name that is based on real data from the US Government!

This service sources from the Social Security Administration and US Census Bureau. The names are generated based on frequency of use. When requesting a random first name it will not simply pick a random name from the table but rather weight them, giving first names that are used more often a larger relative chance of being selected. For example, if you are asking for a random female name in PA, you are hundreds of times more likely to get "Mary" than "Deandre". You can get either, but the results will skew towards the more common unless you specify otherwise.

## Hosting yourself
This service was originally written for vercel with a neonDB postgresql database. If you want to host a different way, you'll need to make an `.env.local` file with the following values filled in
```
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

No matter where you're hosting, you can create the tables in your database by using the schema backup located
[here](RawData/dbSchema.sql)

If you change the schemas or routes in `/src/app/api/schemas.ts` or `/src/app/api/generateOpenAPI.ts`, you'll need to regenerate the OpenAPI yaml and html.
Either run these commands:

```
node ./src/app/api/generateOpenAPI.ts
npx @redocly/cli@latest build-docs ./public/openapi-docs.yml --output=./public/openapi-docs.html
```
Or execute the shell script
`sh generateDocumentation.sh`

## Usage

Use the retro-styled frontend
[here](https://census-names.mckay.me)

API documentation
[here](https://census-names.mckay.me/openapi-docs.html)

## Notes about API
## Percentile and top
Percentile represents how much of the distribution to use, and top represents whether this distribution is at the most common end (true) or least common end (false). To put it into simple terms with an example, requesting `top="true", percentile=20` is equivalent to asking for a name that is in the top 20% most common names.
