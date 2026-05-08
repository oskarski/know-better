# KnowBetter

Mobilna gra imprezowa w Next.js.

## Dane gry

Lokalnie aplikacja zapisuje stan w `data/game-state.json`.

Na Vercel aplikacja wymaga trwałego Redis REST storage. Najprostsza konfiguracja:

1. Dodaj bazę Upstash Redis w Vercel Marketplace.
2. Ustaw zmienne środowiskowe:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Zdeployuj aplikację.

Po ustawieniu Redis dane graczy są zapisywane pod kluczami `knowbetter:player:<imię>` i przetrwają restarty funkcji oraz nowe releasy. Zmienna `KNOWBETTER_STORAGE_PREFIX` pozwala rozdzielić środowiska, np. `knowbetter-prod` i `knowbetter-preview`.

Bez Redis na Vercel aplikacja celowo zgłosi błąd, żeby nie udawać trwałego zapisu na nietrwałym filesystemie.
