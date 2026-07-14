import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger('RecipesService');

  constructor(private prisma: PrismaService) {}

  /** List every recipe owned by the caller, newest first. */
  async findAll(userId: string) {
    try {
      return await this.prisma.recipe.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`GET recipes: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  /**
   * Fetch a single recipe owned by the caller.
   * A non-existent OR non-owned id both return 404 so ownership is not leaked.
   */
  async findOne(id: string, userId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, userId },
    });

    if (!recipe) throw new NotFoundException('Recipe not found');

    return recipe;
  }

  async create(dto: CreateRecipeDto, userId: string) {
    try {
      return await this.prisma.recipe.create({
        data: { ...dto, userId },
      });
    } catch (error) {
      this.logger.error(`POST recipes: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async update(id: string, dto: UpdateRecipeDto, userId: string) {
    // Ownership check (throws 404 if not owned / missing) before mutating.
    await this.findOne(id, userId);

    try {
      return await this.prisma.recipe.update({
        where: { id },
        data: { ...dto },
      });
    } catch (error) {
      this.logger.error(`PATCH recipes/${id}: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async remove(id: string, userId: string) {
    // Ownership check (throws 404 if not owned / missing) before deleting.
    await this.findOne(id, userId);

    try {
      await this.prisma.recipe.delete({ where: { id } });
      return { message: 'Recipe deleted' };
    } catch (error) {
      this.logger.error(`DELETE recipes/${id}: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }
}
