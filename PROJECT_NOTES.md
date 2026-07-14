
# 🌼 Bông Cải Vàng

## Project Vision
An AI-powered family meal planner for Vietnamese and Dutch families.

--
# Version 1.0 Highlights

- 🌼 AI-powered family meal planner
- 🥗 Smart meal recommendations from available ingredients
- 🌱 Garden Vision AI (photo recognition)
- ❤️ Family Cookbook (Favourite recipes)
- 👨‍👩‍👧‍👦 Family Profile with cooking preferences
- 📅 Weekly Meal Planner
- 🛒 Intelligent shopping list
- 🌍 Multilingual shopping list
- 🖨 Printable meal plans and shopping lists
- 💾 Continue This Week (local persistence)
  
---

## Completed

## Session 1 – Foundation
- ✅ PRP completed
- ✅ UI design completed
- ✅ GitHub repository connected
- ✅ Lovable project created
- ✅ First working version generated

---

## Session 2 – Homepage & Learning
- ✅ Homepage redesigned with a warm Vietnamese family theme
- ✅ Hero image improved
- ✅ Learned GitHub project structure
- ✅ Fixed image generation bug
- ✅ Learned how to work with AI-generated code and GitHub

---

## Session 3 – AI Meal Planner
- ✅ Homepage ingredient input added
- ✅ One-click "Suggest Dinner" workflow implemented
- ✅ Transformed the application from a chatbot into a visual meal planner
- ✅ Beautiful recipe page with hero image, recipe summary and shopping list
- ✅ Alternative meal suggestions implemented
- ✅ Regenerate meal function added

---

## Session 4 – Family Experience
- ✅ Family Profile page created
- ✅ Family size preference
- ✅ Favourite cuisines
- ✅ Healthy cooking preferences
- ✅ Dietary rules & dislikes
- ✅ Weekly cooking rhythm
- ✅ Save profile locally
- ✅ Vietnamese font rendering significantly improved
- ✅ Family Cookbook (Favourite recipes) implemented

---

## Session 5 – Garden Vision AI
- ✅ Garden Today section enhanced
- ✅ AI photo recognition for garden vegetables
- ✅ Upload garden photo
- ✅ AI detects harvested vegetables
- ✅ Automatically merges detected vegetables with manual input
- ✅ Duplicate ingredients are automatically avoided
- ✅ First multimodal AI feature completed

---

## Session 6 – Weekly Planner
- ✅ Weekly Meal Planner page created
- ✅ Optional "What we already have" input
- ✅ AI generates a complete 7-day meal plan
- ✅ Reuses existing ingredients to reduce waste
- ✅ Weekly shopping list generated automatically
- ✅ Beautiful printable weekly planner layout
- ✅ Printable shopping list
- ✅ Continue This Week feature
- ✅ Save one active weekly plan locally
- ✅ Plan a New Week workflow

---

## Session 7 – Printing & Localization
- ✅ Weekly Meal Plan PDF export
- ✅ Shopping List PDF export
- ✅ Shopping list language selector
- ✅ Dutch shopping list translation
- ✅ Vietnamese shopping list translation
- ✅ Printer-friendly layouts optimized

---

# Learning Achievements

Throughout this project I learned:

- ✅ End-to-end AI product development
- ✅ PRP-driven application design
- ✅ Working with Lovable as an AI software engineer
- ✅ GitHub version control
- ✅ Modern web application structure
- ✅ Supabase integration
- ✅ Replit project import and deployment workflow
- ✅ Debugging AI-generated applications
- ✅ Prompt engineering for software development
- ✅ Product thinking and feature prioritization
- ✅ Building multimodal AI applications
- ✅ Iterative software development with Generative AI

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

**Status:** 🔄 Solve

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

---

# Lessons Learned

- AI-generated software requires testing and debugging.
- Well-written bug reports significantly improve AI-generated fixes.
- Separating UI, navigation, and business logic makes debugging easier.
- GitHub is valuable not only for storing code but also for documenting project progress and decisions.

# Product Backlog – Version 1.1
## Enhancement #1 – Friendly PDF File Names

Priority: Low
Status: Deferred to Version 1.1

Current behavior

Exported PDF files use generic filenames that are not easy to identify later.

Desired behavior

Automatically generate meaningful filenames.

Weekly Meal Plan

Bông Cải Vàng - Weekly Meal Plan - YYYY-MM-DD.pdf

Example

Bông Cải Vàng - Weekly Meal Plan - 2026-07-14.pdf

Shopping List

Bông Cải Vàng - Shopping List - YYYY-MM-DD.pdf

Example

Bông Cải Vàng - Shopping List - 2026-07-14.pdf
Notes
Use the system date.
Use ISO date format (YYYY-MM-DD).
Generate filenames automatically.
No user input required.


## Enhancement #2 – Complete English Shopping List

Priority: Low
Status: Deferred to Version 1.1

Current behavior

Shopping List Language works correctly.

Dutch displays Dutch ingredient names.

Vietnamese displays Vietnamese ingredient names.

English still displays:

Thịt ba chỉ (Pork belly)

instead of

Pork belly
Desired behavior

Shopping List Language should completely determine the displayed language.

Vietnamese

Thịt ba chỉ
Đậu phụ
Cà chua

English

Pork belly
Tofu
Tomatoes

Dutch

Speklappen
Tofu
Tomaten

No mixed-language labels.

No parentheses.

Applies to
Shopping List panel
Printed Shopping List
Exported Shopping List PDF

Recipe pages should remain unchanged (Vietnamese title + English subtitle).

Future Improvement

Use a fixed multilingual ingredient dictionary instead of AI-generated translations to ensure consistent terminology.
