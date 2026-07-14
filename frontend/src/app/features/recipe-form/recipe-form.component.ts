import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Recipe } from '../../core/models';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.css',
})
export class RecipeFormComponent implements OnInit {
  form: FormGroup;
  recipeId: string | null = null;
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  // Mock source used to prefill the edit form. mockup_cleaner empties this;
  // service_agent replaces the ngOnInit prefill with RecipeService.get(id).
  private sampleRecipes = signal<Recipe[]>([
    {
      id: 'r1',
      title: 'Banitsa',
      ingredients: '500g filo pastry, 400g Bulgarian sirene, 4 eggs, 200g yoghurt, 100g butter, 1 tsp baking soda',
      steps: 'Whisk eggs, crumbled cheese and yoghurt. Brush filo with butter, spread filling, roll and coil into a buttered pan. Bake at 200°C for 35–40 min until golden.',
      createdAt: '2026-07-10T09:20:00Z',
      updatedAt: '2026-07-10T09:20:00Z',
    },
    {
      id: 'r2',
      title: 'Shopska Salad',
      ingredients: '3 tomatoes, 2 cucumbers, 1 roasted pepper, 1 onion, 150g grated sirene, parsley, sunflower oil, red wine vinegar',
      steps: 'Dice the vegetables, toss with oil and vinegar, plate and blanket the top with a generous layer of grated sirene. Finish with parsley.',
      createdAt: '2026-07-08T17:05:00Z',
      updatedAt: '2026-07-09T08:00:00Z',
    },
    {
      id: 'r3',
      title: 'Tarator',
      ingredients: '500g yoghurt, 1 cucumber, 2 cloves garlic, walnuts, dill, water, salt, olive oil',
      steps: 'Grate the cucumber, mix with yoghurt, minced garlic, chopped dill and crushed walnuts. Thin with cold water, season, and chill before serving.',
      createdAt: '2026-07-05T12:00:00Z',
      updatedAt: '2026-07-05T12:00:00Z',
    },
  ]);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(120)]],
      ingredients: ['', [Validators.required]],
      steps: ['', [Validators.required]],
    });
  }

  get isEdit(): boolean {
    return this.recipeId !== null;
  }

  ngOnInit(): void {
    this.recipeId = this.route.snapshot.paramMap.get('id');
    if (this.recipeId) {
      this.loading.set(true);
      const existing = this.sampleRecipes().find((r) => r.id === this.recipeId);
      if (existing) {
        this.form.patchValue({
          title: existing.title,
          ingredients: existing.ingredients,
          steps: existing.steps,
        });
      }
      this.loading.set(false);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    // Mockup: no backend call — return to the list. service_agent wires
    // RecipeService.create/update here.
    this.router.navigate(['/recipes']);
  }
}
