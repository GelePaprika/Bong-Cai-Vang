
# 🌼 Bông Cải Vàng

## Project Vision
An AI-powered family meal planner for Vietnamese and Dutch families.

---

## Completed

## Session 1
- ✅ PRP completed
- ✅ UI design completed
- ✅ GitHub repository connected
- ✅ Lovable project created
- ✅ First working version generated

## Session 2
- ✅ Homepage redesigned with a warm Vietnamese family theme
- ✅ Hero image improved
- ✅ Learned GitHub project structure
- ✅ Fixed image generation bug

## Session 3
- ✅ Homepage ingredient input added
- ✅ One-click "Suggest Dinner" workflow implemented
- ✅ Started transforming the application from a chatbot into a visual meal planner

---

## Features

## Completed
- [x] Homepage
- [x] Vietnamese family hero section
- [x] Ingredient input on homepage
- [x] AI meal planning
- [x] Image generation
- [x] Multilingual support (Vietnamese, English, Dutch)

## In Progress
- [ ] Visual recipe result page
- [ ] Shopping list
- [ ] Alternative meals
- [ ] Weekly planner
- [ ] Garden Today
- [ ] Family preferences & memory

---

## Bugs

### Bug 001
**Title:** Meal image generation fails

**Status:** Solved

**Expected:**
Display a generated meal image.

**Actual:**
Shows "signal is aborted without reason" and displays the JSON tool call.

---

## Bug 002 – Visual recipe page runtime error

**Status:** 🔄 Open

### Sprint
Sprint 2 – Visual Meal Planner

### Expected
After entering ingredients on the homepage and clicking **Suggest Dinner**, the application should:

- Generate a family meal plan.
- Navigate to the visual recipe page.
- Display:
  - Hero dish image
  - Recipe summary
  - Shopping list
  - Alternative meals

### Actual
The application correctly navigates to the new visual recipe page, but no meal plan is displayed.

Instead, a runtime error appears:

> "The chef couldn't put together a plan this time. Try again with a slightly different ingredient list."

### Evidence
Runtime error originates from:

```
meal-plan.functions.ts
```

The UI navigation works correctly, suggesting the issue is in the meal planning business logic rather than the homepage or routing.

### Steps to Reproduce

1. Open the homepage.
2. Enter available ingredients.
3. Click **Suggest Dinner**.
4. The visual recipe page opens.
5. Runtime error occurs before the meal plan is rendered.

### Notes
- Homepage workflow is functioning correctly.
- Visual recipe page has been created successfully.
- The application fails while generating or returning the meal plan.
- Further investigation of `meal-plan.functions.ts` is required.

# Product Backlog

## Sprint 1 ✅
- Homepage
- Hero section
- Ingredient input
- One-click meal planning

## Sprint 2 🚧
- Visual recipe page
- Fix Bug 002
- Recipe cards

## Sprint 3
- Shopping list
- Missing ingredients
- Printable shopping list

## Sprint 4
- Weekly meal planner
- Calendar view

## Sprint 5
- Garden Today
- Seasonal vegetables
- Fish goal tracker

---

# Lessons Learned

- AI-generated software requires testing and debugging.
- Well-written bug reports significantly improve AI-generated fixes.
- Separating UI, navigation, and business logic makes debugging easier.
- GitHub is valuable not only for storing code but also for documenting project progress and decisions.

## Ideas

- Garden Today
- Weekly fish tracker
- Leftover suggestions
- Printable shopping list
