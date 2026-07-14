import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateRecipeDto {
  @ApiProperty({
    description: 'Recipe title',
    nullable: false,
    required: true,
    type: 'string',
    example: 'Banitsa',
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'Ingredients (free text)',
    nullable: false,
    required: true,
    type: 'string',
    example: 'Filo pastry, feta cheese, eggs, yogurt, butter',
  })
  @IsString()
  @MinLength(1)
  ingredients: string;

  @ApiProperty({
    description: 'Preparation steps (free text)',
    nullable: false,
    required: true,
    type: 'string',
    example: '1. Whisk eggs and yogurt. 2. Layer filo with feta. 3. Bake at 200C.',
  })
  @IsString()
  @MinLength(1)
  steps: string;
}
