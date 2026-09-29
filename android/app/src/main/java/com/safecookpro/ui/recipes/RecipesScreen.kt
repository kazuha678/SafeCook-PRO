package com.safecookpro.ui.recipes

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safecookpro.R
import com.safecookpro.data.RecipeRepository
import com.safecookpro.data.model.Recipe
import com.safecookpro.data.model.RecipeCategory
import com.safecookpro.ui.theme.SafeCookColors

/**
 * Recipes Screen — SafeCook Pro
 *
 * Design intention: Calm · Breathable · Consumer Appliance Companion
 * Direct, uncluttered presentation of "Today's Special".
 * Avoids excessive card wrapping, floating blobs, or food-delivery visual clutter.
 */
@Composable
fun RecipesScreen() {
    var selectedCategory by remember { mutableStateOf(RecipeCategory.VEG) }
    val recipe = remember(selectedCategory) {
        RecipeRepository.todaysSpecial(selectedCategory)
    }
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp, vertical = 20.dp)
    ) {
        // ── 1. Top Screen Header ──────────────────────────────────────────────
        Text(
            text = stringResource(R.string.todays_special),
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = stringResource(R.string.todays_special_sub),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(20.dp))

        // ── 2. Category Switcher (VEG / NON-VEG) ──────────────────────────────
        CategorySelector(
            selected = selectedCategory,
            onSelect = { selectedCategory = it }
        )

        Spacer(modifier = Modifier.height(24.dp))

        // ── 3. Featured Recipe Details ────────────────────────────────────────
        FeaturedRecipeSection(recipe = recipe)

        Spacer(modifier = Modifier.height(24.dp))
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
        Spacer(modifier = Modifier.height(24.dp))

        // ── 4. Ingredients (Readable list without excessive card wrapping) ─────
        IngredientsSection(ingredients = recipe.ingredients)

        Spacer(modifier = Modifier.height(24.dp))
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
        Spacer(modifier = Modifier.height(24.dp))

        // ── 5. Quick Steps (Numbered direct steps) ────────────────────────────
        QuickStepsSection(steps = recipe.steps)

        Spacer(modifier = Modifier.height(24.dp))
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
        Spacer(modifier = Modifier.height(24.dp))

        // ── 6. Kitchen Tip (Calm appliance companion) ─────────────────────────
        KitchenTipSection(tip = recipe.safetyTip)

        Spacer(modifier = Modifier.height(28.dp))
    }
}

// ── Sub-components ────────────────────────────────────────────────────────────

@Composable
private fun CategorySelector(
    selected: RecipeCategory,
    onSelect: (RecipeCategory) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outlineVariant,
                shape = RoundedCornerShape(12.dp)
            )
    ) {
        val categories = listOf(RecipeCategory.VEG, RecipeCategory.NON_VEG)
        categories.forEachIndexed { index, category ->
            val isSelected = selected == category
            val label = if (category == RecipeCategory.VEG) {
                stringResource(R.string.category_veg)
            } else {
                stringResource(R.string.category_non_veg)
            }
            val accentColor = if (category == RecipeCategory.VEG) {
                SafeCookColors.emerald
            } else {
                SafeCookColors.amber
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 48.dp) // Minimum 48dp touch target
                    .clip(RoundedCornerShape(11.dp))
                    .background(
                        if (isSelected) accentColor.copy(alpha = 0.12f)
                        else Color.Transparent
                    )
                    .clickable { onSelect(category) }
                    .semantics {
                        role = Role.RadioButton
                        contentDescription = "$label, ${if (isSelected) "selected" else "not selected"}"
                    }
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(if (isSelected) accentColor else MaterialTheme.colorScheme.outlineVariant)
                    )
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        ),
                        color = if (isSelected) accentColor else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (index < categories.size - 1) {
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(48.dp)
                        .background(MaterialTheme.colorScheme.outlineVariant)
                )
            }
        }
    }
}

@Composable
private fun FeaturedRecipeSection(recipe: Recipe) {
    val accentColor = if (recipe.category == RecipeCategory.VEG) SafeCookColors.emerald else SafeCookColors.amber
    val categoryLabel = if (recipe.category == RecipeCategory.VEG) stringResource(R.string.category_veg) else stringResource(R.string.category_non_veg)

    Column(modifier = Modifier.fillMaxWidth()) {
        // Subtle category badge
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(accentColor)
            )
            Text(
                text = categoryLabel,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.sp
                ),
                color = accentColor
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Recipe Title
        Text(
            text = recipe.name,
            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(6.dp))

        // Short description
        Text(
            text = recipe.description,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Clean metadata line (Prep · Cook · Serves)
        val prepStr = "${recipe.prepMinutes} ${stringResource(R.string.recipe_min)} ${stringResource(R.string.recipe_prep)}"
        val cookStr = "${recipe.cookMinutes} ${stringResource(R.string.recipe_min)} ${stringResource(R.string.recipe_cook)}"
        val servesStr = "${stringResource(R.string.recipe_serves)} ${recipe.servings}"

        Text(
            text = "$prepStr  ·  $cookStr  ·  $servesStr",
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun IngredientsSection(ingredients: List<String>) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = stringResource(R.string.recipe_ingredients),
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(12.dp))

        ingredients.forEach { item ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = "•",
                    style = MaterialTheme.typography.bodyMedium,
                    color = SafeCookColors.emerald,
                    modifier = Modifier.padding(end = 12.dp)
                )
                Text(
                    text = item,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun QuickStepsSection(steps: List<String>) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = stringResource(R.string.recipe_quick_steps),
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(14.dp))

        steps.forEachIndexed { index, step ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp),
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = "${index + 1}.",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = SafeCookColors.emerald,
                    modifier = Modifier.width(24.dp)
                )
                Text(
                    text = step,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun KitchenTipSection(tip: String) {
    // Single subtle companion card — calm, non-alarming
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(SafeCookColors.emerald.copy(alpha = 0.08f))
            .border(
                width = 1.dp,
                color = SafeCookColors.emerald.copy(alpha = 0.25f),
                shape = RoundedCornerShape(12.dp)
            )
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = Icons.Default.Shield,
                contentDescription = null,
                tint = SafeCookColors.emerald,
                modifier = Modifier
                    .size(20.dp)
                    .padding(top = 2.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = stringResource(R.string.recipe_kitchen_tip).uppercase(),
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    ),
                    color = SafeCookColors.emerald
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = tip,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}
