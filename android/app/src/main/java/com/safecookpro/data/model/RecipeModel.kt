package com.safecookpro.data.model

/**
 * Recipe data model for SafeCook Pro.
 *
 * Intentionally minimal — this is a supporting kitchen-safety feature,
 * not a full recipe marketplace. One featured recipe per day, per category.
 */

enum class RecipeCategory(val displayName: String, val emoji: String) {
    VEG("Veg", "🥦"),
    NON_VEG("Non-Veg", "🍗")
}

data class Recipe(
    val id: String,
    val category: RecipeCategory,
    val name: String,
    val description: String,       // One-line summary
    val prepMinutes: Int,
    val cookMinutes: Int,
    val servings: Int,
    val ingredients: List<String>, // Essential items only
    val steps: List<String>,       // Quick steps — brief and readable
    val safetyTip: String,         // One relevant kitchen-safety reminder
    val heroEmoji: String          // Used in the image placeholder area
)
