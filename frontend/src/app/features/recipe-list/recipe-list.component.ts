import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Recipe } from '../../core/models';
import { RecipeService } from '../../core/services/recipe.service';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recipe-list.component.html',
  styleUrl: './recipe-list.component.css',
})
export class RecipeListComponent implements OnInit {
  // Live data: populated from RecipeService.list() (GET /api/recipes) in ngOnInit.
  recipes = signal<Recipe[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);

  // Deep-linkable delete confirmation via ?modal=delete&id=
  private qp = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  deleteId = computed(() => (this.qp()?.get('modal') === 'delete' ? this.qp()?.get('id') ?? null : null));
  deleteTarget = computed(() => this.recipes().find((r) => r.id === this.deleteId()) ?? null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  private loadRecipes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.recipeService.list().subscribe({
      next: (recipes) => {
        this.recipes.set(recipes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your recipes. Please try again.');
        this.loading.set(false);
      },
    });
  }

  askDelete(id: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { modal: 'delete', id },
      queryParamsHandling: 'merge',
    });
  }

  cancelDelete(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { modal: null, id: null },
      queryParamsHandling: 'merge',
    });
  }

  confirmDelete(): void {
    const id = this.deleteId();
    if (!id) {
      this.cancelDelete();
      return;
    }
    this.recipeService.remove(id).subscribe({
      next: () => {
        this.recipes.update((list) => list.filter((r) => r.id !== id));
        this.cancelDelete();
      },
      error: () => {
        this.error.set('Could not delete the recipe. Please try again.');
        this.cancelDelete();
      },
    });
  }
}
