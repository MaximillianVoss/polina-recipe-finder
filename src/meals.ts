export type Meal = {
  id: string;
  name: string;
  thumbnail: string;
};

export type IngredientResult =
  | { ok: true; ingredient: string }
  | { ok: false; error: string };

export type MealResult =
  | { ok: true; meals: Meal[] }
  | { ok: false; error: string };

export type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

export type FetchImplementation = (url: string) => Promise<FetchResponse>;

const requestError = 'Could not load recipes. Try again.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMealPayload(value: unknown): value is {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
} {
  return (
    isRecord(value) &&
    typeof value.idMeal === 'string' &&
    typeof value.strMeal === 'string' &&
    typeof value.strMealThumb === 'string'
  );
}

export function normalizeIngredient(text: string): IngredientResult {
  const ingredient = text.trim().toLowerCase();
  return ingredient === ''
    ? { ok: false, error: 'Enter one ingredient.' }
    : { ok: true, ingredient };
}

export function buildMealsUrl(ingredient: string): string {
  return `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`;
}

export function normalizeMealResponse(payload: unknown): MealResult {
  if (!isRecord(payload) || !Object.hasOwn(payload, 'meals')) {
    return { ok: false, error: requestError };
  }

  const { meals } = payload;
  if (meals === null) {
    return { ok: true, meals: [] };
  }
  if (!Array.isArray(meals) || !meals.every(isMealPayload)) {
    return { ok: false, error: requestError };
  }

  return {
    ok: true,
    meals: meals.map((meal) => ({
      id: meal.idMeal,
      name: meal.strMeal,
      thumbnail: meal.strMealThumb,
    })),
  };
}

export async function fetchMeals(
  ingredient: string,
  fetchImpl: FetchImplementation = fetch,
): Promise<MealResult> {
  try {
    const response = await fetchImpl(buildMealsUrl(ingredient));
    if (!response.ok) {
      return { ok: false, error: requestError };
    }

    return normalizeMealResponse(await response.json());
  } catch {
    return { ok: false, error: requestError };
  }
}
