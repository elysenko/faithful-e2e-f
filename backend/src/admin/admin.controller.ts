import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@generated/prisma/client';

import { Auth } from 'src/auth/decorators';
import { AdminService } from './admin.service';

/**
 * Admin-only endpoints. @Auth(Role.admin) requires a valid JWT AND the `admin`
 * role — non-admin callers get 403, unauthenticated callers get 401.
 */
@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'ADMIN OVERVIEW',
    description: 'Per-user recipe counts. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Auth(Role.admin)
  overview() {
    return this.adminService.overview();
  }

  @Get('settings')
  @ApiOperation({
    summary: 'ADMIN SETTINGS',
    description: 'Masked infrastructure settings resolved from environment. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Auth(Role.admin)
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({
    summary: 'UPDATE ADMIN SETTINGS',
    description: 'Acknowledge settings changes and return current effective settings. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Auth(Role.admin)
  updateSettings(@Body() patch: Record<string, string>) {
    return this.adminService.updateSettings(patch ?? {});
  }
}
