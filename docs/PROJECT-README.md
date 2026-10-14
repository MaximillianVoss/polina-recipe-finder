# Recipe Finder

## Условие и результат

**Original:** find recipes by one ingredient with MealDB.  
**Перевод:** искать рецепты по одному ингредиенту через MealDB.

Ввод нормализуется, затем приложение отправляет `GET https://www.themealdb.com/api/json/v1/1/filter.php?i=<ingredient>`. Список `FlatList` показывает `strMeal` и `strMealThumb` как название и изображение. Явно показаны ошибки, загрузка, отсутствие результатов и повторный запрос.

## Установка на macOS

Нужны Node.js не ниже 20.19.4 и npm. Выполнить `npm ci`, `npm test -- --runInBand`, `npx expo-doctor`, `npx expo export --platform android`, затем `npx expo start`.

## Реализация

`src/meals.ts` отделяет типы данных, `normalizeIngredient`, `encodeURIComponent`, проверку JSON и `fetchMeals(ingredient, fetchImpl)`. Благодаря типизированному аргументу `fetchImpl` тесты используют только `jest.fn`, поэтому не обращаются к интернету. `App.tsx` очищает прежние блюда при старте нового корректного поиска, чтобы они не выглядели новым ответом, и хранит состояние поля, списка, загрузки, ошибки и выполненного поиска. Ключи FlatList — идентификаторы MealDB, а не индексы; изображения имеют осмысленные accessibility labels, а динамические состояния объявляются через live regions/alert.

## Ручная проверка и защита

Проверить `chicken`, пустой ввод, произвольный ингредиент без результата, offline и Retry search. У MealDB в этом задании нет ключа, поэтому настройка прокси не требуется.

Вопрос: «Зачем кодировать ингредиент?» Ответ: `encodeURIComponent` корректно передаёт пробелы и специальные символы в query string.  
Question: “Why inject fetch?” Answer: deterministic tests can verify all responses without a real request.

## Сдача

Повторить команды проверки, запустить Expo и показать преподавателю успешный поиск, пустой результат и Retry search.
