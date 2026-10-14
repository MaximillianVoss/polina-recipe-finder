import { useState } from 'react';
import { Button, FlatList, Image, Text, TextInput, View } from 'react-native';
import {
  fetchMeals,
  normalizeIngredient,
  type FetchImplementation,
  type Meal,
} from './src/meals';

type AppProps = {
  fetchImpl?: FetchImplementation;
};

export default function App({ fetchImpl }: AppProps): React.JSX.Element {
  const [ingredientText, setIngredientText] = useState('');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searched, setSearched] = useState(false);

  async function search(): Promise<void> {
    const ingredient = normalizeIngredient(ingredientText);
    if (!ingredient.ok) {
      setErrorMessage(ingredient.error);
      return;
    }

    setMeals([]);
    setLoading(true);
    setErrorMessage('');
    const result = await fetchMeals(ingredient.ingredient, fetchImpl);
    setLoading(false);
    setSearched(true);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setMeals(result.meals);
  }

  function renderMeal({ item }: { item: Meal }): React.JSX.Element {
    return (
      <View>
        <Image
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Photo of ${item.name}`}
          source={{ uri: item.thumbnail }}
          style={{ width: 80, height: 80 }}
        />
        <Text>{item.name}</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12, padding: 16 }}>
      <Text>Ingredient</Text>
      <TextInput
        accessibilityLabel="Ingredient"
        placeholder="e.g. chicken"
        value={ingredientText}
        onChangeText={setIngredientText}
      />
      <Button title="SEARCH RECIPES" disabled={loading} onPress={search} />
      {loading ? <Text accessibilityLiveRegion="polite">Loading recipes…</Text> : null}
      {errorMessage ? (
        <Text
          accessibilityLabel="Recipe error"
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {errorMessage}
        </Text>
      ) : null}
      {searched && !loading && !errorMessage && meals.length === 0 ? (
        <Text accessibilityLabel="Recipe empty" accessibilityLiveRegion="polite">
          No recipes found.
        </Text>
      ) : null}
      {errorMessage === 'Could not load recipes. Try again.' ? (
        <Button title="RETRY SEARCH" disabled={loading} onPress={search} />
      ) : null}
      <FlatList data={meals} keyExtractor={(item) => item.id} renderItem={renderMeal} />
    </View>
  );
}
