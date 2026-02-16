import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AdminService } from 'src/admins/admins.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import {
  constructErrorResponse,
  constructSuccessResponse,
} from 'src/utils/helper';

@ApiTags('admins')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@Controller('/')
export class AdminController {
  constructor(private readonly adminServices: AdminService) {}

  @Get('/profile')
  @ApiOperation({
    summary: 'Get current admin info',
  })
  async adminProfile(@Req() request) {
    try {
      const result = await this.adminServices.getAdminProfile(
        request?.user?._id,
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Put('/updateProfile')
  @ApiOperation({
    summary: 'Update admin profile info',
  })
  async updateProfile(@Body() updatedData, @Req() request) {
    try {
      const result = await this.adminServices.updateAdminProfile(
        updatedData,
        request?.user,
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get('/getAdmins')
  @ApiOperation({
    summary: 'Get all admins list',
  })
  async getAllAdmins(@Query() filters: string) {
    try {
      const result = await this.adminServices.getAllAdmins(filters);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Delete('/:id')
  async deleteAdmin(@Param('id') _id: string) {
    try {
      const result = await this.adminServices.deleteAdmin(_id);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }
}
