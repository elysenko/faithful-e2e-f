import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [RecipesController],
  providers: [RecipesService],
  imports: [AuthModule, PrismaModule],
})
export class RecipesModule {}
