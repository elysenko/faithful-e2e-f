import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Auth, GetUser } from 'src/auth/decorators';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

/**
 * Recipe CRUD. Every route is authenticated (@Auth) and scoped to the caller's
 * user id (req.user.id, extracted via @GetUser('id')). A recipe id that does not
 * belong to the caller returns 404 (see RecipesService.findOne).
 */
@ApiTags('Recipes')
@ApiBearerAuth()
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'LIST RECIPES', description: "List the caller's recipes." })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Auth()
  findAll(@GetUser('id') userId: string) {
    return this.recipesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'GET RECIPE', description: 'Get a recipe owned by the caller.' })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Auth()
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.recipesService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'CREATE RECIPE', description: 'Create a recipe owned by the caller.' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Auth()
  create(@Body() dto: CreateRecipeDto, @GetUser('id') userId: string) {
    return this.recipesService.create(dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'UPDATE RECIPE', description: 'Update a recipe owned by the caller.' })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Auth()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
    @GetUser('id') userId: string
  ) {
    return this.recipesService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'DELETE RECIPE', description: 'Delete a recipe owned by the caller.' })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Auth()
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.recipesService.remove(id, userId);
  }
}
