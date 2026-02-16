import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SuspendUserDto } from 'src/users/dto/suspend-user.dto';
import {
  constructErrorResponse,
  constructSuccessResponse,
} from 'src/utils/helper';

import { GetUserDto } from './dto/get-user.dto';
import { UpdateUserStatus } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns list of all users' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async findAll(@Query() queryParams: GetUserDto) {
    try {
      const result = await this.usersService.getAllUser(queryParams);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update user details' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateData: UpdateUserDto,
  ) {
    try {
      const result = await this.usersService.update(userId, updateData);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  // TODO: Need to update this in future

  // @Put(':userId/suspend')
  // @ApiOperation({ summary: 'Suspend user account' })
  // @ApiResponse({ status: 200, description: 'User account suspended' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async suspendUser(@Param('userId') userId: string) {
  //   try {
  //     const result = await this.usersService.suspendUser(userId);
  //     return constructSuccessResponse(result);
  //   } catch (error) {
  //     return constructErrorResponse(error);
  //   }
  // }
  // TODO: Need to update this in future

  // @Put(':userId/suspend')
  // @ApiOperation({ summary: 'Suspend user account' })
  // @ApiResponse({ status: 200, description: 'User account suspended' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async suspendUser(@Param('userId') userId: string) {
  //   try {
  //     const result = await this.usersService.suspendUser(userId);
  //     return constructSuccessResponse(result);
  //   } catch (error) {
  //     return constructErrorResponse(error);
  //   }
  // }

  // @Put(':userId/block')
  // @ApiOperation({ summary: 'Block user account' })
  // @ApiResponse({ status: 200, description: 'User account blocked' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async blockUser(@Param('userId') userId: string) {
  //   try {
  //     const result = await this.usersService.blockUser(userId);
  //     return constructSuccessResponse(result);
  //   } catch (error) {
  //     return constructErrorResponse(error);
  //   }
  // }
  // @Put(':userId/block')
  // @ApiOperation({ summary: 'Block user account' })
  // @ApiResponse({ status: 200, description: 'User account blocked' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async blockUser(@Param('userId') userId: string) {
  //   try {
  //     const result = await this.usersService.blockUser(userId);
  //     return constructSuccessResponse(result);
  //   } catch (error) {
  //     return constructErrorResponse(error);
  //   }
  // }

  // @Put(':userId/activate')
  // @ApiOperation({ summary: 'Activate user account' })
  // @ApiResponse({ status: 200, description: 'User account activated' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async activateUser(@Param('userId') userId: string) {
  //   try {
  //     const result = await this.usersService.activateUser(userId);
  //     return constructSuccessResponse(result);
  //   } catch (error) {
  //     return constructErrorResponse(error);
  //   }
  // }

  // @Put(':userId/kyc')
  // @ApiOperation({ summary: 'Update user KYC status' })
  // @ApiBody({ type: UpdateKycDto })
  // @ApiResponse({ status: 200, description: 'KYC status updated successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // async updateKycStatus(
  //   @Param('userId') userId: string,
  //   @Body() kycData: UpdateKycDto,
  // ) {
  //   try {
  //     const result = await this.usersService.updateKycStatus(userId, kycData);
  //     return constructSuccessResponse(result);
  //   } catch (error) {
  //     return constructErrorResponse(error);
  //   }
  // }
  // @Put(':userId/activate')
  // @ApiOperation({ summary: 'Activate user account' })
  // @ApiResponse({ status: 200, description: 'User account activated' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async activateUser(@Param('userId') userId: string) {
  //   try {
  //     const result = await this.usersService.activateUser(userId);
  //     return constructSuccessResponse(result);
  //   } catch (error) {
  //     return constructErrorResponse(error);
  //   }
  // }

  // @Put(':userId/kyc')
  // @ApiOperation({ summary: 'Update user KYC status' })
  // @ApiBody({ type: UpdateKycDto })
  // @ApiResponse({ status: 200, description: 'KYC status updated successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // async updateKycStatus(
  //   @Param('userId') userId: string,
  //   @Body() kycData: UpdateKycDto,
  // ) {
  //   try {
  //     const result = await this.usersService.updateKycStatus(userId, kycData);
  //     return constructSuccessResponse(result);
  //   } catch (error) {
  //     return constructErrorResponse(error);
  //   }
  // }

  @Get('kyc-requests')
  @ApiOperation({ summary: 'Get KYC requests' })
  @ApiResponse({ status: 200, description: 'Returns list of KYC requests' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getKycRequests() {
    try {
      const result = await this.usersService.getKycRequests();
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Patch('update-user-status/:userId')
  @ApiParam({ name: 'userId' })
  @ApiOperation({ summary: 'Block or Activate the  user' })
  @ApiBody({ type: UpdateUserStatus })
  @ApiResponse({
    status: 200,
    description: 'User blocked or activated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async blockOrActivateUser(
    @Body() userDetails: UpdateUserStatus,
    @Param() { userId }: { userId: string },
  ) {
    return this.usersService.blockOrActivateUser(userDetails, userId);
  }

  @Patch('update-user/:userId/suspend')
  @ApiParam({ name: 'userId' })
  @ApiOperation({ summary: 'Suspend the user' })
  @ApiBody({ type: SuspendUserDto })
  @ApiResponse({
    status: 200,
    description: 'User suspended successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async suspendUser(
    @Body() userDetails: SuspendUserDto,
    @Param() { userId }: { userId: string },
  ) {
    return this.usersService.suspendUser(userDetails, userId);
  }

  @Get('/:userId')
  async getUser(@Param() { userId }: { userId: string }) {
    return this.usersService.getUser(userId);
  }

  @Patch('/feedback')
  async updateUserFeedback(
    @Body() feedbackData: { userId: string; feedback: string },
  ) {
    return this.usersService.updateUserFeedback(feedbackData);
  }
}
