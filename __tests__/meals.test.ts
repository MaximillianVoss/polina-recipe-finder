import {
  buildMealsUrl,
  fetchMeals,
  normalizeIngredient,
  normalizeMealResponse,
  type FetchImplementation,
  type FetchResponse,
} from '../src/meals';

const mealPayload = {
  meals: [
    {
      idMeal: '52772',
      strMeal: 'Teriyaki Chicken',
      strMealThumb: 'https://img/chicken.jpg',
    },
  ],
};

function createResponse(payload: unknown, ok = true): FetchResponse {
  return { ok, json: async () => payload };
}

test('normalizes an ingredient and encodes it in the documented MealDB URL', () => {
  expect(normalizeIngredient('  chicken breast ')).toEqual({ ok: true, ingredient: 'chicken breast' });
  expect(buildMealsUrl('chicken breast')).toBe(
    'https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken%20breast',
  );
});

test('normalizes a valid MealDB payload into application meals', () => {
  expect(normalizeMealResponse(mealPayload)).toEqual({
    ok: true,
    meals: [{ id: '52772', name: 'Teriyaki Chicken', thumbnail: 'https://img/chicken.jpg' }],
  });
});

test.each<unknown>([
  null,
  {},
  { meals: 'not an array' },
  { meals: [{ idMeal: '52772', strMeal: 'Incomplete meal' }] },
])('rejects a malformed external payload: %p', (payload) => {
  expect(normalizeMealResponse(payload)).toEqual({ ok: false, error: 'Could not load recipes. Try again.' });
});

test('fetchMeals returns normalized list data without network access', async () => {
  const fetchImpl: FetchImplementation = jest
    .fn<Promise<FetchResponse>, [string]>()
    .mockResolvedValue(createResponse(mealPayload));

  await expect(fetchMeals('chicken', fetchImpl)).resolves.toEqual({
    ok: true,
    meals: [{ id: '52772', name: 'Teriyaki Chicken', thumbnail: 'https://img/chicken.jpg' }],
  });
  expect(fetchImpl).toHaveBeenCalledWith(
    'https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken',
  );
});

test.each<[FetchImplementation]>([
  [jest.fn<Promise<FetchResponse>, [string]>().mockResolvedValue(createResponse({}, false))],
  [jest.fn<Promise<FetchResponse>, [string]>().mockRejectedValue(new Error('offline'))],
])('fetchMeals exposes a retryable request error', async (fetchImpl) => {
  await expect(fetchMeals('chicken', fetchImpl)).resolves.toEqual({
    ok: false,
    error: 'Could not load recipes. Try again.',
  });
});
