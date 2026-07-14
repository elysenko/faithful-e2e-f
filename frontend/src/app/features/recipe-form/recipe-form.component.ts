import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipeService, RecipeInput } from '../../core/services/recipe.service';

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
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
      // Prefill the edit form from GET /api/recipes/:id (owner-scoped; 404 → back to list).
      this.recipeService.get(this.recipeId).subscribe({
        next: (existing) => {
          this.form.patchValue({
            title: existing.title,
            ingredients: existing.ingredients,
            steps: existing.steps,
          });
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/recipes']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    const input: RecipeInput = this.form.value;
    const request$ =
      this.isEdit && this.recipeId
        ? this.recipeService.update(this.recipeId, input)
        : this.recipeService.create(input);

    request$.subscribe({
      next: () => this.router.navigate(['/recipes']),
      error: () => {
        this.saving.set(false);
        this.error.set('Could not save the recipe. Please try again.');
      },
    });
  }
}
