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

## Panel admina

Panel jest dostępny pod `/admin`.

Domyślne dane logowania:

- login: `admin`
- hasło: `admin30`

Opcjonalnie można je nadpisać zmiennymi:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Panel pokazuje graczy posortowanych po postępie i pozwala wyczyścić zapisane odpowiedzi dla jednej osoby, usunąć gracza albo wyczyścić stan wszystkich graczy naraz.

Po zakończeniu zbierania odpowiedzi admin może zamknąć grę. Zamknięta gra nie przyjmuje już nowych odpowiedzi ani podpowiedzi. Panel pozwala potem losować maksymalnie 3 zwycięzców po kolei, na bazie liczby losów zdobytych przez graczy.
