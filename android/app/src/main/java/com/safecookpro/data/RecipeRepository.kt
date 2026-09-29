package com.safecookpro.data

import com.safecookpro.data.model.Recipe
import com.safecookpro.data.model.RecipeCategory
import java.util.Calendar

/**
 * RecipeRepository — local mock data source for SafeCook Pro recipes.
 *
 * No network, no Firebase, no API.
 * "Today's Special" is chosen deterministically from day-of-year % count,
 * so it rotates daily but is stable throughout any given day.
 */
object RecipeRepository {

    private val allRecipes: List<Recipe> = listOf(

        // ── VEG ──────────────────────────────────────────────────────────────

        Recipe(
            id          = "veg_1",
            category    = RecipeCategory.VEG,
            name        = "Paneer Butter Masala",
            description = "Rich, creamy and comforting — a simple dinner idea for today.",
            prepMinutes = 15,
            cookMinutes = 25,
            servings    = 3,
            heroEmoji   = "🧀",
            ingredients = listOf(
                "Paneer — 250 g, cubed",
                "Tomatoes — 3 medium, pureed",
                "Onion — 1 large, finely chopped",
                "Butter — 2 tbsp",
                "Fresh cream — 3 tbsp",
                "Ginger-garlic paste — 1 tsp",
                "Kashmiri chilli powder — 1 tsp",
                "Garam masala — ½ tsp",
                "Salt to taste"
            ),
            steps = listOf(
                "Heat butter in a heavy-bottomed pan over medium flame.",
                "Sauté onion until golden, then add ginger-garlic paste and cook 1 min.",
                "Pour in tomato puree and cook, stirring often, until oil separates.",
                "Add chilli powder, garam masala, and salt; stir well.",
                "Add paneer cubes and fold gently to coat with the masala.",
                "Stir in cream, simmer on low heat for 3–4 min, and serve."
            ),
            safetyTip = "Keep the vessel centred over the burner and reduce to a low flame before adding cream."
        ),

        Recipe(
            id          = "veg_2",
            category    = RecipeCategory.VEG,
            name        = "Vegetable Pulao",
            description = "Fragrant, lightly spiced rice — ready in under 30 minutes.",
            prepMinutes = 10,
            cookMinutes = 20,
            servings    = 4,
            heroEmoji   = "🍚",
            ingredients = listOf(
                "Basmati rice — 1½ cups, soaked 20 min",
                "Mixed vegetables — 1 cup (carrot, beans, peas)",
                "Onion — 1 medium, sliced",
                "Whole spices — bay leaf, cloves, cardamom",
                "Ghee — 1 tbsp",
                "Salt to taste",
                "Water — 2¾ cups"
            ),
            steps = listOf(
                "Heat ghee in a deep pot; add whole spices and let them splutter.",
                "Add onion slices and sauté until softened and lightly golden.",
                "Add vegetables and stir-fry for 2 min.",
                "Drain soaked rice and add to the pot; stir gently for 1 min.",
                "Pour in water and salt; bring to a boil, then cover tightly.",
                "Cook on the lowest flame for 12–15 min until rice is tender."
            ),
            safetyTip = "Turn off the burner as soon as the rice is done — residual heat will finish cooking without burning the bottom."
        ),

        Recipe(
            id          = "veg_3",
            category    = RecipeCategory.VEG,
            name        = "Masala Dosa",
            description = "Crispy golden dosa with spiced potato filling — a classic morning favourite.",
            prepMinutes = 15,
            cookMinutes = 20,
            servings    = 2,
            heroEmoji   = "🫓",
            ingredients = listOf(
                "Ready dosa batter — 2 cups",
                "Potatoes — 3 medium, boiled and mashed",
                "Onion — 1, finely chopped",
                "Green chilli — 1, finely sliced",
                "Mustard seeds — ½ tsp",
                "Turmeric — a pinch",
                "Curry leaves — a few",
                "Oil — for cooking"
            ),
            steps = listOf(
                "Heat a tawa on medium-high until a water drop sizzles and evaporates instantly.",
                "Make the filling: temper mustard seeds and curry leaves, add onion and chilli, then potato and turmeric.",
                "Pour a ladle of batter onto the hot tawa and spread in a thin circle.",
                "Drizzle a little oil along the edges; cook until the surface looks dry.",
                "Place a spoonful of filling in the centre, fold the dosa, and serve hot."
            ),
            safetyTip = "Keep the tawa handle away from the flame; use a dry cloth — not a wet one — when handling a hot pan."
        ),

        // ── NON-VEG ──────────────────────────────────────────────────────────

        Recipe(
            id          = "nonveg_1",
            category    = RecipeCategory.NON_VEG,
            name        = "Chicken Pepper Fry",
            description = "Bold, peppery, and satisfying — best served with steamed rice or parotta.",
            prepMinutes = 10,
            cookMinutes = 30,
            servings    = 3,
            heroEmoji   = "🍗",
            ingredients = listOf(
                "Chicken — 500 g, curry-cut pieces",
                "Onion — 2 medium, finely chopped",
                "Black pepper — 1½ tsp, coarsely ground",
                "Ginger-garlic paste — 1½ tsp",
                "Curry leaves — a small bunch",
                "Oil — 2 tbsp",
                "Salt to taste",
                "Fennel seeds — ½ tsp"
            ),
            steps = listOf(
                "Heat oil in a thick-bottomed pan; add fennel seeds and curry leaves.",
                "Add onions and sauté over medium heat until deep golden.",
                "Add ginger-garlic paste and cook for 2 min until raw smell disappears.",
                "Add chicken pieces, salt, and half the pepper; mix well.",
                "Cover and cook on medium-low flame for 20 min, stirring occasionally.",
                "Uncover, increase heat, and add remaining pepper; stir-fry until dry and coated."
            ),
            safetyTip = "Always ensure the chicken is fully cooked through before serving — cut the thickest piece to check there is no pink inside."
        ),

        Recipe(
            id          = "nonveg_2",
            category    = RecipeCategory.NON_VEG,
            name        = "Egg Curry",
            description = "Simple, hearty egg curry in a tangy tomato-onion gravy — ready in 25 minutes.",
            prepMinutes = 5,
            cookMinutes = 20,
            servings    = 2,
            heroEmoji   = "🥚",
            ingredients = listOf(
                "Eggs — 4, hard-boiled and peeled",
                "Tomatoes — 2 medium, chopped",
                "Onion — 1 large, finely chopped",
                "Oil — 1½ tbsp",
                "Chilli powder — ¾ tsp",
                "Coriander powder — 1 tsp",
                "Garam masala — ½ tsp",
                "Salt to taste",
                "Fresh coriander — for garnish"
            ),
            steps = listOf(
                "Heat oil in a pan; add onions and cook until golden.",
                "Add tomatoes, all spice powders, and salt; cook until tomatoes soften and oil surfaces.",
                "Add ½ cup water and bring to a gentle simmer.",
                "Lightly score the boiled eggs and slide them into the gravy.",
                "Simmer for 5 min so eggs absorb the flavours; garnish with coriander."
            ),
            safetyTip = "Place a lid slightly ajar when simmering — this prevents spattering hot gravy while still letting steam escape."
        ),

        Recipe(
            id          = "nonveg_3",
            category    = RecipeCategory.NON_VEG,
            name        = "Chicken Biryani",
            description = "Aromatic, layered biryani — a weekend showstopper that feeds the whole family.",
            prepMinutes = 30,
            cookMinutes = 45,
            servings    = 5,
            heroEmoji   = "🍛",
            ingredients = listOf(
                "Chicken — 750 g, bone-in pieces",
                "Basmati rice — 2 cups, soaked 30 min",
                "Onion — 3 large, thinly sliced (for fried onions)",
                "Yoghurt — ½ cup",
                "Ginger-garlic paste — 2 tsp",
                "Whole spices — bay leaf, cinnamon, cardamom, cloves",
                "Mint and coriander leaves — generously",
                "Saffron — a pinch, soaked in 2 tbsp warm milk",
                "Oil and ghee — 2 tbsp each",
                "Salt to taste"
            ),
            steps = listOf(
                "Marinate chicken with yoghurt, ginger-garlic paste, and salt for at least 20 min.",
                "Deep-fry the sliced onions until crisp and golden; set aside.",
                "Parboil the soaked rice in salted water with whole spices until 70% cooked; drain.",
                "In a heavy pot, layer the marinated chicken, half the fried onions, mint, and coriander.",
                "Top with parboiled rice and drizzle saffron milk; seal the lid tightly with dough or foil.",
                "Cook on high for 5 min, then reduce to the lowest flame for 30 min (dum).",
                "Rest 10 min before opening; gently mix from the bottom and serve."
            ),
            safetyTip = "When cooking on dum, never leave the stove unattended — set a timer and stay nearby so you can reduce heat quickly if needed."
        )
    )

    /** All recipes for a given category. */
    fun forCategory(category: RecipeCategory): List<Recipe> =
        allRecipes.filter { it.category == category }

    /**
     * Today's featured recipe — deterministic, rotates daily.
     * Same recipe returned for the full day; changes at midnight.
     */
    fun todaysSpecial(category: RecipeCategory): Recipe {
        val pool     = forCategory(category)
        val dayIndex = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
        return pool[dayIndex % pool.size]
    }
}
