import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Recipe } from '../../core/models';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recipe-list.component.html',
  styleUrl: './recipe-list.component.css',
})
export class RecipeListComponent {
  // Data contract: mock data lives in a signal<Recipe[]>. The mockup_cleaner stage
  // empties this and the service_agent wires it to RecipeService.list() in ngOnInit.
  recipes = signal<Recipe[]>([
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

  loading = signal(false);
  error = signal<string | null>(null);

  // Deep-linkable delete confirmation via ?modal=delete&id=
  private qp = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  deleteId = computed(() => (this.qp()?.get('modal') === 'delete' ? this.qp()?.get('id') ?? null : null));
  deleteTarget = computed(() => this.recipes().find((r) => r.id === this.deleteId()) ?? null);

  constructor(private route: ActivatedRoute, private router: Router) {}

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
    if (id) {
      this.recipes.update((list) => list.filter((r) => r.id !== id));
    }
    this.cancelDelete();
  }
}
