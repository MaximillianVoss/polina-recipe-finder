import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import App from '../App';
import type { FetchImplementation, FetchResponse } from '../src/meals';

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

test('shows a MealDB result and rejects blank text before fetch', async () => {
  const fetchImpl: FetchImplementation = jest
    .fn<Promise<FetchResponse>, [string]>()
    .mockResolvedValue(createResponse(mealPayload));
  const ui = render(<App fetchImpl={fetchImpl} />);

  fireEvent.press(ui.getByRole('button', { name: 'SEARCH RECIPES' }));
  expect(ui.getByLabelText('Recipe error')).toHaveTextContent('Enter one ingredient.');
  expect(fetchImpl).not.toHaveBeenCalled();

  fireEvent.changeText(ui.getByLabelText('Ingredient'), 'chicken');
  fireEvent.press(ui.getByRole('button', { name: 'SEARCH RECIPES' }));

  await waitFor(() => expect(ui.getByText('Teriyaki Chicken')).toBeOnTheScreen());
  expect(ui.getByRole('image', { name: 'Photo of Teriyaki Chicken' })).toBeOnTheScreen();
});

test('shows no-results and retryable network error states', async () => {
  const fetchImpl: FetchImplementation = jest
    .fn<Promise<FetchResponse>, [string]>()
    .mockResolvedValueOnce(createResponse({ meals: null }))
    .mockRejectedValueOnce(new Error('offline'));
  const ui = render(<App fetchImpl={fetchImpl} />);

  fireEvent.changeText(ui.getByLabelText('Ingredient'), 'unknown');
  fireEvent.press(ui.getByRole('button', { name: 'SEARCH RECIPES' }));
  await waitFor(() => expect(ui.getByLabelText('Recipe empty')).toHaveTextContent('No recipes found.'));
  expect(ui.getByLabelText('Recipe empty')).toHaveProp('accessibilityLiveRegion', 'polite');

  fireEvent.press(ui.getByRole('button', { name: 'SEARCH RECIPES' }));
  await waitFor(() => {
    expect(ui.getByRole('alert', { name: 'Recipe error' })).toHaveProp(
      'accessibilityLiveRegion',
      'assertive',
    );
  });
  expect(ui.getByRole('button', { name: 'RETRY SEARCH' })).toBeOnTheScreen();
});

test('starting a new search clears the previous result and announces loading', async () => {
  let resolveSecondRequest: ((response: FetchResponse) => void) | undefined;
  const secondRequest = new Promise<FetchResponse>((resolve) => {
    resolveSecondRequest = resolve;
  });
  const fetchImpl: FetchImplementation = jest
    .fn<Promise<FetchResponse>, [string]>()
    .mockResolvedValueOnce(createResponse(mealPayload))
    .mockReturnValueOnce(secondRequest);
  const ui = render(<App fetchImpl={fetchImpl} />);

  fireEvent.changeText(ui.getByLabelText('Ingredient'), 'chicken');
  fireEvent.press(ui.getByRole('button', { name: 'SEARCH RECIPES' }));
  await waitFor(() => expect(ui.getByText('Teriyaki Chicken')).toBeOnTheScreen());

  fireEvent.changeText(ui.getByLabelText('Ingredient'), 'beef');
  fireEvent.press(ui.getByRole('button', { name: 'SEARCH RECIPES' }));

  expect(ui.queryByText('Teriyaki Chicken')).not.toBeOnTheScreen();
  expect(ui.getByText('Loading recipes…')).toHaveProp('accessibilityLiveRegion', 'polite');

  await act(async () => {
    resolveSecondRequest?.(createResponse({ meals: null }));
  });
});

test('a failed search does not restore a result from the previous ingredient', async () => {
  const fetchImpl: FetchImplementation = jest
    .fn<Promise<FetchResponse>, [string]>()
    .mockResolvedValueOnce(createResponse(mealPayload))
    .mockRejectedValueOnce(new Error('offline'));
  const ui = render(<App fetchImpl={fetchImpl} />);

  fireEvent.changeText(ui.getByLabelText('Ingredient'), 'chicken');
  fireEvent.press(ui.getByRole('button', { name: 'SEARCH RECIPES' }));
  await waitFor(() => expect(ui.getByText('Teriyaki Chicken')).toBeOnTheScreen());

  fireEvent.changeText(ui.getByLabelText('Ingredient'), 'beef');
  fireEvent.press(ui.getByRole('button', { name: 'SEARCH RECIPES' }));
  await waitFor(() => expect(ui.getByRole('button', { name: 'RETRY SEARCH' })).toBeOnTheScreen());

  expect(ui.queryByText('Teriyaki Chicken')).not.toBeOnTheScreen();
});
