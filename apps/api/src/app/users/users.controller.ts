import { Body, Controller, Get, NotFoundException, Param, Patch, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiResponseOptions } from "@scholarsome/shared";
import { UsersService } from "./users.service";
import { Request as ExpressRequest } from "express";
import { User } from "@scholarsome/prisma";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { UserIdParam } from "./param/userId.param";
import { UserSuccessResponse } from "./response/success/user.success.response";
import { ErrorResponse } from "../shared/response/error.response";
import { AuthService } from "../auth/auth.service";
import { AuthenticatedGuard } from "../auth/guards/authenticated.guard";
import { UpdateSrsCadenceDto } from "./dto/updateSrsCadence.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

  /**
   * Gets the current authenticated user
   *
   * @returns `User` object
   */
  @ApiOperation({
    summary: "Get the authenticated user",
    description: "Gets the user object of the user that is currently authenticated"
  })
  @ApiOkResponse({
    description: "Expected response to a valid request",
    type: UserSuccessResponse
  })
  @ApiUnauthorizedResponse({
    description: "Invalid authentication to access the requested resource",
    type: ErrorResponse
  })
  @Get("me")
  async myUser(@Req() req: ExpressRequest): Promise<ApiResponse<User>> {
    const cookies = await this.authService.getUserInfo(req);
    if (!cookies) throw new UnauthorizedException({ status: "fail", message: "Invalid authentication to access the requested resource" });

    const user = await this.usersService.user({
      id: cookies.id
    });

    delete user.password;
    delete user.verified;
    delete user.email;

    return {
      status: ApiResponseOptions.Success,
      data: user
    };
  }

  /**
   * Updates the SRS review cadence of the current authenticated user and
   * applies the SRS parameters matching the selected cadence
   *
   * @returns `User` object
   */
  @ApiOperation({
    summary: "Update the SRS review cadence of the authenticated user",
    description: "Sets the SRS review cadence of the authenticated user and applies the SRS parameters matching the selected cadence"
  })
  @ApiOkResponse({
    description: "Expected response to a valid request",
    type: UserSuccessResponse
  })
  @ApiUnauthorizedResponse({
    description: "Invalid authentication to access the requested resource",
    type: ErrorResponse
  })
  @UseGuards(AuthenticatedGuard)
  @Patch("me/srs-cadence")
  async updateSrsCadence(@Body() body: UpdateSrsCadenceDto, @Req() req: ExpressRequest): Promise<ApiResponse<User>> {
    const cookies = await this.authService.getUserInfo(req);
    if (!cookies) throw new UnauthorizedException({ status: "fail", message: "Invalid authentication to access the requested resource" });

    const user = await this.usersService.updateSrsCadence({ id: cookies.id }, body.cadence);

    delete user.password;
    delete user.verified;
    delete user.email;

    return {
      status: ApiResponseOptions.Success,
      data: user
    };
  }

  /**
   * Gets a user given a user ID
   *
   * @returns `User` object
   */
  @ApiOperation({
    summary: "Get a user"
  })
  @ApiOkResponse({
    description: "Expected response to a valid request",
    type: UserSuccessResponse
  })
  @ApiNotFoundResponse({
    description: "Resource not found or inaccessible",
    type: ErrorResponse
  })
  @Get(":userId")
  async user(@Param() params: UserIdParam, @Req() req: ExpressRequest): Promise<ApiResponse<User>> {
    const cookies = await this.authService.getUserInfo(req);

    const user = await this.usersService.user({
      id: params.userId
    });
    if (!user) throw new NotFoundException({ status: "fail", message: "User not found" });

    delete user.password;
    delete user.verified;
    delete user.email;

    if (!cookies || user.id !== cookies.id) {
      user.sets = user.sets.filter((set) => !set.private);
      user.folders = user.folders.filter((folder) => !folder.private);
    }

    return {
      status: ApiResponseOptions.Success,
      data: user
    };
  }
}
