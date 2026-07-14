import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Recipe } from '../models';

export interface RecipeInput {
  title: string;
  ingredients: string;
  steps: string;
}

/**
 * HTTP client for the caller-scoped Recipe CRUD endpoints
 * (GET/POST /api/recipes, GET/PATCH/DELETE /api/recipes/:id).
 * Components render mock signals in the mockup; the service_agent stage wires
 * these methods into the components' ngOnInit / submit handlers.
 */
@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly base = `${environment.apiUrl}/recipes`;

  constructor(private http: HttpClient) {}

  list(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.base);
  }

  get(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.base}/${id}`);
  }

  create(input: RecipeInput): Observable<Recipe> {
    return this.http.post<Recipe>(this.base, input);
  }

  update(id: string, input: RecipeInput): Observable<Recipe> {
    return this.http.patch<Recipe>(`${this.base}/${id}`, input);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
